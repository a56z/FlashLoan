const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Counter", () => {

    let counter;

    beforeEach(async () => {
        const Counter = await ethers.getContractFactory("Counter");
        counter = await Counter.deploy("MyCounter", 1);
    })
    
    describe("Deployment", () => {
        
        it("sets the initial count", async () => {
            expect(await counter.count()).to.equal(1);
        })
    
        it("sets the initial name", async () => {
            expect(await counter.name()).to.equal("MyCounter");
        })
    })

    describe("Counting", () => {
        let transaction;

        it('reads the count from the "count" public variable', async () => {
            expect(await counter.count()).to.equal(1);
        })

        it('reads the count from the "getCount()" function', async () => {
            expect(await counter.getCount()).to.equal(1);
        })

        it("increments the count", async () => {
            transaction = await counter.increment();
            await transaction.wait();

            expect(await counter.count()).to.equal(2);

            transaction = await counter.increment();
            await transaction.wait();

            expect(await counter.count()).to.equal(3);
        })

        it("decrements the count", async () => {
            transaction = await counter.decrement();
            await transaction.wait();

            expect(await counter.count()).to.equal(0);

            // Cannot decrement count below 0
            await expect(counter.decrement()).to.be.reverted;
        })

        it('reads the name from the "name" public variable', async () => {
            expect(await counter.name()).to.equal('MyCounter');
        })

        it('reads the count from the "getName()" function', async () => {
            expect(await counter.getName()).to.equal("MyCounter");
        })

        it('updates the name', async () => {
            transaction = await counter.setName("NewName");
            await transaction.wait();
            expect(await counter.name()).to.equal("NewName");
        })
    })
})