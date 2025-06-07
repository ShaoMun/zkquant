// MasterQuantModel: Container for all strategies and their weights for each risk level
import { EvaluationResult } from './strategyEvaluator';
import * as fs from 'fs/promises';
import * as path from 'path';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface StrategyEntry {
  code: string; // The strategy code
  metrics: EvaluationResult;
  weights: {
    low: number;
    medium: number;
    high: number;
  };
}

export class MasterQuantModel {
  strategies: StrategyEntry[] = [];
  scores: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0 };
  static filePath = path.join(process.cwd(), 'data', 'masterModel.json');

  constructor() {}

  async addStrategy(entry: StrategyEntry) {
    // Allow all strategies, even duplicates
    this.strategies.push(entry);
    this.adjustWeights();
    this.updateScores();
    await this.saveToFile();
    return true;
  }

  // Adjust weights for each strategy based on risk level and metrics
  adjustWeights() {
    // Find min/max for normalization
    const minMax = {
      sharpe: { min: Infinity, max: -Infinity },
      drawdown: { min: Infinity, max: -Infinity },
      profitFactor: { min: Infinity, max: -Infinity },
      totalReturn: { min: Infinity, max: -Infinity },
    };
    for (const s of this.strategies) {
      minMax.sharpe.min = Math.min(minMax.sharpe.min, s.metrics.sharpeRatio);
      minMax.sharpe.max = Math.max(minMax.sharpe.max, s.metrics.sharpeRatio);
      minMax.drawdown.min = Math.min(minMax.drawdown.min, s.metrics.maxDrawdown);
      minMax.drawdown.max = Math.max(minMax.drawdown.max, s.metrics.maxDrawdown);
      minMax.profitFactor.min = Math.min(minMax.profitFactor.min, s.metrics.profitFactor);
      minMax.profitFactor.max = Math.max(minMax.profitFactor.max, s.metrics.profitFactor);
      minMax.totalReturn.min = Math.min(minMax.totalReturn.min, s.metrics.totalReturn);
      minMax.totalReturn.max = Math.max(minMax.totalReturn.max, s.metrics.totalReturn);
    }
    // Helper to normalize
    const norm = (val: number, min: number, max: number) => (max - min === 0 ? 0.5 : (val - min) / (max - min));
    // Calculate raw weights
    for (const s of this.strategies) {
      const sharpe = norm(s.metrics.sharpeRatio, minMax.sharpe.min, minMax.sharpe.max);
      const drawdown = norm(s.metrics.maxDrawdown, minMax.drawdown.min, minMax.drawdown.max); // higher is worse
      const profitFactor = norm(s.metrics.profitFactor, minMax.profitFactor.min, minMax.profitFactor.max);
      const totalReturn = norm(s.metrics.totalReturn, minMax.totalReturn.min, minMax.totalReturn.max);
      // Low risk: prioritize low drawdown, high Sharpe
      s.weights.low = 0.4 * sharpe + 0.3 * (1 - drawdown) + 0.2 * profitFactor + 0.1 * totalReturn;
      // Medium risk: balanced
      s.weights.medium = 0.25 * sharpe + 0.25 * (1 - drawdown) + 0.25 * profitFactor + 0.25 * totalReturn;
      // High risk: prioritize high return
      s.weights.high = 0.1 * sharpe + 0.1 * (1 - drawdown) + 0.3 * profitFactor + 0.5 * totalReturn;
    }
    // Normalize weights for each risk level
    for (const level of ['low', 'medium', 'high'] as RiskLevel[]) {
      const sum = this.strategies.reduce((acc, s) => acc + s.weights[level], 0) || 1;
      for (const s of this.strategies) {
        s.weights[level] = s.weights[level] / sum;
      }
    }
  }

  // Update the master model's score for each risk level
  updateScores() {
    // Example: weighted average of totalReturn for each risk level
    for (const level of ['low', 'medium', 'high'] as RiskLevel[]) {
      this.scores[level] = this.strategies.reduce(
        (acc, s) => acc + s.metrics.totalReturn * s.weights[level],
        0
      );
    }
  }

  // Optionally, get the current strategies and weights for a given risk level
  getPortfolio(risk: RiskLevel) {
    return this.strategies.map(s => ({ code: s.code, weight: s.weights[risk], metrics: s.metrics }));
  }

  // Clear all strategies from the master model
  async clearStrategies() {
    this.strategies = [];
    this.scores = { low: 0, medium: 0, high: 0 };
    await this.saveToFile();
  }

  async saveToFile() {
    const data = {
      strategies: this.strategies,
      scores: this.scores
    };
    await fs.mkdir(path.dirname(MasterQuantModel.filePath), { recursive: true });
    await fs.writeFile(MasterQuantModel.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  static async loadFromFile() {
    try {
      const filePath = MasterQuantModel.filePath;
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      const model = new MasterQuantModel();
      model.strategies = data.strategies || [];
      model.scores = data.scores || { low: 0, medium: 0, high: 0 };
      return model;
    } catch (err) {
      // If file doesn't exist, return empty model
      return new MasterQuantModel();
    }
  }
} 