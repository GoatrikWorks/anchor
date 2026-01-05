"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useCreateIdentity } from "@/hooks/useIdentity";
import { api } from "@/lib/api";

export default function Profile() {
  const { isAuthenticated, identityId, address } = useAuth();
  const { createIdentity, isPending, isSuccess, hash } = useCreateIdentity();
  const [identity, setIdentity] = useState<any>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;

    api.identity.getMe().then(setIdentity).catch(console.error);
  }, [isAuthenticated, isSuccess]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createIdentity(name);
  };

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main className="container">
          <div className="card" style={{ textAlign: "center" }}>
            <p>Du måste logga in för att se din profil.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container">
        <h1 style={{ marginBottom: "2rem" }}>Profil</h1>

        {!identity ? (
          <div className="card">
            <h2 style={{ marginBottom: "1rem" }}>Skapa din identitet</h2>
            <p className="opacity-70 mb-4">
              Du har ingen identitet ännu. Skapa en för att delta i spelet.
            </p>

            <form onSubmit={handleCreate}>
              <input
                type="text"
                placeholder="Ditt namn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
              />
              <button type="submit" disabled={isPending || !name.trim()}>
                {isPending ? "Skapar..." : "Skapa identitet"}
              </button>
            </form>

            {isSuccess && hash && (
              <p className="text-sm mt-4" style={{ color: "var(--success)" }}>
                Identitet skapad! Transaktionshash: {hash.slice(0, 10)}...
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="card">
              <h2>Din identitet</h2>
              <div className="mt-4">
                <p>
                  <strong>ID:</strong> {identity.id}
                </p>
                <p>
                  <strong>Adress:</strong> {identity.owner}
                </p>
                <p>
                  <strong>Skapad:</strong>{" "}
                  {new Date(identity.createdAt).toLocaleDateString("sv-SE")}
                </p>
              </div>
            </div>

            {identity.reputation && (
              <div className="card">
                <h2 style={{ marginBottom: "1rem" }}>Reputation</h2>
                <div className="grid">
                  <div className="stat">
                    <div className="stat-value">{identity.reputation.score}</div>
                    <div className="stat-label">Total poäng</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">
                      {identity.reputation.components?.trustworthiness || 0}
                    </div>
                    <div className="stat-label">Pålitlighet</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">
                      {identity.reputation.components?.reliability || 0}
                    </div>
                    <div className="stat-label">Tillförlitlighet</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">
                      {identity.reputation.components?.experience || 0}
                    </div>
                    <div className="stat-label">Erfarenhet</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
