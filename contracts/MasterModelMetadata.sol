// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MasterModelMetadata {
    struct Strategy {
        bytes32 strategyId;
        bytes32 zkID;
        uint256 submissionTimestamp;
        uint16 sharpeRatio;
        uint16 maxDrawdown;
        uint16 totalReturn;
        uint16 profitFactor;
        uint16 weight;
    }

    struct ModelMetrics {
        uint16 sharpeRatio;
        uint16 maxDrawdown;
        uint16 totalReturn;
        uint16 profitFactor;
    }

    mapping(bytes32 => Strategy) public strategies; // strategyId => Strategy
    bytes32[] public strategyIds;

    struct MasterModel {
        uint256 lastUpdate;
        ModelMetrics easy;
        ModelMetrics medium;
        ModelMetrics high;
    }

    MasterModel public masterModel;

    event StrategySubmitted(bytes32 indexed strategyId, bytes32 indexed zkID, uint256 timestamp);
    event MasterModelUpdated(uint256 timestamp);

    function submitStrategy(
        bytes32 strategyId,
        bytes32 zkID,
        uint16 sharpeRatio,
        uint16 maxDrawdown,
        uint16 totalReturn,
        uint16 profitFactor,
        uint16 weight
    ) external {
        strategies[strategyId] = Strategy(
            strategyId,
            zkID,
            block.timestamp,
            sharpeRatio,
            maxDrawdown,
            totalReturn,
            profitFactor,
            weight
        );
        strategyIds.push(strategyId);
        emit StrategySubmitted(strategyId, zkID, block.timestamp);
    }

    function updateMasterModel(
        ModelMetrics calldata easy,
        ModelMetrics calldata medium,
        ModelMetrics calldata high
    ) external {
        masterModel.lastUpdate = block.timestamp;
        masterModel.easy = easy;
        masterModel.medium = medium;
        masterModel.high = high;
        emit MasterModelUpdated(block.timestamp);
    }

    // Helper to get all strategy IDs
    function getAllStrategyIds() external view returns (bytes32[] memory) {
        return strategyIds;
    }
} 