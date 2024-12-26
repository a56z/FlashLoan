// SPDX-License-Identifier: UNLISENSED

pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(address _from, address _to, uint256 _id) external;
}

contract Escrow {
    address public nftAddress;
    uint256 public nftID;
    uint256 public purchasePrice;
    uint256 public escrowAmount;
    address payable public seller;
    address payable public buyer;
    address public inspector;
    address public lender;

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can deposit earnest money");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this function");
        _;
    }

    receive() external payable {}

    bool public inspectionPassed = false;
    mapping(address => bool) public approval;

    constructor(
        address _nftAddress, 
        uint256 _nftID,
        uint256 _purchasePrice,
        uint256 _escrowAmount,
        address payable _seller, 
        address payable _buyer,
        address  _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        nftID = _nftID;
        purchasePrice = _purchasePrice;
        escrowAmount = _escrowAmount;
        seller = _seller;
        buyer = _buyer;
        inspector = _inspector;
        lender = _lender;
    }

    function depositEarnest() public payable onlyBuyer {
        require(msg.value >= escrowAmount, "Insufficient earnest money");
    }

    function updateInspectionStatus(bool _passed) public onlyInspector{
        inspectionPassed = _passed;
    } 

    function approveSale() public {
        approval[msg.sender] = true;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function finalizeSale() public {
        require(inspectionPassed, "Inspection must pass before finalizing sale");
        require(approval[buyer], "Buyer must approve sale before finalizing");
        require(approval[seller], "Seller must approve sale before finalizing");
        require(approval[lender], "Lender must approve sale before finalizing");
        require(address(this).balance >= purchasePrice, "Insufficient funds to finalize sale");

        (bool success, ) = payable(seller).call{value: address(this).balance}("");
        require(success);

        // Transfer ownership of property
        IERC721(nftAddress).transferFrom(seller, buyer, nftID);
    } 
}