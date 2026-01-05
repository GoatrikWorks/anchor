// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IAgreements.sol";
import "./interfaces/IIdentity.sol";

contract Agreements is IAgreements {
    IIdentity public immutable identityRegistry;
    address public arbiter;

    uint256 private _nextAgreementId = 1;

    mapping(uint256 => Agreement) private _agreements;
    mapping(uint256 => mapping(uint256 => uint256)) private _deposits;
    mapping(uint256 => bool) private _depositWithdrawn;

    modifier onlyWithIdentity() {
        require(identityRegistry.hasIdentity(msg.sender), "No identity");
        _;
    }

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Not arbiter");
        _;
    }

    modifier agreementExists(uint256 agreementId) {
        require(_agreements[agreementId].id != 0, "Agreement not found");
        _;
    }

    constructor(address _identityRegistry, address _arbiter) {
        identityRegistry = IIdentity(_identityRegistry);
        arbiter = _arbiter;
    }

    function proposeAgreement(
        bytes32 termsHash,
        uint256 requiredDeposit,
        uint256 deadline
    ) external payable onlyWithIdentity returns (uint256) {
        require(termsHash != bytes32(0), "Terms hash required");
        require(deadline > block.timestamp, "Deadline must be future");
        require(msg.value >= requiredDeposit, "Insufficient deposit");

        uint256 proposerId = identityRegistry.getIdentityByOwner(msg.sender);
        uint256 agreementId = _nextAgreementId++;

        _agreements[agreementId] = Agreement({
            id: agreementId,
            proposerId: proposerId,
            acceptorId: 0,
            termsHash: termsHash,
            proposerDeposit: msg.value,
            acceptorDeposit: requiredDeposit,
            deadline: deadline,
            status: AgreementStatus.Proposed,
            createdAt: block.timestamp
        });

        _deposits[agreementId][proposerId] = msg.value;

        emit AgreementProposed(
            agreementId,
            proposerId,
            termsHash,
            requiredDeposit,
            deadline,
            block.timestamp
        );

        return agreementId;
    }

    function acceptAgreement(uint256 agreementId)
        external
        payable
        onlyWithIdentity
        agreementExists(agreementId)
    {
        Agreement storage agreement = _agreements[agreementId];
        require(agreement.status == AgreementStatus.Proposed, "Not proposed");
        require(block.timestamp < agreement.deadline, "Deadline passed");

        uint256 acceptorId = identityRegistry.getIdentityByOwner(msg.sender);
        require(acceptorId != agreement.proposerId, "Cannot accept own");
        require(msg.value >= agreement.acceptorDeposit, "Insufficient deposit");

        agreement.acceptorId = acceptorId;
        agreement.acceptorDeposit = msg.value;
        agreement.status = AgreementStatus.Active;

        _deposits[agreementId][acceptorId] = msg.value;

        emit AgreementAccepted(agreementId, acceptorId, msg.value, block.timestamp);
    }

    function completeAgreement(uint256 agreementId)
        external
        onlyWithIdentity
        agreementExists(agreementId)
    {
        Agreement storage agreement = _agreements[agreementId];
        require(agreement.status == AgreementStatus.Active, "Not active");

        uint256 callerId = identityRegistry.getIdentityByOwner(msg.sender);
        require(
            callerId == agreement.proposerId || callerId == agreement.acceptorId,
            "Not party to agreement"
        );

        agreement.status = AgreementStatus.Completed;

        emit AgreementCompleted(agreementId, callerId, block.timestamp);
    }

    function reportBreach(uint256 agreementId)
        external
        onlyWithIdentity
        agreementExists(agreementId)
    {
        Agreement storage agreement = _agreements[agreementId];
        require(agreement.status == AgreementStatus.Active, "Not active");
        require(block.timestamp > agreement.deadline, "Deadline not passed");

        uint256 callerId = identityRegistry.getIdentityByOwner(msg.sender);
        require(
            callerId == agreement.proposerId || callerId == agreement.acceptorId,
            "Not party to agreement"
        );

        agreement.status = AgreementStatus.Breached;

        uint256 breacherId = callerId == agreement.proposerId
            ? agreement.acceptorId
            : agreement.proposerId;

        emit AgreementBreached(agreementId, breacherId, block.timestamp);
    }

    function raiseDispute(uint256 agreementId, bytes32 reasonHash)
        external
        onlyWithIdentity
        agreementExists(agreementId)
    {
        Agreement storage agreement = _agreements[agreementId];
        require(
            agreement.status == AgreementStatus.Active ||
            agreement.status == AgreementStatus.Breached,
            "Cannot dispute"
        );

        uint256 callerId = identityRegistry.getIdentityByOwner(msg.sender);
        require(
            callerId == agreement.proposerId || callerId == agreement.acceptorId,
            "Not party to agreement"
        );

        agreement.status = AgreementStatus.Disputed;

        emit DisputeRaised(agreementId, callerId, reasonHash, block.timestamp);
    }

    function resolveDispute(uint256 agreementId, bool favorProposer)
        external
        onlyArbiter
        agreementExists(agreementId)
    {
        Agreement storage agreement = _agreements[agreementId];
        require(agreement.status == AgreementStatus.Disputed, "Not disputed");

        agreement.status = AgreementStatus.Resolved;

        uint256 totalDeposits = _deposits[agreementId][agreement.proposerId] +
            _deposits[agreementId][agreement.acceptorId];

        uint256 winnerId = favorProposer ? agreement.proposerId : agreement.acceptorId;
        uint256 loserId = favorProposer ? agreement.acceptorId : agreement.proposerId;

        _deposits[agreementId][winnerId] = totalDeposits;
        _deposits[agreementId][loserId] = 0;

        emit DisputeResolved(agreementId, winnerId, favorProposer, block.timestamp);
    }

    function withdrawDeposit(uint256 agreementId)
        external
        onlyWithIdentity
        agreementExists(agreementId)
    {
        Agreement storage agreement = _agreements[agreementId];
        require(
            agreement.status == AgreementStatus.Completed ||
            agreement.status == AgreementStatus.Resolved,
            "Cannot withdraw"
        );

        uint256 callerId = identityRegistry.getIdentityByOwner(msg.sender);
        uint256 amount = _deposits[agreementId][callerId];
        require(amount > 0, "No deposit");

        _deposits[agreementId][callerId] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit DepositWithdrawn(agreementId, callerId, amount, block.timestamp);
    }

    function getAgreement(uint256 agreementId)
        external
        view
        returns (Agreement memory)
    {
        require(_agreements[agreementId].id != 0, "Agreement not found");
        return _agreements[agreementId];
    }

    function getDeposit(uint256 agreementId, uint256 identityId)
        external
        view
        returns (uint256)
    {
        return _deposits[agreementId][identityId];
    }
}
