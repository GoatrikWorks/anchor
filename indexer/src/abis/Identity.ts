export const IdentityABI = [
  {
    type: "event",
    name: "IdentityCreated",
    inputs: [
      { name: "identityId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "nameHash", type: "bytes32", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "TraitSet",
    inputs: [
      { name: "identityId", type: "uint256", indexed: true },
      { name: "traitKey", type: "bytes32", indexed: true },
      { name: "traitValue", type: "bytes32", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  }
] as const;
