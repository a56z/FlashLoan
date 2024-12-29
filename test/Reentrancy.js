const { expect } = require("chai");
const { ethers } = require("hardhat");

describe('Reentrancy', () => {
    let deployer
    let bank, attackerContract

    beforeEach(async () => {
        [deployer, user, attacker] = await ethers.getSigners();
        
        const Bank = await ethers.getContractFactory('Bank', deployer);
        bank = await Bank.deploy();

        await bank.deposit({ value: ethers.parseEther('100') });
        await bank.connect(user).deposit({ value: ethers.parseEther('50') });

        const Attacker = await ethers.getContractFactory('Attacker', attacker);
        attackerContract = await Attacker.deploy(bank.getAddress());
    })

    describe('facilitates deposits and withrawals', () => {
        it('accepts deposits', async () => {
            //Check deposit balance
            const deployerBalance = await bank.balanceOf(deployer.getAddress());
            expect(deployerBalance).to.eq(ethers.parseEther('100'));

            const userBalance = await bank.balanceOf(user.getAddress());
            expect(userBalance).to.eq(ethers.parseEther('50'));
        })

        it('allows withdrawals', async () => {
            await bank.withdraw();

            const deployerBalance = await bank.balanceOf(deployer.getAddress());
            const userBalance = await bank.balanceOf(user.getAddress());

            expect(deployerBalance).to.eq(0);
            expect(userBalance).to.eq(ethers.parseEther('50'));
        })

        it('allows attacker to drain funds from #withdraw()', async () => {
            console.log('*******   Before   *******')
            console.log(`Bank's balance: ${ethers.formatEther(await ethers.provider.getBalance(bank.getAddress()))}`, 'ETH');
            console.log(`Attacker's balance: ${ethers.formatEther(await ethers.provider.getBalance(attacker.getAddress()))}`, 'ETH');
        
            // Perform Attack
            await attackerContract.attack({ value: ethers.parseEther('10') });

            console.log('*******    After   *******')
            console.log(`Bank's balance: ${ethers.formatEther(await ethers.provider.getBalance(bank.getAddress()))}`, 'ETH');
            console.log(`Attacker's balance: ${ethers.formatEther(await ethers.provider.getBalance(attacker.getAddress()))}`, 'ETH');
        
            // Check bank balance has been drained
            expect(await ethers.provider.getBalance(bank.getAddress())).to.eq(0);
        })
    })
})