import type { NextApiRequest, NextApiResponse } from 'next';
import { evaluateStrategy } from '../../utils/strategyEvaluator';
import { MasterQuantModel, StrategyEntry } from '../../utils/masterQuantModel';

// Singleton master model instance, loaded from file
const globalAny = global as any;
let masterModelPromise: Promise<MasterQuantModel>;
if (!globalAny.masterQuantModelPromise) {
  globalAny.masterQuantModelPromise = MasterQuantModel.loadFromFile();
}
masterModelPromise = globalAny.masterQuantModelPromise;

type ResponseData = {
  metrics: {
    sharpeRatio: number;
    maxDrawdown: number;
    totalReturn: number;
    profitFactor: number;
    numberOfTrades: number;
  };
  passed: boolean;
  masterModel: {
    strategies: {
      code: string;
      metrics: {
        sharpeRatio: number;
        maxDrawdown: number;
        totalReturn: number;
        profitFactor: number;
        numberOfTrades: number;
      };
      weights: {
        low: number;
        medium: number;
        high: number;
      };
    }[];
    scores: {
      low: number;
      medium: number;
      high: number;
    };
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData & { duplicate?: boolean }>
) {
  const masterModel = await masterModelPromise;

  if (req.method === 'DELETE') {
    await masterModel.clearStrategies();
    return res.status(200).json({
      metrics: {
        sharpeRatio: 0,
        maxDrawdown: 0,
        totalReturn: 0,
        profitFactor: 0,
        numberOfTrades: 0
      },
      passed: false,
      masterModel: {
        strategies: masterModel.strategies,
        scores: masterModel.scores
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      metrics: {
        sharpeRatio: 0,
        maxDrawdown: 0,
        totalReturn: 0,
        profitFactor: 0,
        numberOfTrades: 0
      },
      passed: false,
      masterModel: {
        strategies: masterModel.strategies,
        scores: masterModel.scores
      }
    });
  }

  try {
    const { code } = req.body;
    // Evaluate the strategy
    const evaluation = await evaluateStrategy(code);
    // Check if the strategy meets all criteria
    const passed = 
      evaluation.sharpeRatio >= 0.5 &&
      evaluation.maxDrawdown <= 20 &&
      evaluation.totalReturn >= 5 &&
      evaluation.profitFactor >= 1.3 &&
      evaluation.numberOfTrades >= 30;
    let duplicate = false;
    // Only add to master model if passed and not duplicate
    if (passed) {
      const entry: StrategyEntry = {
        code,
        metrics: evaluation,
        weights: { low: 0, medium: 0, high: 0 }
      };
      const added = await masterModel.addStrategy(entry);
      if (!added) duplicate = true;
    }
    res.status(200).json({
      metrics: evaluation,
      passed: passed && !duplicate,
      duplicate,
      masterModel: {
        strategies: masterModel.strategies,
        scores: masterModel.scores
      }
    });
  } catch (error) {
    console.error('Error evaluating strategy:', error);
    res.status(500).json({
      metrics: {
        sharpeRatio: 0,
        maxDrawdown: 0,
        totalReturn: 0,
        profitFactor: 0,
        numberOfTrades: 0
      },
      passed: false,
      masterModel: {
        strategies: masterModel.strategies,
        scores: masterModel.scores
      }
    });
  }
} 