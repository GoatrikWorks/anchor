"use client";

import { useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, keccak256, toBytes } from "viem";
import { AGREEMENTS_ADDRESS, AgreementsABI } from "@/lib/contracts";

export function useProposeAgreement() {
  const { writeContract, data: hash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const propose = useCallback(
    async (terms: string, depositEth: string, deadlineTimestamp: number) => {
      const termsHash = keccak256(toBytes(terms));
      const deposit = parseEther(depositEth);

      writeContract({
        address: AGREEMENTS_ADDRESS,
        abi: AgreementsABI,
        functionName: "proposeAgreement",
        args: [termsHash, deposit, BigInt(deadlineTimestamp)],
        value: deposit,
      });
    },
    [writeContract]
  );

  return {
    propose,
    isPending: isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useAcceptAgreement() {
  const { writeContract, data: hash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const accept = useCallback(
    async (agreementId: bigint, depositEth: string) => {
      const deposit = parseEther(depositEth);

      writeContract({
        address: AGREEMENTS_ADDRESS,
        abi: AgreementsABI,
        functionName: "acceptAgreement",
        args: [agreementId],
        value: deposit,
      });
    },
    [writeContract]
  );

  return {
    accept,
    isPending: isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useCompleteAgreement() {
  const { writeContract, data: hash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const complete = useCallback(
    async (agreementId: bigint) => {
      writeContract({
        address: AGREEMENTS_ADDRESS,
        abi: AgreementsABI,
        functionName: "completeAgreement",
        args: [agreementId],
      });
    },
    [writeContract]
  );

  return {
    complete,
    isPending: isConfirming,
    isSuccess,
    error,
    hash,
  };
}
