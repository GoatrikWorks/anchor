"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { api } from "@/lib/api";

interface AuthState {
  token: string | null;
  address: string | null;
  identityId: number | null;
  isAuthenticated: boolean;
}

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    address: null,
    identityId: null,
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedAddress = localStorage.getItem("address");
    const savedIdentityId = localStorage.getItem("identityId");

    if (token && savedAddress) {
      setAuthState({
        token,
        address: savedAddress,
        identityId: savedIdentityId ? parseInt(savedIdentityId, 10) : null,
        isAuthenticated: true,
      });
    }
  }, []);

  useEffect(() => {
    if (!isConnected && authState.isAuthenticated) {
      logout();
    }
  }, [isConnected]);

  const login = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);

    try {
      const { nonce } = await api.auth.getNonce(address);

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to Anchor",
        uri: window.location.origin,
        version: "1",
        chainId: 31337,
        nonce,
      });

      const messageToSign = message.prepareMessage();
      const signature = await signMessageAsync({ message: messageToSign });

      const result = await api.auth.verify(messageToSign, signature);

      localStorage.setItem("token", result.token);
      localStorage.setItem("address", result.address);
      if (result.identityId) {
        localStorage.setItem("identityId", result.identityId.toString());
      }

      setAuthState({
        token: result.token,
        address: result.address,
        identityId: result.identityId,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address, signMessageAsync]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("address");
    localStorage.removeItem("identityId");
    setAuthState({
      token: null,
      address: null,
      identityId: null,
      isAuthenticated: false,
    });
  }, []);

  return {
    ...authState,
    isLoading,
    login,
    logout,
  };
}
