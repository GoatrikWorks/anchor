"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";

export default function Home() {
  const [worldState, setWorldState] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.world.getState().then(setWorldState).catch(console.error);
    api.agreements.getStats().then(setStats).catch(console.error);
  }, []);

  return (
    <>
      <Header />
      <main className="container">
        <div className="card" style={{ textAlign: "center", padding: "4rem" }}>
          <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>Anchor</h1>
          <p style={{ fontSize: "1.25rem", opacity: 0.7, marginBottom: "2rem" }}>
            Ett persistent Web3-spel byggt på självägd identitet,
            avtal mellan spelare och långsiktig reputation.
          </p>
        </div>

        {worldState && (
          <div className="card">
            <h2 style={{ marginBottom: "1rem" }}>Världsstatus</h2>
            <div className="grid">
              <div className="stat">
                <div className="stat-value">{worldState.currentTick}</div>
                <div className="stat-label">Nuvarande tick</div>
              </div>
              <div className="stat">
                <div className="stat-value">{worldState.identityCount}</div>
                <div className="stat-label">Identiteter</div>
              </div>
              <div className="stat">
                <div className="stat-value">{worldState.activeOpportunities}</div>
                <div className="stat-label">Aktiva uppdrag</div>
              </div>
            </div>
          </div>
        )}

        {stats && (
          <div className="card">
            <h2 style={{ marginBottom: "1rem" }}>Avtalsstatistik</h2>
            <div className="grid">
              <div className="stat">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Totalt antal avtal</div>
              </div>
              <div className="stat">
                <div className="stat-value">{stats.active}</div>
                <div className="stat-label">Aktiva</div>
              </div>
              <div className="stat">
                <div className="stat-value">{stats.completed}</div>
                <div className="stat-label">Slutförda</div>
              </div>
              <div className="stat">
                <div className="stat-value">{stats.breached}</div>
                <div className="stat-label">Brutna</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
