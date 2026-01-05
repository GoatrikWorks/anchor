// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IIdentity.sol";

contract Identity is IIdentity {
    uint256 private _nextIdentityId = 1;

    mapping(uint256 => Identity) private _identities;
    mapping(address => uint256) private _ownerToIdentity;
    mapping(uint256 => mapping(bytes32 => bytes32)) private _traits;

    modifier onlyIdentityOwner(uint256 identityId) {
        require(_identities[identityId].owner == msg.sender, "Not identity owner");
        _;
    }

    modifier identityExists(uint256 identityId) {
        require(_identities[identityId].exists, "Identity does not exist");
        _;
    }

    function createIdentity(bytes32 nameHash) external returns (uint256) {
        require(_ownerToIdentity[msg.sender] == 0, "Already has identity");
        require(nameHash != bytes32(0), "Name hash required");

        uint256 identityId = _nextIdentityId++;

        _identities[identityId] = Identity({
            owner: msg.sender,
            nameHash: nameHash,
            createdAt: block.timestamp,
            exists: true
        });

        _ownerToIdentity[msg.sender] = identityId;

        emit IdentityCreated(identityId, msg.sender, nameHash, block.timestamp);

        return identityId;
    }

    function setTrait(
        uint256 identityId,
        bytes32 key,
        bytes32 value
    ) external onlyIdentityOwner(identityId) identityExists(identityId) {
        _traits[identityId][key] = value;
        emit TraitSet(identityId, key, value, block.timestamp);
    }

    function getTrait(uint256 identityId, bytes32 key)
        external
        view
        identityExists(identityId)
        returns (bytes32)
    {
        return _traits[identityId][key];
    }

    function getIdentity(uint256 identityId)
        external
        view
        returns (Identity memory)
    {
        require(_identities[identityId].exists, "Identity does not exist");
        return _identities[identityId];
    }

    function getIdentityByOwner(address owner) external view returns (uint256) {
        return _ownerToIdentity[owner];
    }

    function hasIdentity(address owner) external view returns (bool) {
        return _ownerToIdentity[owner] != 0;
    }
}
