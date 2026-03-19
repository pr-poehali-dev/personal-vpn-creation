export interface Peer {
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

export const initialPeers: Peer[] = [
  { id: 1, name: "MacBook Pro", ip: "10.8.0.2", endpoint: "192.168.1.45:51820", status: "active", rx: "2.4 GB", tx: "890 MB", ping: "12ms", lastSeen: "сейчас", os: "macOS", publicKey: "r4yBv5HkKg3Ui8c2XnJmP9qL6wE1oT7sF0dA3bR=" },
  { id: 2, name: "iPhone 15", ip: "10.8.0.3", endpoint: "212.109.45.67:51820", status: "active", rx: "1.1 GB", tx: "340 MB", ping: "28ms", lastSeen: "сейчас", os: "iOS", publicKey: "Kf8mN2pQsT1vWxYzHg4cD6jU0nBiO9rE5lM7kA=" },
  { id: 3, name: "Ubuntu Server", ip: "10.8.0.4", endpoint: "77.234.12.8:51820", status: "inactive", rx: "5.7 GB", tx: "2.1 GB", ping: "—", lastSeen: "3 ч назад", os: "Linux", publicKey: "Zq3wE8tY2uI7oP1aS4dF6gH9jK0lL5xCvBnM0=" },
  { id: 4, name: "Windows PC", ip: "10.8.0.5", endpoint: "89.45.123.201:51820", status: "inactive", rx: "890 MB", tx: "210 MB", ping: "—", lastSeen: "1 д назад", os: "Windows", publicKey: "Xc2vB4nM6bV8nC0xZ3wE5rT7yU9iO1pA2sD4f=" },
];

export const trafficData = [
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

export const osOptions = ["macOS", "iOS", "Windows", "Linux", "Android", "Другое"];

export const SERVER_PUB_KEY = "Wg9xK2mN4pQ6sT8vYzHj0cD1aS3fG5hJ7lL9oP=";
export const SERVER_ENDPOINT = "my-home.ddns.net:51820";

export const osIcon = (os: string) => {
  const map: Record<string, string> = { macOS: "Laptop", iOS: "Smartphone", Linux: "Terminal", Windows: "Monitor" };
  return map[os] || "Cpu";
};

export function generateFakeKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  return Array.from({ length: 43 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") + "=";
}

export function buildWgConfig(peer: Peer, serverPubKey: string, serverEndpoint: string) {
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
