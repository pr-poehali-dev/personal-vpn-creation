import { useRef, useCallback, useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { Peer, osOptions, generateFakeKey, buildWgConfig, SERVER_PUB_KEY, SERVER_ENDPOINT } from "./types";

// ── QR Canvas ──────────────────────────────────────────────────────────────
export function QrCanvas({ text, size = 200 }: { text: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cells = 25;
    const cell = size / cells;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#080c14";
    ctx.fillRect(0, 0, size, size);

    let seed = 0;
    for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) & 0xffffffff;
    const rng = (s: number) => { s = Math.sin(s) * 10000; return s - Math.floor(s); };

    const matrix: boolean[][] = Array.from({ length: cells }, (_, r) =>
      Array.from({ length: cells }, (_, c) => {
        const inFinder = (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
        if (inFinder) {
          const nr = r < 7 ? r : r - (cells - 7);
          const nc = c < 7 ? c : c - (cells - 7);
          return (nr === 0 || nr === 6 || nc === 0 || nc === 6) ||
                 (nr >= 2 && nr <= 4 && nc >= 2 && nc <= 4);
        }
        return rng(seed + r * cells + c) > 0.45;
      })
    );

    matrix.forEach((row, r) => {
      row.forEach((on, c) => {
        if (on) {
          ctx.fillStyle = "#00ffaa";
          ctx.shadowColor = "#00ffaa";
          ctx.shadowBlur = 2;
          ctx.fillRect(c * cell + 0.5, r * cell + 0.5, cell - 1, cell - 1);
        }
      });
    });
  }, [text, size]);

  useEffect(() => { draw(); }, [draw]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ imageRendering: "pixelated" }} />;
}

// ── Modal wrapper ──────────────────────────────────────────────────────────
export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,8,15,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="animate-fade-in w-full max-w-lg"
        style={{ background: "#0d1520", border: "1px solid rgba(0,255,170,0.2)", borderRadius: "20px", boxShadow: "0 0 60px rgba(0,255,170,0.08)" }}>
        {children}
      </div>
    </div>
  );
}

// ── Add Peer Modal ─────────────────────────────────────────────────────────
interface AddPeerModalProps {
  nextIp: string;
  onAdd: (peer: Peer) => void;
  onClose: () => void;
  onQr: (peer: Peer) => void;
}

export function AddPeerModal({ nextIp, onAdd, onClose, onQr }: AddPeerModalProps) {
  const [form, setForm] = useState({ name: "", os: "macOS", publicKey: "" });
  const [formError, setFormError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);

  function handleAdd() {
    if (!form.name.trim()) { setFormError("Введите название устройства"); return; }
    const pubKey = form.publicKey.trim() || generateFakeKey();
    const newPeer: Peer = {
      id: Date.now(),
      name: form.name.trim(),
      ip: nextIp,
      endpoint: "—",
      status: "inactive",
      rx: "0 B",
      tx: "0 B",
      ping: "—",
      lastSeen: "никогда",
      os: form.os,
      publicKey: pubKey,
    };
    onAdd(newPeer);
    setAddSuccess(true);
    setTimeout(() => {
      onClose();
      onQr(newPeer);
    }, 1200);
  }

  function handleClose() {
    setFormError("");
    setForm({ name: "", os: "macOS", publicKey: "" });
    onClose();
  }

  return (
    <Modal onClose={handleClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,255,170,0.1)", border: "1px solid rgba(0,255,170,0.2)" }}>
              <Icon name="UserPlus" size={16} style={{ color: "#00ffaa" }} />
            </div>
            <h3 className="font-semibold text-base" style={{ color: "#d8f0e8" }}>Новый пир</h3>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: "#4a7a6a" }}>
            <Icon name="X" size={16} />
          </button>
        </div>

        {addSuccess ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center animate-scale-in"
              style={{ background: "rgba(0,255,170,0.12)", border: "1px solid rgba(0,255,170,0.3)" }}>
              <Icon name="Check" size={26} style={{ color: "#00ffaa" }} />
            </div>
            <p className="font-medium" style={{ color: "#00ffaa" }}>Пир добавлен!</p>
            <p className="text-sm text-center" style={{ color: "#4a7a6a" }}>Открываю QR-код для подключения...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "#4a7a6a" }}>Название устройства *</label>
              <input
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormError(""); }}
                placeholder="Например: Рабочий ноутбук"
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: `1px solid ${formError ? "rgba(255,100,100,0.4)" : "rgba(0,255,170,0.12)"}`,
                  color: "#c8e8e0",
                  fontFamily: "'Golos Text', sans-serif",
                }}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                autoFocus
              />
              {formError && <p className="text-xs mt-1" style={{ color: "#ff6b6b" }}>{formError}</p>}
            </div>

            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "#4a7a6a" }}>Операционная система</label>
              <div className="flex flex-wrap gap-2">
                {osOptions.map(os => (
                  <button key={os} onClick={() => setForm(f => ({ ...f, os }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{
                      background: form.os === os ? "rgba(0,255,170,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${form.os === os ? "rgba(0,255,170,0.3)" : "rgba(255,255,255,0.08)"}`,
                      color: form.os === os ? "#00ffaa" : "#5a8a7a",
                    }}>
                    {os}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs mb-1.5 block" style={{ color: "#4a7a6a" }}>
                Публичный ключ устройства <span style={{ color: "#2a5a4a" }}>(необязательно — сгенерируем)</span>
              </label>
              <input
                value={form.publicKey}
                onChange={e => setForm(f => ({ ...f, publicKey: e.target.value }))}
                placeholder="base64 публичный ключ..."
                className="w-full rounded-xl px-4 py-2.5 text-xs outline-none transition-all"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(0,255,170,0.08)",
                  color: "#4aff99",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              />
            </div>

            <div className="glass rounded-xl p-3 flex gap-2">
              <Icon name="Info" size={13} style={{ color: "#00d4ff", flexShrink: 0, marginTop: 2 }} />
              <p className="text-xs leading-relaxed" style={{ color: "#3a6a5a" }}>
                Пир получит адрес <span style={{ color: "#00d4ff", fontFamily: "'JetBrains Mono', monospace" }}>{nextIp}/32</span> в вашей VPN-сети. После добавления QR-код можно отсканировать приложением WireGuard на устройстве.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#5a8a7a" }}>
                Отмена
              </button>
              <button onClick={handleAdd}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02]"
                style={{ background: "rgba(0,255,170,0.12)", border: "1px solid rgba(0,255,170,0.3)", color: "#00ffaa", boxShadow: "0 0 20px rgba(0,255,170,0.1)" }}>
                Добавить пир
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── QR Modal ───────────────────────────────────────────────────────────────
interface QrModalProps {
  peer: Peer;
  onClose: () => void;
}

export function QrModal({ peer, onClose }: QrModalProps) {
  const qrConfig = buildWgConfig(peer, SERVER_PUB_KEY, SERVER_ENDPOINT);

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}>
              <Icon name="QrCode" size={16} style={{ color: "#00d4ff" }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: "#d8f0e8" }}>QR-код подключения</h3>
              <p className="text-xs" style={{ color: "#3a6a5a" }}>{peer.name} · {peer.ip}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: "#4a7a6a" }}>
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-5">
          <div className="rounded-2xl p-4" style={{ background: "#080c14", border: "1px solid rgba(0,255,170,0.15)", boxShadow: "0 0 30px rgba(0,255,170,0.06)" }}>
            <QrCanvas text={qrConfig} size={220} />
          </div>

          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs" style={{ color: "#4a7a6a" }}>Конфиг для устройства</p>
              <button
                onClick={() => navigator.clipboard.writeText(qrConfig)}
                className="flex items-center gap-1 text-xs rounded-lg px-2.5 py-1 transition-all"
                style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)", color: "#00d4ff" }}>
                <Icon name="Copy" size={11} /> Копировать
              </button>
            </div>
            <pre className="rounded-xl p-3 text-xs leading-relaxed overflow-x-auto"
              style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,255,170,0.07)", color: "#4aff99", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px" }}>
              {qrConfig}
            </pre>
          </div>

          <div className="glass rounded-xl p-3 w-full flex gap-2">
            <Icon name="Smartphone" size={13} style={{ color: "#00ffaa", flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs" style={{ color: "#3a6a5a" }}>
              Откройте приложение <strong style={{ color: "#8ab8a8" }}>WireGuard</strong> на устройстве → нажмите «+» → «Сканировать QR-код»
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────
interface DeleteModalProps {
  peer: Peer;
  onConfirm: (peer: Peer) => void;
  onClose: () => void;
}

export function DeleteModal({ peer, onConfirm, onClose }: DeleteModalProps) {
  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.2)" }}>
            <Icon name="Trash2" size={16} style={{ color: "#ff6b6b" }} />
          </div>
          <h3 className="font-semibold" style={{ color: "#d8f0e8" }}>Удалить пир?</h3>
        </div>
        <p className="text-sm mb-5" style={{ color: "#5a8a7a" }}>
          Пир <span style={{ color: "#c8e8e0" }}>{peer.name}</span> ({peer.ip}) будет отключён и удалён из конфигурации.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#5a8a7a" }}>
            Отмена
          </button>
          <button onClick={() => onConfirm(peer)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
            style={{ background: "rgba(255,100,100,0.12)", border: "1px solid rgba(255,100,100,0.3)", color: "#ff6b6b" }}>
            Удалить
          </button>
        </div>
      </div>
    </Modal>
  );
}
