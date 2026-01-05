"use client";

import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { keccak256, toBytes } from "viem";
import { IDENTITY_ADDRESS, IdentityABI } from "@/lib/contracts";

export function useCreateIdentity() {
  const { address } = useAccount();
  const [isPending, setIsPending] = useState(false);

  const { writeContract, data: hash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const createIdentity = useCallback(
    async (name: string) => {
      if (!address) return;

      setIsPending(true);

      try {
        const nameHash = keccak256(toBytes(name));

        writeContract({
          address: IDENTITY_ADDRESS,
          abi: IdentityABI,
          functionName: "createIdentity",
          args: [nameHash],
        });
      } catch (err) {
        console.error("Failed to create identity:", err);
      } finally {
        setIsPending(false);
      }
    },
    [address, writeContract]
  );

  return {
    createIdentity,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useSetTrait() {
  const { writeContract, data: hash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setTrait = useCallback(
    async (identityId: bigint, key: string, value: string) => {
      const keyHash = keccak256(toBytes(key));
      const valueHash = keccak256(toBytes(value));

      writeContract({
        address: IDENTITY_ADDRESS,
        abi: IdentityABI,
        functionName: "setTrait",
        args: [identityId, keyHash, valueHash],
      });
    },
    [writeContract]
  );

  return {
    setTrait,
    isPending: isConfirming,
    isSuccess,
    error,
    hash,
  };
}
