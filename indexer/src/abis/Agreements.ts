export const AgreementsABI = [
  {
    type: "event",
    name: "AgreementProposed",
    inputs: [
      { name: "agreementId", type: "uint256", indexed: true },
      { name: "proposerId", type: "uint256", indexed: true },
      { name: "termsHash", type: "bytes32", indexed: false },
      { name: "requiredDeposit", type: "uint256", indexed: false },
      { name: "deadline", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "AgreementAccepted",
    inputs: [
      { name: "agreementId", type: "uint256", indexed: true },
      { name: "acceptorId", type: "uint256", indexed: true },
      { name: "depositAmount", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "AgreementCompleted",
    inputs: [
      { name: "agreementId", type: "uint256", indexed: true },
      { name: "completedBy", type: "uint256", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "AgreementBreached",
    inputs: [
      { name: "agreementId", type: "uint256", indexed: true },
      { name: "breachedBy", type: "uint256", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "DisputeRaised",
    inputs: [
      { name: "agreementId", type: "uint256", indexed: true },
      { name: "raisedBy", type: "uint256", indexed: true },
      { name: "reasonHash", type: "bytes32", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "DisputeResolved",
    inputs: [
      { name: "agreementId", type: "uint256", indexed: true },
      { name: "resolver", type: "uint256", indexed: true },
      { name: "proposerFavored", type: "bool", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "DepositWithdrawn",
    inputs: [
      { name: "agreementId", type: "uint256", indexed: true },
      { name: "identityId", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  }
] as const;
