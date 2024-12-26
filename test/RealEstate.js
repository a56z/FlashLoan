const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
    return ethers.parseUnits(n.toString(), "ether");
}

const ether = tokens;

describe("RealEstate", () => {
    let realEstate, escrow
    let deployer, seller
    let nftID = 1
    let purchasePrice = ether(100)
    let escrowAmount = ether(20)

    beforeEach(async () => {
        // Setup accounts
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        seller = deployer;
        buyer = accounts[1];
        inspector = accounts[2];
        lender = accounts[3];

        // Load contracts
        const RealEstate = await ethers.getContractFactory("RealEstate");
        const Escrow = await ethers.getContractFactory("Escrow");

        // Deploy RealEstate contract
        realEstate = await RealEstate.deploy();
        escrow = await Escrow.deploy(
            realEstate,
            nftID,
            purchasePrice,
            escrowAmount,
            seller.address,
            buyer.address,
            inspector.address,
            lender.address
        );

        // Seller Approves NFT
        const escrowAddress = await escrow.getAddress();
        transaction = await realEstate.connect(seller).approve(escrowAddress, nftID);
        await transaction.wait();
    })

    describe("Deployment", async () => {
        it('sends an NFT to the seller / deployer', async () => {
            expect(await realEstate.ownerOf(nftID)).to.equal(seller.address);
        })
    })

    describe("Selling real estate", async () => {
        let balance, transaction

        it('executes a successful transaction', async () => {
            // Expect seller to be NFT owner before the sale
            expect(await realEstate.ownerOf(nftID)).to.equal(seller.address);

            // Check escrow balance
            balance = await escrow.getBalance();
            console.log("escrow balance: ", ethers.formatEther(balance), "ETH");

            // Buyer deposits earnest
            transaction = await escrow.connect(buyer).depositEarnest({ value: ether(20)});
            await transaction.wait();
            console.log("Buyer deposits earnest");

            // Check escrow balance
            balance = await escrow.getBalance();
            console.log("escrow balance: ", ethers.formatEther(balance), "ETH");

            // Inspector updates status
            transaction = await escrow.connect(inspector).updateInspectionStatus(true);
            await transaction.wait();
            console.log("Inspector updates status");

            // Buyer approves sale
            transaction = await escrow.connect(buyer).approveSale();
            await transaction.wait();
            console.log("Buyer approves sale");

            // Seller approves sale
            transaction = await escrow.connect(seller).approveSale();
            await transaction.wait();
            console.log("Seller approves sale");

            // Lender funds the sale
            transaction = await lender.sendTransaction({
                to: await escrow.getAddress(), 
                value: ether(80) 
            })
            await transaction.wait();


            // Lender approves sale
            transaction = await escrow.connect(lender).approveSale();
            await transaction.wait();
            console.log("Lender approves sale");

            // Finalize the sale
            transaction = await escrow.connect(buyer).finalizeSale();
            await transaction.wait();
            console.log("Buyer finalizes sale");

            // Expect buyer to be NFT owner after the sale
            expect(await realEstate.ownerOf(nftID)).to.equal(buyer.address);

            // Expect Seller to receive the funds
            balance = await ethers.provider.getBalance(seller.getAddress());
            console.log("Seller balance: ", ethers.formatEther(balance), "ETH");
            expect(balance).to.be.above(ether(10099));
        })
    })
})