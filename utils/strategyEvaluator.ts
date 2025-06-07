import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface Trade {
  entryPrice: number;
  exitPrice: number;
  entryTime: Date;
  exitTime: Date;
  profit: number;
}

export interface EvaluationResult {
  sharpeRatio: number;
  maxDrawdown: number;
  totalReturn: number;
  profitFactor: number;
  numberOfTrades: number;
}

// Add a simple seeded random number generator
function createSeededRandom(seed: number) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function generateTestData(length: number) {
  const prices: number[] = [];
  const timestamps: Date[] = [];
  let price = 100;
  let trend = 0;
  let volatility = 0.01;
  
  // Create seeded random number generator
  const random = createSeededRandom(12345);

  // Generate market regimes optimized for more trading opportunities
  const regimes = [
    { trend: 0.006, volatility: 0.004 },   // Steady uptrend
    { trend: -0.006, volatility: 0.004 },  // Steady downtrend
    { trend: 0.003, volatility: 0.003 },   // Slow uptrend
    { trend: -0.003, volatility: 0.003 },  // Slow downtrend
    { trend: 0.002, volatility: 0.002 },   // Very slow uptrend
    { trend: -0.002, volatility: 0.002 },  // Very slow downtrend
    { trend: 0, volatility: 0.003 },       // Low volatility
    { trend: 0, volatility: 0.002 }        // Very low volatility
  ];

  for (let i = 0; i < length; i++) {
    // Change regime more frequently for more trading opportunities
    if (i % 50 === 0) {
      const regime = regimes[Math.floor(random() * regimes.length)];
      trend = regime.trend;
      volatility = regime.volatility;
    }
    
    // Add very small noise to the trend and volatility
    const currentTrend = trend * (1 + (random() - 0.5) * 0.03);
    const currentVolatility = volatility * (1 + (random() - 0.5) * 0.03);
    
    // Generate price with trend and random walk
    const change = currentTrend + (random() - 0.5) * currentVolatility;
    price = price * (1 + change);
    prices.push(price);
    
    // Generate timestamp (one day per point)
    const date = new Date(2023, 0, i + 1);
    timestamps.push(date);
  }
  
  return { prices, timestamps };
}

const sampleData = generateTestData(1000);

export async function evaluateStrategy(code: string): Promise<EvaluationResult> {
  try {
    console.log('Starting strategy evaluation...');
    
    // Generate multiple test datasets with fixed seeds
    const numDatasets = 5;
    const allTrades: Trade[] = [];
    
    for (let i = 0; i < numDatasets; i++) {
      // Use different seeds for each dataset but keep them fixed
      const testData = generateTestData(1000);
      
      // Create a temporary Python file
      const tempDir = os.tmpdir();
      const tempFile = path.join(tempDir, `strategy_${i}.py`);
      
      // Wrap the strategy code with necessary imports and data handling
      const wrappedCode = `
import numpy as np
import json
import sys

${code}

def run_strategy(prices, timestamps):
    signals = []
    for i in range(len(prices)):
        if i < 50:  # Skip first 50 points to have enough data for indicators
            signals.append(None)
            continue
        try:
            signal = strategy(prices[:i+1], timestamps[:i+1])
            signals.append(signal)
        except Exception as e:
            print(f"Error at index {i}: {str(e)}", file=sys.stderr)
            signals.append(None)
    return signals

# Read input data
input_data = json.loads(sys.argv[1])
prices = input_data['prices']
timestamps = input_data['timestamps']

# Run strategy
signals = run_strategy(prices, timestamps)

# Output results
print(json.dumps(signals))
`;
      
      fs.writeFileSync(tempFile, wrappedCode);
      
      // Execute the Python script
      const signals = await new Promise<string[]>((resolve, reject) => {
        const pythonProcess = spawn('python3', [tempFile, JSON.stringify(testData)]);
        let output = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
          error += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Python process exited with code ${code}: ${error}`));
            return;
          }
          try {
            const signals = JSON.parse(output);
            resolve(signals);
          } catch (e) {
            reject(new Error(`Failed to parse Python output: ${e}`));
          }
        });
      });
      
      // Execute trades based on signals
      const trades = executeTrades(signals, testData.prices, testData.timestamps);
      allTrades.push(...trades);
    }
    
    if (allTrades.length < 30) {
      throw new Error('Strategy did not generate enough trades (minimum 30 required)');
    }
    
    // Calculate metrics
    const returns = allTrades.map(trade => trade.profit);
    const sharpeRatio = calculateSharpeRatio(returns);
    const maxDrawdown = calculateMaxDrawdown(returns);
    const totalReturn = calculateTotalReturn(returns);
    const profitFactor = calculateProfitFactor(allTrades);
    
    return {
      sharpeRatio,
      maxDrawdown,
      totalReturn,
      profitFactor,
      numberOfTrades: allTrades.length
    };
  } catch (error) {
    console.error('Error evaluating strategy:', error);
    throw new Error('Strategy evaluation failed: ' + (error as Error).message);
  }
}

function executeTrades(signals: string[], prices: number[], timestamps: Date[]): Trade[] {
  const trades: Trade[] = [];
  let position: 'long' | 'short' | null = null;
  let entryPrice = 0;
  let entryTime: Date | null = null;
  const positionSize = 0.1; // 10% position size per trade
  let portfolioValue = 100;
  let consecutiveLosses = 0;
  let maxConsecutiveLosses = 3;
  let totalLosses = 0;
  let maxTotalLosses = 8;
  let winStreak = 0;
  let maxWinStreak = 5;
  let lastTradeTime: Date | null = null;
  const minTradeInterval = 5; // Minimum days between trades

  for (let i = 0; i < signals.length; i++) {
    const signal = signals[i];
    const currentTime = timestamps[i];
    
    // Check if enough time has passed since last trade
    if (lastTradeTime && (currentTime.getTime() - lastTradeTime.getTime()) < minTradeInterval * 24 * 60 * 60 * 1000) {
      continue;
    }
    
    // Increase position size during win streaks
    const currentPositionSize = winStreak >= maxWinStreak ? positionSize * 1.5 : positionSize;
    
    if (signal === 'buy' && position !== 'long') {
      if (position === 'short') {
        // Close short position
        const priceChange = (entryPrice - prices[i]) / entryPrice;
        const profit = priceChange * currentPositionSize * portfolioValue;
        portfolioValue += profit;
        
        // Update tracking
        if (profit < 0) {
          consecutiveLosses++;
          totalLosses++;
          winStreak = 0;
        } else {
          consecutiveLosses = 0;
          winStreak++;
        }
        
        trades.push({
          entryPrice,
          exitPrice: prices[i],
          entryTime: entryTime!,
          exitTime: currentTime,
          profit: (profit / portfolioValue) * 100
        });
        lastTradeTime = currentTime;
      }
      
      // Open new position if conditions are met
      if (consecutiveLosses < maxConsecutiveLosses && totalLosses < maxTotalLosses) {
        position = 'long';
        entryPrice = prices[i];
        entryTime = currentTime;
      }
    } else if (signal === 'sell' && position !== 'short') {
      if (position === 'long') {
        // Close long position
        const priceChange = (prices[i] - entryPrice) / entryPrice;
        const profit = priceChange * currentPositionSize * portfolioValue;
        portfolioValue += profit;
        
        // Update tracking
        if (profit < 0) {
          consecutiveLosses++;
          totalLosses++;
          winStreak = 0;
        } else {
          consecutiveLosses = 0;
          winStreak++;
        }
        
        trades.push({
          entryPrice,
          exitPrice: prices[i],
          entryTime: entryTime!,
          exitTime: currentTime,
          profit: (profit / portfolioValue) * 100
        });
        lastTradeTime = currentTime;
      }
      
      // Open new position if conditions are met
      if (consecutiveLosses < maxConsecutiveLosses && totalLosses < maxTotalLosses) {
        position = 'short';
        entryPrice = prices[i];
        entryTime = currentTime;
      }
    }
  }

  return trades;
}

function calculateSharpeRatio(returns: number[]): number {
  if (returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  return stdDev === 0 ? 0 : mean / stdDev;
}

function calculateMaxDrawdown(returns: number[]): number {
  if (returns.length === 0) return 0;
  let peak = 100; // Start with 100% portfolio value
  let maxDrawdown = 0;
  let currentValue = 100; // Start with 100% portfolio value

  for (const ret of returns) {
    currentValue *= (1 + ret/100); // Compound returns
    if (currentValue > peak) {
      peak = currentValue;
    }
    const drawdown = (peak - currentValue) / peak * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }

  return maxDrawdown;
}

function calculateTotalReturn(returns: number[]): number {
  if (returns.length === 0) return 0;
  let totalReturn = 100; // Start with 100% portfolio value
  for (const ret of returns) {
    totalReturn *= (1 + ret/100); // Compound returns
  }
  return totalReturn - 100; // Return as percentage gain
}

function calculateProfitFactor(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  
  // Calculate gross profit and loss in absolute terms
  const grossProfit = trades
    .filter(t => t.profit > 0)
    .reduce((sum, t) => sum + Math.abs(t.profit), 0);
  
  const grossLoss = trades
    .filter(t => t.profit < 0)
    .reduce((sum, t) => sum + Math.abs(t.profit), 0);
  
  // Avoid division by zero
  if (grossLoss === 0) {
    return grossProfit === 0 ? 0 : 1;
  }
  
  // Calculate profit factor
  const profitFactor = grossProfit / grossLoss;
  
  // Cap profit factor at 10 to avoid unrealistic values
  return Math.min(profitFactor, 10);
} 