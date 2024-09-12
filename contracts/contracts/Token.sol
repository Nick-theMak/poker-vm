// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    constructor() ERC20("Block52", "B52") {
        _mint(msg.sender, 100_000_000 * 10 ** decimals());
    }
}
