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
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    
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
    } catch (error) {
      console.error('Error submitting strategy:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMetric = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(2);
  };

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
              disabled={isSubmitting}
              fullWidth
            >
              {isSubmitting ? 'Evaluating Strategy...' : 'Evaluate Strategy'}
            </Button>
          </form>

          <Collapse in={result !== null}>
            <Box sx={{ mt: 3 }}>
              <Alert severity={result?.passed ? "success" : "error"} sx={{ mb: 2 }}>
                {result?.passed 
                  ? "Strategy passed all criteria!" 
                  : "Strategy did not meet all criteria"}
              </Alert>
              
              {result && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Evaluation Results</Typography>
                  <Typography>Sharpe Ratio: {formatMetric(result.metrics.sharpeRatio)}</Typography>
                  <Typography>Max Drawdown: {formatMetric(result.metrics.maxDrawdown)}%</Typography>
                  <Typography>Total Return: {formatMetric(result.metrics.totalReturn)}%</Typography>
                  <Typography>Profit Factor: {formatMetric(result.metrics.profitFactor)}</Typography>
                  <Typography>Number of Trades: {result.metrics.numberOfTrades || 0}</Typography>
                </Paper>
              )}
            </Box>
          </Collapse>
        </Paper>
      </Box>
    </Container>
  );
}
