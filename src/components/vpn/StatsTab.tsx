import { Peer, trafficData } from "./types";

const maxVal = Math.max(...trafficData.map(d => d.rx));

interface StatsTabProps {
  peers: Peer[];
}

export default function StatsTab({ peers }: StatsTabProps) {
  return (
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
  );
}
