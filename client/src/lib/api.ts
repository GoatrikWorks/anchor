const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "API request failed");
  }

  return response.json();
}

export const api = {
  auth: {
    getNonce: (address: string) =>
      fetchApi<{ nonce: string }>(`/auth/nonce?address=${address}`),
    verify: (message: string, signature: string) =>
      fetchApi<{ token: string; address: string; identityId: number | null }>(
        "/auth/verify",
        {
          method: "POST",
          body: JSON.stringify({ message, signature }),
        }
      ),
  },

  identity: {
    getMe: () => fetchApi<any>("/identity/me"),
    getById: (id: number) => fetchApi<any>(`/identity/${id}`),
    getAll: () => fetchApi<any[]>("/identity"),
    getAgreements: (id: number) => fetchApi<any>(`/identity/${id}/agreements`),
  },

  agreements: {
    getAll: () => fetchApi<any[]>("/agreements"),
    getById: (id: number) => fetchApi<any>(`/agreements/${id}`),
    getActive: () => fetchApi<any[]>("/agreements/active"),
    getProposed: () => fetchApi<any[]>("/agreements/proposed"),
    getStats: () => fetchApi<any>("/agreements/stats"),
  },

  reputation: {
    get: (identityId: number) => fetchApi<any>(`/reputation/${identityId}`),
    getLeaderboard: () => fetchApi<any[]>("/reputation/leaderboard"),
  },

  world: {
    getState: () => fetchApi<any>("/world/state"),
  },

  opportunities: {
    getAll: () => fetchApi<any[]>("/opportunities"),
    getById: (id: number) => fetchApi<any>(`/opportunities/${id}`),
    getClaimed: () => fetchApi<any[]>("/opportunities/claimed"),
    claim: (id: number) =>
      fetchApi<any>(`/opportunities/${id}/claim`, { method: "POST" }),
    complete: (id: number) =>
      fetchApi<any>(`/opportunities/${id}/complete`, { method: "POST" }),
  },
};
