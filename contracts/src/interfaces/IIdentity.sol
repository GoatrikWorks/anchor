// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IIdentity {
    struct Identity {
        address owner;
        bytes32 nameHash;
        uint256 createdAt;
        bool exists;
    }

    event IdentityCreated(
        uint256 indexed identityId,
        address indexed owner,
        bytes32 nameHash,
        uint256 timestamp
    );

    event TraitSet(
        uint256 indexed identityId,
        bytes32 indexed traitKey,
        bytes32 traitValue,
        uint256 timestamp
    );

    function createIdentity(bytes32 nameHash) external returns (uint256);
    function setTrait(uint256 identityId, bytes32 key, bytes32 value) external;
    function getTrait(uint256 identityId, bytes32 key) external view returns (bytes32);
    function getIdentity(uint256 identityId) external view returns (Identity memory);
    function getIdentityByOwner(address owner) external view returns (uint256);
    function hasIdentity(address owner) external view returns (bool);
}
