// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BrieflyLawyerIdentity.sol";

contract BrieflyOrchestrator {
    address public server;
    BrieflyLawyerIdentity public lawyerIdentity;
    IERC20 public busd;
    uint256 public constant ONE_BUSD = 1e18;

    constructor(address busd) {
        server = msg.sender;
        lawyerIdentity = new BrieflyLawyerIdentity();
        busd = IERC20(busd);
    }
}
