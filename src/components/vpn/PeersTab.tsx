import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Peer, osIcon } from "./types";
import { AddPeerModal, QrModal, DeleteModal } from "./Modals";

interface PeersTabProps {
  peers: Peer[];
  onAdd: (peer: Peer) => void;
  onDelete: (peer: Peer) => void;
}

export default function PeersTab({ peers, onAdd, onDelete }: PeersTabProps) {
  const [hoveredPeer, setHoveredPeer] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [qrPeer, setQrPeer] = useState<Peer | null>(null);
  const [deletePeer, setDeletePeer] = useState<Peer | null>(null);

  const nextIp = `10.8.0.${peers.length + 2}`;

  return (
    <>
      {showAddModal && (
        <AddPeerModal
          nextIp={nextIp}
          onAdd={onAdd}
          onClose={() => setShowAddModal(false)}
          onQr={peer => setQrPeer(peer)}
        />
      )}
      {qrPeer && (
        <QrModal peer={qrPeer} onClose={() => setQrPeer(null)} />
      )}
      {deletePeer && (
        <DeleteModal
          peer={deletePeer}
          onConfirm={peer => { onDelete(peer); setDeletePeer(null); }}
          onClose={() => setDeletePeer(null)}
        />
      )}

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
                  <Icon name={osIcon(peer.os)} size={16}
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
    </>
  );
}
