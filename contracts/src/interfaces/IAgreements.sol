// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAgreements {
    enum AgreementStatus {
        Proposed,
        Active,
        Completed,
        Breached,
        Disputed,
        Resolved
    }

    struct Agreement {
        uint256 id;
        uint256 proposerId;
        uint256 acceptorId;
        bytes32 termsHash;
        uint256 proposerDeposit;
        uint256 acceptorDeposit;
        uint256 deadline;
        AgreementStatus status;
        uint256 createdAt;
    }

    event AgreementProposed(
        uint256 indexed agreementId,
        uint256 indexed proposerId,
        bytes32 termsHash,
        uint256 requiredDeposit,
        uint256 deadline,
        uint256 timestamp
    );

    event AgreementAccepted(
        uint256 indexed agreementId,
        uint256 indexed acceptorId,
        uint256 depositAmount,
        uint256 timestamp
    );

    event AgreementCompleted(
        uint256 indexed agreementId,
        uint256 indexed completedBy,
        uint256 timestamp
    );

    event AgreementBreached(
        uint256 indexed agreementId,
        uint256 indexed breachedBy,
        uint256 timestamp
    );

    event DisputeRaised(
        uint256 indexed agreementId,
        uint256 indexed raisedBy,
        bytes32 reasonHash,
        uint256 timestamp
    );

    event DisputeResolved(
        uint256 indexed agreementId,
        uint256 indexed resolver,
        bool proposerFavored,
        uint256 timestamp
    );

    event DepositWithdrawn(
        uint256 indexed agreementId,
        uint256 indexed identityId,
        uint256 amount,
        uint256 timestamp
    );

    function proposeAgreement(
        bytes32 termsHash,
        uint256 requiredDeposit,
        uint256 deadline
    ) external payable returns (uint256);

    function acceptAgreement(uint256 agreementId) external payable;
    function completeAgreement(uint256 agreementId) external;
    function reportBreach(uint256 agreementId) external;
    function raiseDispute(uint256 agreementId, bytes32 reasonHash) external;
    function resolveDispute(uint256 agreementId, bool favorProposer) external;
    function withdrawDeposit(uint256 agreementId) external;
    function getAgreement(uint256 agreementId) external view returns (Agreement memory);
}
