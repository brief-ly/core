// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IBrieflyOrchestrator {
    function server() external view returns (address);

    function busd() external view returns (IERC20);
}

contract BrieflyEscrow is ReentrancyGuard {
    IBrieflyOrchestrator public orchestrator;

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
        require(msg.sender == orchestrator.server(), "Only server");
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
        orchestrator = IBrieflyOrchestrator(_orchestrator);
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

    function makePayment(uint256 documentId) external nonReentrant {
        Document storage doc = documents[documentId];
        require(doc.exists, "Document does not exist");
        require(
            doc.status == EscrowStatus.PENDING,
            "Payment already made or document completed"
        );
        require(!paymentsMade[documentId], "Payment already made");

        IERC20 busd = orchestrator.busd();
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
    ) external onlyLawyer(documentId) nonReentrant {
        Document storage doc = documents[documentId];
        require(doc.exists, "Document does not exist");
        require(doc.status == EscrowStatus.PAID, "Payment not made");

        IERC20 busd = orchestrator.busd();
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
