"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import Link from "next/link";

export default function Dashboard() {
  const { isAuthenticated, identityId } = useAuth();
  const [identity, setIdentity] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    api.identity.getMe().then(setIdentity).catch(console.error);
    api.opportunities.getAll().then(setOpportunities).catch(console.error);

    if (identityId) {
      api.identity.getAgreements(identityId).then(setAgreements).catch(console.error);
    }
  }, [isAuthenticated, identityId]);

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main className="container">
          <div className="card" style={{ textAlign: "center" }}>
            <p>Du måste logga in för att se din dashboard.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container">
        <h1 style={{ marginBottom: "2rem" }}>Dashboard</h1>

        {identity ? (
          <div className="card">
            <h2>Din identitet</h2>
            <p className="text-sm opacity-70">ID: {identity.id}</p>
            {identity.reputation && (
              <div style={{ marginTop: "1rem" }}>
                <div className="stat">
                  <div className="stat-value">{identity.reputation.score}</div>
                  <div className="stat-label">Reputationspoäng</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card">
            <p>Du har ingen identitet ännu.</p>
            <Link href="/profile">
              <button style={{ marginTop: "1rem" }}>Skapa identitet</button>
            </Link>
          </div>
        )}

        {agreements && (
          <div className="card">
            <h2 style={{ marginBottom: "1rem" }}>Dina avtal</h2>
            <div className="grid">
              <div className="stat">
                <div className="stat-value">{agreements.proposed?.length || 0}</div>
                <div className="stat-label">Föreslagna</div>
              </div>
              <div className="stat">
                <div className="stat-value">{agreements.accepted?.length || 0}</div>
                <div className="stat-label">Accepterade</div>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <h2 style={{ marginBottom: "1rem" }}>Tillgängliga uppdrag</h2>
          {opportunities.length === 0 ? (
            <p className="opacity-70">Inga uppdrag tillgängliga just nu.</p>
          ) : (
            <div className="grid">
              {opportunities.slice(0, 6).map((opp) => (
                <div key={opp.id} className="card">
                  <h3>{opp.title}</h3>
                  <p className="text-sm opacity-70">{opp.description}</p>
                  <div className="flex justify-between items-center mt-4">
                    <span className={`badge badge-${opp.eligible ? "success" : "warning"}`}>
                      {opp.eligible ? "Tillgänglig" : "Kräver högre reputation"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
