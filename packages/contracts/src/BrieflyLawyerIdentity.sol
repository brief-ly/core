// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBrieflyOrchestrator {
    function server() external view returns (address);

    function busd() external view returns (IERC20);
}

contract BrieflyLawyerIdentity is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    string private _baseTokenURI;

    address public orchestrator;

    event BaseURIUpdated(string previousBaseURI, string newBaseURI);

    modifier onlyOrchestrator() {
        require(msg.sender == orchestrator, "Not authorized");
        _;
    }

    modifier onlyServer() {
        require(
            msg.sender == IBrieflyOrchestrator(orchestrator).server(),
            "Not authorized"
        );
        _;
    }

    constructor()
        ERC721("Briefly Identity | Lawyer", "BrID")
        Ownable(msg.sender)
    {}

    function setOrchestrator(address _orchestrator) external onlyOwner {
        orchestrator = _orchestrator;
    }

    function setBaseURI(string memory newBaseURI) external onlyServer {
        string memory prev = _baseTokenURI;
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(prev, newBaseURI);
    }

    function safeMint(address to) public onlyOrchestrator {
        _tokenIdCounter += 1;
        _safeMint(to, _tokenIdCounter);
    }

    function burn(uint256 tokenId) public onlyServer {
        _burn(tokenId);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory baseURI = _baseURI();
        return
            bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, _toString(tokenId)))
                : "";
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
