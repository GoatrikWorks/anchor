// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Identity.sol";
import "../src/Agreements.sol";

contract AgreementsTest is Test {
    Identity public identity;
    Agreements public agreements;

    address public arbiter = address(0x999);
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);

    uint256 public aliceId;
    uint256 public bobId;

    function setUp() public {
        identity = new Identity();
        agreements = new Agreements(address(identity), arbiter);

        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(charlie, 100 ether);

        vm.prank(alice);
        aliceId = identity.createIdentity(keccak256("Alice"));

        vm.prank(bob);
        bobId = identity.createIdentity(keccak256("Bob"));
    }

    function test_ProposeAgreement() public {
        bytes32 termsHash = keccak256("terms");
        uint256 deposit = 1 ether;
        uint256 deadline = block.timestamp + 1 days;

        vm.prank(alice);
        uint256 agreementId = agreements.proposeAgreement{value: deposit}(
            termsHash,
            deposit,
            deadline
        );

        assertEq(agreementId, 1);

        IAgreements.Agreement memory agreement = agreements.getAgreement(agreementId);
        assertEq(agreement.proposerId, aliceId);
        assertEq(agreement.termsHash, termsHash);
        assertEq(agreement.proposerDeposit, deposit);
        assertEq(uint256(agreement.status), uint256(IAgreements.AgreementStatus.Proposed));
    }

    function test_CannotProposeWithoutIdentity() public {
        vm.prank(charlie);
        vm.expectRevert("No identity");
        agreements.proposeAgreement{value: 1 ether}(
            keccak256("terms"),
            1 ether,
            block.timestamp + 1 days
        );
    }

    function test_CannotProposeWithPastDeadline() public {
        vm.prank(alice);
        vm.expectRevert("Deadline must be future");
        agreements.proposeAgreement{value: 1 ether}(
            keccak256("terms"),
            1 ether,
            block.timestamp - 1
        );
    }

    function test_AcceptAgreement() public {
        vm.prank(alice);
        uint256 agreementId = agreements.proposeAgreement{value: 1 ether}(
            keccak256("terms"),
            1 ether,
            block.timestamp + 1 days
        );

        vm.prank(bob);
        agreements.acceptAgreement{value: 1 ether}(agreementId);

        IAgreements.Agreement memory agreement = agreements.getAgreement(agreementId);
        assertEq(agreement.acceptorId, bobId);
        assertEq(uint256(agreement.status), uint256(IAgreements.AgreementStatus.Active));
    }

    function test_CannotAcceptOwnAgreement() public {
        vm.prank(alice);
        uint256 agreementId = agreements.proposeAgreement{value: 1 ether}(
            keccak256("terms"),
            1 ether,
            block.timestamp + 1 days
        );

        vm.prank(alice);
        vm.expectRevert("Cannot accept own");
        agreements.acceptAgreement{value: 1 ether}(agreementId);
    }

    function test_CompleteAgreement() public {
        vm.prank(alice);
        uint256 agreementId = agreements.proposeAgreement{value: 1 ether}(
            keccak256("terms"),
            1 ether,
            block.timestamp + 1 days
        );

        vm.prank(bob);
        agreements.acceptAgreement{value: 1 ether}(agreementId);

        vm.prank(alice);
        agreements.completeAgreement(agreementId);

        IAgreements.Agreement memory agreement = agreements.getAgreement(agreementId);
        assertEq(uint256(agreement.status), uint256(IAgreements.AgreementStatus.Completed));
    }

    function test_ReportBreach() public {
        vm.prank(alice);
        uint256 agreementId = agreements.proposeAgreement{value: 1 ether}(
            keccak256("terms"),
            1 ether,
            block.timestamp + 1 days
        );

        vm.prank(bob);
        agreements.acceptAgreement{value: 1 ether}(agreementId);

        vm.warp(block.timestamp + 2 days);

        vm.prank(alice);
        agreements.reportBreach(agreementId);

        IAgreements.Agreement memory agreement = agreements.getAgreement(agreementId);
        assertEq(uint256(agreement.status), uint256(IAgreements.AgreementStatus.Breached));
    }

    function test_CannotReportBreachBeforeDeadline() public {
        vm.prank(alice);
        uint256 agreementId = agreements.proposeAgreement{value: 1 ether}(
            keccak256("terms"),
            1 ether,
            block.timestamp + 1 days
        );

        vm.prank(bob);
        agreements.acceptAgreement{value: 1 ether}(agreementId);

        vm.prank(alice);
        vm.expectRevert("Deadline not passed");
        agreements.reportBreach(agreementId);
    }

    function test_RaiseDispute() public {
        vm.prank(alice);
        uint256 agreementId = agreements.proposeAgreement{value: 1 ether}(
            keccak256("terms"),
            1 ether,
            block.timestamp + 1 days
        );

        vm.prank(bob);
        agreements.acceptAgreement{value: 1 ether}(agreementId);

        vm.prank(bob);
        agreements.raiseDispute(agreementId, keccak256("reason"));

        IAgreements.Agreement memory agreement = agreements.getAgreement(agreementId);
        assertEq(uint256(agreement.status), uint256(IAgreements.AgreementStatus.Disputed));
    }

    function test_ResolveDisputeFavorProposer() public {
        vm.prank(alice);
        uint256 agreementId = agreements.proposeAgreement{value: 1 ether}(
            keccak256("terms"),
            1 ether,
            block.timestamp + 1 days
        );

        vm.prank(bob);
        agreements.acceptAgreement{value: 1 ether}(agreementId);

        vm.prank(alice);
        agreements.raiseDispute(agreementId, keccak256("reason"));

        vm.prank(arbiter);
        agreements.resolveDispute(agreementId, true);

        IAgreements.Agreement memory agreement = agreements.getAgreement(agreementId);
        assertEq(uint256(agreement.status), uint256(IAgreements.AgreementStatus.Resolved));

        assertEq(agreements.getDeposit(agreementId, aliceId), 2 ether);
        assertEq(agreements.getDeposit(agreementId, bobId), 0);
    }

    function test_ResolveDisputeFavorAcceptor() public {
        vm.prank(alice);
        uint256 agreementId = agreements.proposeAgreement{value: 1 ether}(
            keccak256("terms"),
            1 ether,
            block.timestamp + 1 days
        );

        vm.prank(bob);
        agreements.acceptAgreement{value: 1 ether}(agreementId);

        vm.prank(alice);
        agreements.raiseDispute(agreementId, keccak256("reason"));

        vm.prank(arbiter);
        agreements.resolveDispute(agreementId, false);

        assertEq(agreements.getDeposit(agreementId, aliceId), 0);
        assertEq(agreements.getDeposit(agreementId, bobId), 2 ether);
    }

    function test_OnlyArbiterCanResolve() public {
        vm.prank(alice);
        uint256 agreementId = agreements.proposeAgreement{value: 1 ether}(
            keccak256("terms"),
            1 ether,
            block.timestamp + 1 days
        );

        vm.prank(bob);
        agreements.acceptAgreement{value: 1 ether}(agreementId);

        vm.prank(alice);
        agreements.raiseDispute(agreementId, keccak256("reason"));

        vm.prank(alice);
        vm.expectRevert("Not arbiter");
        agreements.resolveDispute(agreementId, true);
    }

    function test_WithdrawDepositAfterComplete() public {
        vm.prank(alice);
        uint256 agreementId = agreements.proposeAgreement{value: 1 ether}(
            keccak256("terms"),
            1 ether,
            block.timestamp + 1 days
        );

        vm.prank(bob);
        agreements.acceptAgreement{value: 1 ether}(agreementId);

        vm.prank(alice);
        agreements.completeAgreement(agreementId);

        uint256 aliceBalanceBefore = alice.balance;

        vm.prank(alice);
        agreements.withdrawDeposit(agreementId);

        assertEq(alice.balance, aliceBalanceBefore + 1 ether);
    }

    function test_CannotWithdrawBeforeComplete() public {
        vm.prank(alice);
        uint256 agreementId = agreements.proposeAgreement{value: 1 ether}(
            keccak256("terms"),
            1 ether,
            block.timestamp + 1 days
        );

        vm.prank(bob);
        agreements.acceptAgreement{value: 1 ether}(agreementId);

        vm.prank(alice);
        vm.expectRevert("Cannot withdraw");
        agreements.withdrawDeposit(agreementId);
    }

    function test_AgreementProposedEvent() public {
        bytes32 termsHash = keccak256("terms");
        uint256 deposit = 1 ether;
        uint256 deadline = block.timestamp + 1 days;

        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit IAgreements.AgreementProposed(1, aliceId, termsHash, deposit, deadline, block.timestamp);
        agreements.proposeAgreement{value: deposit}(termsHash, deposit, deadline);
    }
}
