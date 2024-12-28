const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
    return ethers.parseUnits(n.toString(), "ether");
}

const ether = tokens;

describe("FlashLoan", () => {

    let token, flashLoan, flashLoanReceiver;
    let deployer;
    beforeEach(async() => {
        // Setup accounts 

        accounts = await ethers.getSigners();
        deployer = accounts[0];

        // Load accounts
        const FlashLoan = await ethers.getContractFactory("FlashLoan");
        const FlashLoanReceiver = await ethers.getContractFactory("FlashLoanReceiver");
        const Token = await ethers.getContractFactory("Token");

        // Deploy Token
        token = await Token.deploy('Dapp University', 'DAPP', '1000000');

        // Deploy FlashLoan Pool
        flashLoan = await FlashLoan.deploy(token.getAddress());
        
        // Approve tokens before depositing
        let transaction = await token.connect(deployer).approve(flashLoan.getAddress(), tokens(1000000));
        await transaction.wait();
        
        // Deposit tokens into the pool
        transaction = await flashLoan.connect(deployer).depositTokens(tokens(1000000));
        await transaction.wait();

        // Deploy FashLoan receiver
        flashLoanReceiver = await FlashLoanReceiver.deploy(flashLoan.getAddress());
    })

    describe("Deployment", async () => {

        it('sends tokens to the flash loan pool contract', async () => {
            expect(await token.balanceOf(flashLoan.getAddress())).to.equal(tokens(1000000))
        })
    })

    describe("Borrowing funds", () => {
        it('borrows funds form the pool', async () => {
            let amount = tokens(100);
            let transaction = await flashLoanReceiver.connect(deployer).executeFlashLoan(amount);
            let result = await transaction.wait();

            await expect(transaction).to.emit(flashLoanReceiver, 'LoanReceived')
                .withArgs(token.getAddress(), amount);
        })
    })

})