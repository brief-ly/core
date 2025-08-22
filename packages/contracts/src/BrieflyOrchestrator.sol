// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BrieflyLawyerIdentity.sol";

contract BrieflyEscrow {
    address public orchestrator;

    enum EscrowStatus {
        PENDING,
        PAID,
        COMPLETED,
        CANCELLED
    }

    struct Document {
        string documentHash;
        uint256 paymentRequired;
        address lawyer;
        uint256 groupId;
        EscrowStatus status;
        bool exists;
    }

    mapping(uint256 => Document) public documents;
    mapping(uint256 => bool) public paymentsMade;
    uint256 public nextDocumentId;

    event DocumentAdded(
        uint256 indexed documentId,
        string documentHash,
        uint256 paymentRequired,
        address indexed lawyer,
        uint256 indexed groupId
    );

    event PaymentMade(
        uint256 indexed documentId,
        address indexed payer,
        uint256 amount
    );

    event DocumentCompleted(uint256 indexed documentId);

    modifier onlyServer() {
        IBrieflyOrchestrator orch = IBrieflyOrchestrator(orchestrator);
        require(msg.sender == orch.server(), "Only server");
        _;
    }

    modifier onlyLawyer(uint256 documentId) {
        require(
            documents[documentId].lawyer == msg.sender,
            "Only document lawyer"
        );
        _;
    }

    constructor(address _orchestrator) {
        orchestrator = _orchestrator;
        nextDocumentId = 1;
    }

    function addDocument(
        string memory _documentHash,
        uint256 _paymentRequired,
        address _lawyer,
        uint256 _groupId
    ) external onlyServer returns (uint256) {
        uint256 documentId = nextDocumentId++;

        documents[documentId] = Document({
            documentHash: _documentHash,
            paymentRequired: _paymentRequired,
            lawyer: _lawyer,
            groupId: _groupId,
            status: EscrowStatus.PENDING,
            exists: true
        });

        emit DocumentAdded(
            documentId,
            _documentHash,
            _paymentRequired,
            _lawyer,
            _groupId
        );
        return documentId;
    }

    function makePayment(uint256 documentId) external {
        Document storage doc = documents[documentId];
        require(doc.exists, "Document does not exist");
        require(
            doc.status == EscrowStatus.PENDING,
            "Payment already made or document completed"
        );
        require(!paymentsMade[documentId], "Payment already made");

        IBrieflyOrchestrator orch = IBrieflyOrchestrator(orchestrator);
        IERC20 busd = orch.busd();
        require(
            busd.transferFrom(msg.sender, address(this), doc.paymentRequired),
            "Payment failed"
        );

        paymentsMade[documentId] = true;
        doc.status = EscrowStatus.PAID;

        emit PaymentMade(documentId, msg.sender, doc.paymentRequired);
    }

    function completeDocument(
        uint256 documentId
    ) external onlyLawyer(documentId) {
        Document storage doc = documents[documentId];
        require(doc.exists, "Document does not exist");
        require(doc.status == EscrowStatus.PAID, "Payment not made");

        IBrieflyOrchestrator orch = IBrieflyOrchestrator(orchestrator);
        IERC20 busd = orch.busd();
        require(
            busd.transfer(doc.lawyer, doc.paymentRequired),
            "Payment to lawyer failed"
        );

        doc.status = EscrowStatus.COMPLETED;

        emit DocumentCompleted(documentId);
    }

    function getDocument(
        uint256 documentId
    )
        external
        view
        returns (
            string memory documentHash,
            uint256 paymentRequired,
            address lawyer,
            uint256 groupId,
            EscrowStatus status,
            bool paymentMade
        )
    {
        Document memory doc = documents[documentId];
        require(doc.exists, "Document does not exist");

        return (
            doc.documentHash,
            doc.paymentRequired,
            doc.lawyer,
            doc.groupId,
            doc.status,
            paymentsMade[documentId]
        );
    }

    function isDocumentUnlocked(
        uint256 documentId
    ) external view returns (bool) {
        return
            documents[documentId].exists &&
            documents[documentId].status == EscrowStatus.PAID;
    }
}

contract BrieflyOrchestrator {
    address public server;
    BrieflyLawyerIdentity public lawyerIdentity;
    IERC20 public busd;
    uint256 public constant ONE_BUSD = 1e18;

    mapping(uint256 => address) public groupEscrows;
    uint256 public nextEscrowId;

    event EscrowDeployed(uint256 indexed groupId, address escrowContract);

    modifier onlyServer() {
        require(msg.sender == server, "Only server");
        _;
    }

    constructor(address busdAddress) {
        server = msg.sender;
        lawyerIdentity = new BrieflyLawyerIdentity();
        lawyerIdentity.setOrchestrator(address(this));
        busd = IERC20(busdAddress);
        nextEscrowId = 1;
    }

    function deployEscrowForGroup(
        uint256 groupId
    ) external onlyServer returns (address) {
        require(
            groupEscrows[groupId] == address(0),
            "Escrow already deployed for group"
        );

        BrieflyEscrow escrow = new BrieflyEscrow(address(this));
        groupEscrows[groupId] = address(escrow);

        emit EscrowDeployed(groupId, address(escrow));
        return address(escrow);
    }

    function getGroupEscrow(uint256 groupId) external view returns (address) {
        return groupEscrows[groupId];
    }
}
