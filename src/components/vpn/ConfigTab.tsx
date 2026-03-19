import Icon from "@/components/ui/icon";
import { Peer } from "./types";

interface ConfigTabProps {
  peers: Peer[];
}

export default function ConfigTab({ peers }: ConfigTabProps) {
  const configText = `[Interface]
Address = 10.8.0.1/24
ListenPort = 51820
PrivateKey = ************************************

PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT
${peers.map(p => `
[Peer] # ${p.name}
PublicKey = ${p.publicKey}
AllowedIPs = ${p.ip}/32`).join("")}`;

  return (
    <div className="animate-fade-in">
      <h2 className="font-semibold mb-4" style={{ color: "#c8e8e0" }}>Конфигурация сервера</h2>
      <div className="grid grid-cols-2 gap-5">

        <div className="glass rounded-2xl p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="font-medium" style={{ color: "#c8e8e0" }}>Конфигурационный файл</p>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(configText)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
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
            {configText}
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
                  <Icon name={item.icon} size={13} style={{ color: "#00ffaa" }} />
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
  );
}
