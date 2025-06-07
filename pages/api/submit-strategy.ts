import type { NextApiRequest, NextApiResponse } from 'next';
import { evaluateStrategy } from '../../utils/strategyEvaluator';

type ResponseData = {
  metrics: {
    sharpeRatio: number;
    maxDrawdown: number;
    totalReturn: number;
    profitFactor: number;
    numberOfTrades: number;
  };
  passed: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      metrics: {
        sharpeRatio: 0,
        maxDrawdown: 0,
        totalReturn: 0,
        profitFactor: 0,
        numberOfTrades: 0
      },
      passed: false
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

    res.status(200).json({
      metrics: evaluation,
      passed
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
      passed: false
    });
  }
} 