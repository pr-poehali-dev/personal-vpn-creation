import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
type LucideIconName = string;

interface Peer {
  id: number;
  name: string;
  ip: string;
  endpoint: string;
  status: "active" | "inactive";
  rx: string;
  tx: string;
  ping: string;
  lastSeen: string;
  os: string;
  publicKey: string;
}

const initialPeers: Peer[] = [
  { id: 1, name: "MacBook Pro", ip: "10.8.0.2", endpoint: "192.168.1.45:51820", status: "active", rx: "2.4 GB", tx: "890 MB", ping: "12ms", lastSeen: "сейчас", os: "macOS", publicKey: "r4yBv5HkKg3Ui8c2XnJmP9qL6wE1oT7sF0dA3bR=" },
  { id: 2, name: "iPhone 15", ip: "10.8.0.3", endpoint: "212.109.45.67:51820", status: "active", rx: "1.1 GB", tx: "340 MB", ping: "28ms", lastSeen: "сейчас", os: "iOS", publicKey: "Kf8mN2pQsT1vWxYzHg4cD6jU0nBiO9rE5lM7kA=" },
  { id: 3, name: "Ubuntu Server", ip: "10.8.0.4", endpoint: "77.234.12.8:51820", status: "inactive", rx: "5.7 GB", tx: "2.1 GB", ping: "—", lastSeen: "3 ч назад", os: "Linux", publicKey: "Zq3wE8tY2uI7oP1aS4dF6gH9jK0lL5xCvBnM0=" },
  { id: 4, name: "Windows PC", ip: "10.8.0.5", endpoint: "89.45.123.201:51820", status: "inactive", rx: "890 MB", tx: "210 MB", ping: "—", lastSeen: "1 д назад", os: "Windows", publicKey: "Xc2vB4nM6bV8nC0xZ3wE5rT7yU9iO1pA2sD4f=" },
];

const trafficData = [
  { hour: "00", rx: 12, tx: 5 },
  { hour: "03", rx: 8, tx: 3 },
  { hour: "06", rx: 15, tx: 7 },
  { hour: "09", rx: 45, tx: 22 },
  { hour: "12", rx: 78, tx: 41 },
  { hour: "15", rx: 92, tx: 55 },
  { hour: "18", rx: 110, tx: 68 },
  { hour: "21", rx: 85, tx: 44 },
  { hour: "24", rx: 34, tx: 18 },
];

const maxVal = Math.max(...trafficData.map(d => d.rx));

const osIcon = (os: string) => {
  const map: Record<string, string> = { macOS: "Laptop", iOS: "Smartphone", Linux: "Terminal", Windows: "Monitor" };
  return map[os] || "Cpu";
};

const osOptions = ["macOS", "iOS", "Windows", "Linux", "Android", "Другое"];

function generateFakeKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  return Array.from({ length: 43 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") + "=";
}

function buildWgConfig(peer: Peer, serverPubKey: string, serverEndpoint: string) {
  return `[Interface]
PrivateKey = <PRIVATE_KEY_УСТРОЙСТВА>
Address = ${peer.ip}/32
DNS = 1.1.1.1

[Peer]
PublicKey = ${serverPubKey}
Endpoint = ${serverEndpoint}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`;
}

// Minimal QR-code renderer via canvas (pixel matrix)
function QrCanvas({ text, size = 200 }: { text: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Simplified visual QR pattern (decorative, shows text hash as pattern)
    const cells = 25;
    const cell = size / cells;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#080c14";
    ctx.fillRect(0, 0, size, size);

    // Seed from text
    let seed = 0;
    for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) & 0xffffffff;
    const rng = (s: number) => { s = Math.sin(s) * 10000; return s - Math.floor(s); };

    const matrix: boolean[][] = Array.from({ length: cells }, (_, r) =>
      Array.from({ length: cells }, (_, c) => {
        // Finder patterns
        const inFinder = (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
        if (inFinder) {
          const lr = r % 7 < 7 ? r % 7 : r - (cells - 7);
          const lc = c < 7 ? c : c - (cells - 7);
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
          ctx.shadowBlur = on ? 2 : 0;
          ctx.fillRect(c * cell + 0.5, r * cell + 0.5, cell - 1, cell - 1);
        }
      });
    });
  }, [text, size]);

  useEffect(() => { draw(); }, [draw]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ imageRendering: "pixelated" }} />;
}

// Modal wrapper
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
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

export default function Index() {
  const [activeTab, setActiveTab] = useState<"peers" | "stats" | "config">("peers");
  const [serverRunning, setServerRunning] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [hoveredPeer, setHoveredPeer] = useState<number | null>(null);
  const [peers, setPeers] = useState<Peer[]>(initialPeers);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [qrPeer, setQrPeer] = useState<Peer | null>(null);
  const [deletePeer, setDeletePeer] = useState<Peer | null>(null);

  // Add peer form
  const [form, setForm] = useState({ name: "", os: "macOS", publicKey: "" });
  const [formError, setFormError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  const activePeers = peers.filter(p => p.status === "active").length;
  const nextIp = `10.8.0.${peers.length + 2}`;
  const serverPubKey = "Wg9xK2mN4pQ6sT8vYzHj0cD1aS3fG5hJ7lL9oP=";
  const serverEndpoint = "my-home.ddns.net:51820";

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
    setPeers(prev => [...prev, newPeer]);
    setAddSuccess(true);
    setTimeout(() => {
      setShowAddModal(false);
      setAddSuccess(false);
      setForm({ name: "", os: "macOS", publicKey: "" });
      setFormError("");
      setQrPeer(newPeer);
    }, 1200);
  }

  function handleDelete(peer: Peer) {
    setPeers(prev => prev.filter(p => p.id !== peer.id));
    setDeletePeer(null);
  }

  const qrConfig = qrPeer ? buildWgConfig(qrPeer, serverPubKey, serverEndpoint) : "";

  return (
    <div className="min-h-screen bg-grid" style={{ background: "#080c14", fontFamily: "'Golos Text', sans-serif" }}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #00ffaa 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #00d4ff 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      {/* ── ADD PEER MODAL ── */}
      {showAddModal && (
        <Modal onClose={() => { setShowAddModal(false); setFormError(""); setForm({ name: "", os: "macOS", publicKey: "" }); }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(0,255,170,0.1)", border: "1px solid rgba(0,255,170,0.2)" }}>
                  <Icon name="UserPlus" size={16} style={{ color: "#00ffaa" }} />
                </div>
                <h3 className="font-semibold text-base" style={{ color: "#d8f0e8" }}>Новый пир</h3>
              </div>
              <button onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: "#4a7a6a" }}>
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
                  <button onClick={() => { setShowAddModal(false); setFormError(""); }}
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
      )}

      {/* ── QR MODAL ── */}
      {qrPeer && (
        <Modal onClose={() => setQrPeer(null)}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}>
                  <Icon name="QrCode" size={16} style={{ color: "#00d4ff" }} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: "#d8f0e8" }}>QR-код подключения</h3>
                  <p className="text-xs" style={{ color: "#3a6a5a" }}>{qrPeer.name} · {qrPeer.ip}</p>
                </div>
              </div>
              <button onClick={() => setQrPeer(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ color: "#4a7a6a" }}>
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
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deletePeer && (
        <Modal onClose={() => setDeletePeer(null)}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.2)" }}>
                <Icon name="Trash2" size={16} style={{ color: "#ff6b6b" }} />
              </div>
              <h3 className="font-semibold" style={{ color: "#d8f0e8" }}>Удалить пир?</h3>
            </div>
            <p className="text-sm mb-5" style={{ color: "#5a8a7a" }}>
              Пир <span style={{ color: "#c8e8e0" }}>{deletePeer.name}</span> ({deletePeer.ip}) будет отключён и удалён из конфигурации.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeletePeer(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#5a8a7a" }}>
                Отмена
              </button>
              <button onClick={() => handleDelete(deletePeer)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{ background: "rgba(255,100,100,0.12)", border: "1px solid rgba(255,100,100,0.3)", color: "#ff6b6b" }}>
                Удалить
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className={`flex items-center justify-between mb-8 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-glow-pulse"
                style={{ background: "linear-gradient(135deg, rgba(0,255,170,0.15) 0%, rgba(0,212,255,0.08) 100%)", border: "1px solid rgba(0,255,170,0.3)" }}>
                <Icon name="Shield" size={22} style={{ color: "#00ffaa" }} />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                style={{ background: serverRunning ? "#00ffaa" : "#444", boxShadow: serverRunning ? "0 0 8px #00ffaa" : "none" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: "#e8f8f5" }}>
                WireGuard <span style={{ color: "#00ffaa", textShadow: "0 0 20px rgba(0,255,170,0.6)" }}>VPN</span>
              </h1>
              <p className="text-xs" style={{ color: "#4a7a6a", fontFamily: "'JetBrains Mono', monospace" }}>
                10.8.0.1 · 51820/UDP
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
              <div className={serverRunning ? "status-dot-active" : "status-dot-inactive"} />
              <span className="text-sm font-medium" style={{ color: serverRunning ? "#00ffaa" : "#666" }}>
                {serverRunning ? "Активен" : "Остановлен"}
              </span>
            </div>
            <button
              onClick={() => setServerRunning(!serverRunning)}
              className="rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-300"
              style={{
                background: serverRunning ? "rgba(220,50,50,0.12)" : "rgba(0,255,170,0.12)",
                border: serverRunning ? "1px solid rgba(220,50,50,0.3)" : "1px solid rgba(0,255,170,0.3)",
                color: serverRunning ? "#ff6b6b" : "#00ffaa",
              }}
            >
              {serverRunning ? "Остановить" : "Запустить"}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className={`grid grid-cols-4 gap-4 mb-6 transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {[
            { label: "Пиры активны", value: `${activePeers}/${peers.length}`, icon: "Users", color: "#00ffaa" },
            { label: "Трафик ↓", value: "10.1 GB", icon: "Download", color: "#00d4ff" },
            { label: "Трафик ↑", value: "3.6 GB", icon: "Upload", color: "#a855f7" },
            { label: "Аптайм", value: "14д 6ч", icon: "Clock", color: "#f59e0b" },
          ].map((stat, i) => (
            <div key={i} className="glass glass-hover rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name={stat.icon as LucideIconName} size={14} style={{ color: stat.color }} />
                <span className="text-xs" style={{ color: "#4a7a6a" }}>{stat.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: stat.color, textShadow: `0 0 20px ${stat.color}40` }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 mb-6 glass rounded-2xl p-1 w-fit transition-all duration-700 delay-150 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {([
            { key: "peers", label: "Подключения", icon: "Network" },
            { key: "stats", label: "Статистика", icon: "BarChart3" },
            { key: "config", label: "Конфигурация", icon: "Settings2" },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300"
              style={{
                background: activeTab === tab.key ? "rgba(0,255,170,0.12)" : "transparent",
                color: activeTab === tab.key ? "#00ffaa" : "#4a7a6a",
                border: activeTab === tab.key ? "1px solid rgba(0,255,170,0.25)" : "1px solid transparent",
                boxShadow: activeTab === tab.key ? "0 0 20px rgba(0,255,170,0.08)" : "none",
              }}
            >
              <Icon name={tab.icon as LucideIconName} size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── PEERS TAB ── */}
        {activeTab === "peers" && (
          <div className="animate-fade-in space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold" style={{ color: "#c8e8e0" }}>Список пиров</h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-[1.03]"
                style={{ background: "rgba(0,255,170,0.1)", border: "1px solid rgba(0,255,170,0.25)", color: "#00ffaa", boxShadow: "0 0 16px rgba(0,255,170,0.06)" }}>
                <Icon name="Plus" size={14} />
                Добавить пир
              </button>
            </div>

            {peers.map((peer, i) => (
              <div
                key={peer.id}
                className="glass glass-hover rounded-2xl p-5 cursor-default transition-all duration-300"
                style={{
                  animationDelay: `${i * 60}ms`,
                  transform: hoveredPeer === peer.id ? "translateX(4px)" : "translateX(0)",
                }}
                onMouseEnter={() => setHoveredPeer(peer.id)}
                onMouseLeave={() => setHoveredPeer(null)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: peer.status === "active" ? "rgba(0,255,170,0.08)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${peer.status === "active" ? "rgba(0,255,170,0.2)" : "rgba(255,255,255,0.08)"}`,
                      }}>
                      <Icon name={osIcon(peer.os) as LucideIconName} size={16}
                        style={{ color: peer.status === "active" ? "#00ffaa" : "#445566" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold" style={{ color: "#d8f0e8" }}>{peer.name}</p>
                        <div className={peer.status === "active" ? "status-dot-active" : "status-dot-inactive"} />
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "#3a6a5a", fontFamily: "'JetBrains Mono', monospace" }}>
                        {peer.ip} · {peer.endpoint}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs" style={{ color: "#3a6a5a" }}>Получено</p>
                      <p className="text-sm font-medium" style={{ color: "#00d4ff" }}>{peer.rx}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: "#3a6a5a" }}>Отправлено</p>
                      <p className="text-sm font-medium" style={{ color: "#a855f7" }}>{peer.tx}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: "#3a6a5a" }}>Пинг</p>
                      <p className="text-sm font-medium" style={{ color: peer.status === "active" ? "#00ffaa" : "#445566" }}>{peer.ping}</p>
                    </div>
                    <div className="text-right hidden lg:block">
                      <p className="text-xs" style={{ color: "#3a6a5a" }}>Последний раз</p>
                      <p className="text-sm" style={{ color: "#5a8a7a" }}>{peer.lastSeen}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setQrPeer(peer)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                        style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)", color: "#00d4ff" }}>
                        <Icon name="QrCode" size={13} />
                      </button>
                      <button
                        onClick={() => setDeletePeer(peer)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                        style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.15)", color: "#ff6b6b" }}>
                        <Icon name="Trash2" size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {peers.length === 0 && (
              <div className="glass rounded-2xl p-12 flex flex-col items-center gap-3">
                <Icon name="WifiOff" size={32} style={{ color: "#2a4a3a" }} />
                <p className="text-sm" style={{ color: "#3a6a5a" }}>Нет пиров. Добавьте первое устройство.</p>
              </div>
            )}
          </div>
        )}

        {/* ── STATS TAB ── */}
        {activeTab === "stats" && (
          <div className="animate-fade-in space-y-5">
            <h2 className="font-semibold mb-4" style={{ color: "#c8e8e0" }}>Статистика трафика</h2>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="font-medium" style={{ color: "#c8e8e0" }}>Трафик за 24 часа</p>
                  <p className="text-xs mt-1" style={{ color: "#3a6a5a" }}>Входящий и исходящий</p>
                </div>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 rounded" style={{ background: "#00d4ff" }} />
                    <span style={{ color: "#4a7a6a" }}>Получено</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 rounded" style={{ background: "#a855f7" }} />
                    <span style={{ color: "#4a7a6a" }}>Отправлено</span>
                  </div>
                </div>
              </div>

              <div className="flex items-end gap-2 h-40">
                {trafficData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full flex gap-0.5 items-end" style={{ height: "120px" }}>
                      <div className="flex-1 rounded-t-sm transition-all duration-500"
                        style={{ height: `${(d.rx / maxVal) * 100}%`, background: "linear-gradient(180deg, #00d4ff 0%, rgba(0,212,255,0.2) 100%)", opacity: 0.7, minHeight: "3px" }} />
                      <div className="flex-1 rounded-t-sm transition-all duration-500"
                        style={{ height: `${(d.tx / maxVal) * 100}%`, background: "linear-gradient(180deg, #a855f7 0%, rgba(168,85,247,0.2) 100%)", opacity: 0.7, minHeight: "3px" }} />
                    </div>
                    <span className="text-xs" style={{ color: "#2a5a4a", fontFamily: "'JetBrains Mono', monospace" }}>{d.hour}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="glass rounded-2xl p-5">
                <p className="font-medium mb-4" style={{ color: "#c8e8e0" }}>Текущая скорость</p>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span style={{ color: "#4a7a6a" }}>Загрузка</span>
                      <span style={{ color: "#00d4ff", fontFamily: "'JetBrains Mono', monospace" }}>42.8 MB/s</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "rgba(0,212,255,0.1)" }}>
                      <div className="h-full rounded-full" style={{ width: "68%", background: "linear-gradient(90deg, #00d4ff, rgba(0,212,255,0.5))", boxShadow: "0 0 10px rgba(0,212,255,0.4)" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span style={{ color: "#4a7a6a" }}>Отдача</span>
                      <span style={{ color: "#a855f7", fontFamily: "'JetBrains Mono', monospace" }}>18.3 MB/s</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "rgba(168,85,247,0.1)" }}>
                      <div className="h-full rounded-full" style={{ width: "29%", background: "linear-gradient(90deg, #a855f7, rgba(168,85,247,0.5))", boxShadow: "0 0 10px rgba(168,85,247,0.4)" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-5">
                <p className="font-medium mb-4" style={{ color: "#c8e8e0" }}>Топ пиров по трафику</p>
                <div className="space-y-3">
                  {peers.slice(0, 3).map((peer, i) => (
                    <div key={peer.id} className="flex items-center gap-3">
                      <span className="text-xs w-4" style={{ color: "#2a5a4a", fontFamily: "'JetBrains Mono', monospace" }}>#{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: "#8ab8a8" }}>{peer.name}</span>
                          <span style={{ color: "#00ffaa", fontFamily: "'JetBrains Mono', monospace" }}>{peer.rx}</span>
                        </div>
                        <div className="h-1 rounded-full" style={{ background: "rgba(0,255,170,0.08)" }}>
                          <div className="h-full rounded-full" style={{ width: `${100 - i * 30}%`, background: `rgba(0,255,170,${0.6 - i * 0.15})` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONFIG TAB ── */}
        {activeTab === "config" && (
          <div className="animate-fade-in">
            <h2 className="font-semibold mb-4" style={{ color: "#c8e8e0" }}>Конфигурация сервера</h2>
            <div className="grid grid-cols-2 gap-5">

              <div className="glass rounded-2xl p-5 col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-medium" style={{ color: "#c8e8e0" }}>Конфигурационный файл</p>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                      style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff" }}>
                      <Icon name="Copy" size={12} /> Копировать
                    </button>
                    <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                      style={{ background: "rgba(0,255,170,0.1)", border: "1px solid rgba(0,255,170,0.2)", color: "#00ffaa" }}>
                      <Icon name="Download" size={12} /> Скачать
                    </button>
                  </div>
                </div>
                <pre className="text-sm leading-relaxed rounded-xl p-4"
                  style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,255,170,0.08)", color: "#4aff99", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", overflowX: "auto" }}>
{`[Interface]
Address = 10.8.0.1/24
ListenPort = 51820
PrivateKey = ************************************

PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT
${peers.map(p => `
[Peer] # ${p.name}
PublicKey = ${p.publicKey}
AllowedIPs = ${p.ip}/32`).join("")}`}
                </pre>
              </div>

              <div className="glass rounded-2xl p-5">
                <p className="font-medium mb-4" style={{ color: "#c8e8e0" }}>Безопасность</p>
                <div className="space-y-3">
                  {[
                    { label: "Шифрование", value: "ChaCha20-Poly1305", icon: "Lock" },
                    { label: "Обмен ключами", value: "Curve25519", icon: "Key" },
                    { label: "Хэширование", value: "BLAKE2s", icon: "Fingerprint" },
                    { label: "Handshake", value: "Noise_IKpsk2", icon: "Handshake" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(0,255,170,0.05)" }}>
                      <div className="flex items-center gap-2">
                        <Icon name={item.icon as LucideIconName} size={13} style={{ color: "#00ffaa" }} />
                        <span className="text-sm" style={{ color: "#4a7a6a" }}>{item.label}</span>
                      </div>
                      <span className="text-xs font-medium" style={{ color: "#8ab8a8", fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-5">
                <p className="font-medium mb-4" style={{ color: "#c8e8e0" }}>Сеть</p>
                <div className="space-y-3">
                  {[
                    { label: "Интерфейс", value: "wg0" },
                    { label: "Подсеть", value: "10.8.0.0/24" },
                    { label: "Порт", value: "51820/UDP" },
                    { label: "DNS", value: "1.1.1.1, 8.8.8.8" },
                    { label: "MTU", value: "1420" },
                    { label: "Keepalive", value: "25 сек" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(0,255,170,0.05)" }}>
                      <span className="text-sm" style={{ color: "#4a7a6a" }}>{item.label}</span>
                      <span className="text-xs font-medium" style={{ color: "#8ab8a8", fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`mt-8 flex items-center justify-between transition-all duration-700 delay-300 ${mounted ? "opacity-100" : "opacity-0"}`}>
          <p className="text-xs" style={{ color: "#2a4a3a", fontFamily: "'JetBrains Mono', monospace" }}>
            WireGuard® v1.0.0 · kernel mod
          </p>
          <div className="flex items-center gap-1.5">
            <div className="status-dot-active" />
            <p className="text-xs" style={{ color: "#2a4a3a" }}>Все системы работают</p>
          </div>
        </div>
      </div>
    </div>
  );
}
