"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

function typeToBadge(type: string) {
  const map: Record<string, { class: string; label: string }> = {
    MARKET_REQUEST: { class: "badge-success", label: "Handelsuppdrag" },
    FACTION_REQUEST: { class: "badge-warning", label: "Fraktionsuppdrag" },
    EXPEDITION: { class: "badge-danger", label: "Expedition" },
  };
  return map[type] || { class: "", label: type };
}

export default function Opportunities() {
  const { isAuthenticated, identityId } = useAuth();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [claiming, setClaiming] = useState<number | null>(null);

  useEffect(() => {
    api.opportunities.getAll().then(setOpportunities).catch(console.error);
  }, []);

  const handleClaim = async (id: number) => {
    if (!isAuthenticated || !identityId) return;

    setClaiming(id);
    try {
      await api.opportunities.claim(id);
      const updated = await api.opportunities.getAll();
      setOpportunities(updated);
    } catch (error) {
      console.error("Failed to claim:", error);
    } finally {
      setClaiming(null);
    }
  };

  return (
    <>
      <Header />
      <main className="container">
        <h1 style={{ marginBottom: "2rem" }}>Uppdrag</h1>

        {opportunities.length === 0 ? (
          <div className="card">
            <p className="opacity-70">Inga uppdrag tillgängliga just nu.</p>
          </div>
        ) : (
          <div className="grid">
            {opportunities.map((opp) => {
              const badge = typeToBadge(opp.type);
              const requirements = opp.requirements as { minReputation: number; riskLevel: number };
              const rewards = opp.rewards as { baseAmount: number; reputationBonus: number };

              return (
                <div key={opp.id} className="card">
                  <div className="flex justify-between items-center mb-4">
                    <span className={`badge ${badge.class}`}>{badge.label}</span>
                    <span className="text-sm opacity-70">
                      Risk: {"★".repeat(requirements.riskLevel)}
                    </span>
                  </div>

                  <h3>{opp.title}</h3>
                  <p className="text-sm opacity-70 mt-4">{opp.description}</p>

                  <div className="mt-4 text-sm">
                    <p>Krav: {requirements.minReputation}+ reputation</p>
                    <p>Belöning: {rewards.baseAmount} + {rewards.reputationBonus} rep</p>
                    <p>
                      Utgår:{" "}
                      {new Date(opp.expiresAt).toLocaleString("sv-SE")}
                    </p>
                  </div>

                  {isAuthenticated && opp.eligible && opp.status === "AVAILABLE" && (
                    <button
                      className="mt-4"
                      onClick={() => handleClaim(opp.id)}
                      disabled={claiming === opp.id}
                    >
                      {claiming === opp.id ? "Tar uppdrag..." : "Ta uppdrag"}
                    </button>
                  )}

                  {!opp.eligible && (
                    <p className="mt-4 text-sm opacity-70">
                      Du behöver högre reputation för detta uppdrag.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
