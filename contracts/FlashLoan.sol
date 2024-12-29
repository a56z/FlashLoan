// SPDX-License-Identifier: Unlicense

// Contract inspired by Damn Vulnerable DeFi
// Original Contract:
// https://github.com/OpenZeppelin/damn-vulnerable-defi/blob/master/contracts/unstoppable/UnstoppableLender.sol

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IReceiver {
    function receiveTokens(address tokenAddress, uint256 amount) external;
}

contract FlashLoan is ReentrancyGuard {

    Token public token;
    uint256 public poolBalance;

    constructor(address _tokenAddress) {
        token = Token(_tokenAddress);
    }

    function depositTokens(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than 0");
        token.transferFrom(msg.sender, address(this), _amount);
        poolBalance += _amount; // Safe in Solidity 0.8+
    }

    function flashLoan(uint256 _borrowAmount) external nonReentrant{
        require(_borrowAmount > 0, "Amount must be greater than 0");

        uint256 balanceBefore = token.balanceOf(address(this));
        require(balanceBefore >= _borrowAmount, "Not enough funds in pool");

        // Ensured by the protocol via the 'depositTokens' function
        assert(poolBalance == balanceBefore);

        // Send tokens to receiver
        token.transfer(msg.sender, _borrowAmount);

        // Use loand, Get paid back
        IReceiver(msg.sender).receiveTokens(address(token), _borrowAmount);
        
        // Ensure loan paid back
        uint256  balanceAfter = token.balanceOf(address(this));
        require(balanceAfter >= balanceBefore, "Flashloan: Loan not paid back");
    }
}