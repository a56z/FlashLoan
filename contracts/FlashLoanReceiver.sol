// SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";
import "./FlashLoan.sol";

contract FlashLoanReceiver {
    
    FlashLoan private pool;
    address private owner;

    event LoanReceived(address token, uint256 amount);

    constructor(address _poolAddress) {
        pool = FlashLoan(_poolAddress);
        owner = msg.sender;
    }

    function receiveTokens(address _tokenAddress, uint256 _amount) external {
        require(msg.sender == address(pool), "Only the pool can send tokens to this contract");

        // Require funds received
        require(Token(_tokenAddress).balanceOf(address(this)) == _amount, "Failed to get loan");
        
        // Emit event
        emit LoanReceived(_tokenAddress, _amount);

        // Do stuff with the money ....

        // Pay back the loan
        require(Token(_tokenAddress).transfer(msg.sender, _amount), "Failed to pay back loan");
    }

    function executeFlashLoan(uint _amount) external {
        require(msg.sender == owner, "Only the owner can execute a flashloan");
        pool.flashLoan(_amount);
    }
}