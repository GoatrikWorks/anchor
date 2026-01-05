"use client";

import Link from "next/link";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { isAuthenticated, login, logout, isLoading } = useAuth();

  const handleConnect = () => {
    const injected = connectors.find((c) => c.id === "injected");
    if (injected) {
      connect({ connector: injected });
    }
  };

  return (
    <header className="header">
      <Link href="/">
        <h1>Anchor</h1>
      </Link>

      <nav className="nav">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/contracts">Avtal</Link>
        <Link href="/opportunities">Uppdrag</Link>
        <Link href="/profile">Profil</Link>
      </nav>

      <div>
        {!isConnected ? (
          <button onClick={handleConnect}>Anslut plånbok</button>
        ) : !isAuthenticated ? (
          <button onClick={login} disabled={isLoading}>
            {isLoading ? "Signerar..." : "Logga in"}
          </button>
        ) : (
          <div className="flex gap-4 items-center">
            <span className="text-sm opacity-70">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <button
              onClick={() => {
                logout();
                disconnect();
              }}
            >
              Logga ut
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
