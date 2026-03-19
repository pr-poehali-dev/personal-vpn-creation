import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { initialPeers, Peer } from "@/components/vpn/types";
import PeersTab from "@/components/vpn/PeersTab";
import StatsTab from "@/components/vpn/StatsTab";
import ConfigTab from "@/components/vpn/ConfigTab";

export default function Index() {
  const [activeTab, setActiveTab] = useState<"peers" | "stats" | "config">("peers");
  const [serverRunning, setServerRunning] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [peers, setPeers] = useState<Peer[]>(initialPeers);

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  const activePeers = peers.filter(p => p.status === "active").length;

  function handleAdd(peer: Peer) {
    setPeers(prev => [...prev, peer]);
  }

  function handleDelete(peer: Peer) {
    setPeers(prev => prev.filter(p => p.id !== peer.id));
  }

  return (
    <div className="min-h-screen bg-grid" style={{ background: "#080c14", fontFamily: "'Golos Text', sans-serif" }}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #00ffaa 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #00d4ff 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

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
                <Icon name={stat.icon} size={14} style={{ color: stat.color }} />
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
              <Icon name={tab.icon} size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "peers" && (
          <PeersTab peers={peers} onAdd={handleAdd} onDelete={handleDelete} />
        )}
        {activeTab === "stats" && (
          <StatsTab peers={peers} />
        )}
        {activeTab === "config" && (
          <ConfigTab peers={peers} />
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
