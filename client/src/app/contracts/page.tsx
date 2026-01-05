"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";

function statusToBadge(status: string) {
  const map: Record<string, { class: string; label: string }> = {
    PROPOSED: { class: "badge-warning", label: "Föreslagen" },
    ACTIVE: { class: "badge-success", label: "Aktiv" },
    COMPLETED: { class: "badge-success", label: "Slutförd" },
    BREACHED: { class: "badge-danger", label: "Bruten" },
    DISPUTED: { class: "badge-warning", label: "Tvist" },
    RESOLVED: { class: "badge-success", label: "Löst" },
  };
  return map[status] || { class: "", label: status };
}

export default function Contracts() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    api.agreements.getAll().then(setAgreements).catch(console.error);
  }, []);

  const filtered = filter === "all"
    ? agreements
    : agreements.filter((a) => a.status === filter);

  return (
    <>
      <Header />
      <main className="container">
        <h1 style={{ marginBottom: "2rem" }}>Avtal</h1>

        <div className="card">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setFilter("all")}
              style={{ opacity: filter === "all" ? 1 : 0.5 }}
            >
              Alla
            </button>
            <button
              onClick={() => setFilter("PROPOSED")}
              style={{ opacity: filter === "PROPOSED" ? 1 : 0.5 }}
            >
              Föreslagna
            </button>
            <button
              onClick={() => setFilter("ACTIVE")}
              style={{ opacity: filter === "ACTIVE" ? 1 : 0.5 }}
            >
              Aktiva
            </button>
            <button
              onClick={() => setFilter("COMPLETED")}
              style={{ opacity: filter === "COMPLETED" ? 1 : 0.5 }}
            >
              Slutförda
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card">
            <p className="opacity-70">Inga avtal hittades.</p>
          </div>
        ) : (
          <div className="grid">
            {filtered.map((agreement) => {
              const badge = statusToBadge(agreement.status);
              return (
                <div key={agreement.id} className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h3>Avtal #{agreement.id}</h3>
                    <span className={`badge ${badge.class}`}>{badge.label}</span>
                  </div>

                  <div className="text-sm opacity-70">
                    <p>Förslagsställare: Identitet #{agreement.proposer?.id}</p>
                    {agreement.acceptor && (
                      <p>Accepterare: Identitet #{agreement.acceptor?.id}</p>
                    )}
                    <p>
                      Deadline:{" "}
                      {new Date(agreement.deadline).toLocaleDateString("sv-SE")}
                    </p>
                    <p>
                      Insats: {(BigInt(agreement.proposerDeposit) / BigInt(10 ** 18)).toString()} ETH
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
