// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Identity.sol";

contract IdentityTest is Test {
    Identity public identity;
    address public alice = address(0x1);
    address public bob = address(0x2);

    function setUp() public {
        identity = new Identity();
    }

    function test_CreateIdentity() public {
        vm.prank(alice);
        bytes32 nameHash = keccak256("Alice");
        uint256 id = identity.createIdentity(nameHash);

        assertEq(id, 1);
        assertTrue(identity.hasIdentity(alice));
        assertEq(identity.getIdentityByOwner(alice), 1);

        IIdentity.Identity memory ident = identity.getIdentity(id);
        assertEq(ident.owner, alice);
        assertEq(ident.nameHash, nameHash);
        assertTrue(ident.exists);
    }

    function test_CannotCreateTwoIdentities() public {
        vm.startPrank(alice);
        identity.createIdentity(keccak256("Alice"));

        vm.expectRevert("Already has identity");
        identity.createIdentity(keccak256("Alice2"));
        vm.stopPrank();
    }

    function test_CannotCreateWithEmptyName() public {
        vm.prank(alice);
        vm.expectRevert("Name hash required");
        identity.createIdentity(bytes32(0));
    }

    function test_SetAndGetTrait() public {
        vm.startPrank(alice);
        uint256 id = identity.createIdentity(keccak256("Alice"));

        bytes32 key = keccak256("profession");
        bytes32 value = keccak256("merchant");

        identity.setTrait(id, key, value);
        assertEq(identity.getTrait(id, key), value);
        vm.stopPrank();
    }

    function test_OnlyOwnerCanSetTrait() public {
        vm.prank(alice);
        uint256 id = identity.createIdentity(keccak256("Alice"));

        vm.prank(bob);
        vm.expectRevert("Not identity owner");
        identity.setTrait(id, keccak256("key"), keccak256("value"));
    }

    function test_IdentityCreatedEvent() public {
        bytes32 nameHash = keccak256("Alice");

        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit IIdentity.IdentityCreated(1, alice, nameHash, block.timestamp);
        identity.createIdentity(nameHash);
    }

    function test_TraitSetEvent() public {
        vm.startPrank(alice);
        uint256 id = identity.createIdentity(keccak256("Alice"));

        bytes32 key = keccak256("profession");
        bytes32 value = keccak256("merchant");

        vm.expectEmit(true, true, false, true);
        emit IIdentity.TraitSet(id, key, value, block.timestamp);
        identity.setTrait(id, key, value);
        vm.stopPrank();
    }

    function test_MultipleIdentities() public {
        vm.prank(alice);
        uint256 id1 = identity.createIdentity(keccak256("Alice"));

        vm.prank(bob);
        uint256 id2 = identity.createIdentity(keccak256("Bob"));

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(identity.getIdentityByOwner(alice), 1);
        assertEq(identity.getIdentityByOwner(bob), 2);
    }

    function test_GetNonExistentIdentity() public {
        vm.expectRevert("Identity does not exist");
        identity.getIdentity(999);
    }

    function test_HasIdentityFalseForNewAddress() public {
        assertFalse(identity.hasIdentity(alice));
        assertEq(identity.getIdentityByOwner(alice), 0);
    }
}
