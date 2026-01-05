export const IDENTITY_ADDRESS = (process.env.NEXT_PUBLIC_IDENTITY_CONTRACT ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3") as `0x${string}`;

export const AGREEMENTS_ADDRESS = (process.env.NEXT_PUBLIC_AGREEMENTS_CONTRACT ||
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512") as `0x${string}`;

export const IdentityABI = [
  {
    type: "function",
    name: "createIdentity",
    inputs: [{ name: "nameHash", type: "bytes32" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setTrait",
    inputs: [
      { name: "identityId", type: "uint256" },
      { name: "key", type: "bytes32" },
      { name: "value", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "hasIdentity",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getIdentityByOwner",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const AgreementsABI = [
  {
    type: "function",
    name: "proposeAgreement",
    inputs: [
      { name: "termsHash", type: "bytes32" },
      { name: "requiredDeposit", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "acceptAgreement",
    inputs: [{ name: "agreementId", type: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "completeAgreement",
    inputs: [{ name: "agreementId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "reportBreach",
    inputs: [{ name: "agreementId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "raiseDispute",
    inputs: [
      { name: "agreementId", type: "uint256" },
      { name: "reasonHash", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawDeposit",
    inputs: [{ name: "agreementId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
