import { useState } from 'react';
import { Box, Container, Typography, TextField, Button, Paper, Alert, Collapse } from '@mui/material';

export default function Home() {
  const [strategyCode, setStrategyCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    metrics: {
      sharpeRatio: number;
      maxDrawdown: number;
      totalReturn: number;
      profitFactor: number;
      numberOfTrades: number;
    };
    passed: boolean;
    masterModel?: {
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
    duplicate?: boolean;
  } | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    setDuplicateWarning(false);
    try {
      const response = await fetch('/api/submit-strategy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: strategyCode }),
      });
      const data = await response.json();
      setResult(data);
      if (data.duplicate) {
        setDuplicateWarning(true);
      }
    } catch (error) {
      console.error('Error submitting strategy:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    setIsSubmitting(true);
    setDuplicateWarning(false);
    try {
      const response = await fetch('/api/submit-strategy', {
        method: 'DELETE',
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error clearing strategies:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMetric = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(2);
  };

  // Check if the current code already exists in the master model
  const isDuplicate = !!result?.masterModel?.strategies.some(s => s.code === strategyCode);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          ZKQuant Strategy Platform
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Submit Your Trading Strategy
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            Write your trading strategy in JavaScript. The strategy should return 'buy' or 'sell' signals based on the provided price data.
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              multiline
              rows={15}
              variant="outlined"
              label="Strategy Code"
              value={strategyCode}
              onChange={(e) => setStrategyCode(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting || isDuplicate}
              fullWidth
            >
              {isSubmitting ? 'Evaluating Strategy...' : 'Evaluate Strategy'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleClear}
              disabled={isSubmitting}
              fullWidth
              sx={{ mt: 1 }}
            >
              Clear All Strategies
            </Button>
          </form>

          {duplicateWarning && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This strategy already exists in the master model and cannot be added again.
            </Alert>
          )}

          <Collapse in={result !== null}>
            <Box sx={{ mt: 3 }}>
              <Alert severity={result?.passed ? "success" : "error"} sx={{ mb: 2 }}>
                {result?.passed 
                  ? "Strategy passed all criteria!" 
                  : "Strategy did not meet all criteria"}
              </Alert>
              {result && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Evaluation Results</Typography>
                  <Typography>Sharpe Ratio: {formatMetric(result.metrics.sharpeRatio)}</Typography>
                  <Typography>Max Drawdown: {formatMetric(result.metrics.maxDrawdown)}%</Typography>
                  <Typography>Total Return: {formatMetric(result.metrics.totalReturn)}%</Typography>
                  <Typography>Profit Factor: {formatMetric(result.metrics.profitFactor)}</Typography>
                  <Typography>Number of Trades: {result.metrics.numberOfTrades || 0}</Typography>
                </Paper>
              )}
              {/* Master Model State Display */}
              {result?.masterModel && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Master Quant Model State</Typography>
                  <Typography variant="subtitle1" gutterBottom>Scores:</Typography>
                  <Typography>Low Risk: {formatMetric(result.masterModel.scores.low)}</Typography>
                  <Typography>Medium Risk: {formatMetric(result.masterModel.scores.medium)}</Typography>
                  <Typography>High Risk: {formatMetric(result.masterModel.scores.high)}</Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>Strategies:</Typography>
                    {result.masterModel.strategies.length === 0 && (
                      <Typography color="text.secondary">No strategies in master model yet.</Typography>
                    )}
                    {result.masterModel.strategies.map((strat, idx) => (
                      <Paper key={idx} variant="outlined" sx={{ p: 1, mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Strategy #{idx + 1}</Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}><b>Code:</b> {strat.code.slice(0, 100)}{strat.code.length > 100 ? '...' : ''}</Typography>
                        <Typography variant="body2"><b>Sharpe Ratio:</b> {formatMetric(strat.metrics.sharpeRatio)}</Typography>
                        <Typography variant="body2"><b>Max Drawdown:</b> {formatMetric(strat.metrics.maxDrawdown)}%</Typography>
                        <Typography variant="body2"><b>Total Return:</b> {formatMetric(strat.metrics.totalReturn)}%</Typography>
                        <Typography variant="body2"><b>Profit Factor:</b> {formatMetric(strat.metrics.profitFactor)}</Typography>
                        <Typography variant="body2"><b>Number of Trades:</b> {strat.metrics.numberOfTrades}</Typography>
                        <Typography variant="body2"><b>Weights:</b> Low: {formatMetric(strat.weights.low)}, Medium: {formatMetric(strat.weights.medium)}, High: {formatMetric(strat.weights.high)}</Typography>
                      </Paper>
                    ))}
                  </Box>
                </Paper>
              )}
            </Box>
          </Collapse>
        </Paper>
      </Box>
    </Container>
  );
}
