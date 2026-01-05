// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/Identity.sol";
import "../src/Agreements.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address arbiter = vm.envAddress("ARBITER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        Identity identity = new Identity();
        console.log("Identity deployed at:", address(identity));

        Agreements agreements = new Agreements(address(identity), arbiter);
        console.log("Agreements deployed at:", address(agreements));

        vm.stopBroadcast();
    }
}
