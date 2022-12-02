// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Marketplace is Initializable {
    struct RentingConditions {
        uint128 price;
        uint128 duration;
        uint64 createdAt;
    }

    // Mapping from token  to renting conditions
    mapping(uint256 => RentingConditions) private _availableForRenting;

    // Array with all token IDs available for renting
    uint256[] private _allAvailableForRenting;

    // Mapping from token ID to position in the allAvailable array
    mapping(uint256 => uint256) private _allAvailableForRentingIndex;

    function __Marketplace_init() internal onlyInitializing {

    }
}
