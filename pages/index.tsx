import { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, Paper, Alert, Collapse } from '@mui/material';
import { signIn, signOut, useSession } from 'next-auth/react';
import sha256 from 'crypto-js/sha256';

function WalletConnectButton({ onAddress }: { onAddress: (address: string) => void }) {
  const [address, setAddress] = useState('');
  const connectWallet = async () => {
    if (
      typeof window === 'undefined' ||
      !(window as any).ethereum ||
      !(window as any).ethereum.isMetaMask
    ) {
      alert('MetaMask is not installed or not the active wallet!');
      return;
    }
    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      setAddress(accounts[0]);
      if (onAddress) onAddress(accounts[0]);
    } catch (err) {
      alert('Failed to connect wallet');
    }
  };
  return (
    <Button variant="contained" color={address ? 'success' : 'primary'} onClick={connectWallet} sx={{ mb: 2 }}>
      {address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
    </Button>
  );
}

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
  const [walletAddress, setWalletAddress] = useState('');
  const { data: session } = useSession();

  // Compute zkID if both wallet and GitHub are connected
  const user = session?.user as any;
  const githubId = user?.id || user?.email || '';
  const zkID = walletAddress && githubId ? sha256(walletAddress + githubId).toString() : '';

  // Store zkID mapping when both are available
  useEffect(() => {
    if (zkID && walletAddress) {
      fetch('/api/zkid-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zkID, walletAddress }),
      });
    }
  }, [zkID, walletAddress]);

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

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          ZKQuant Strategy Platform
        </Typography>
        {/* Wallet and GitHub connect section */}
        <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
          <Typography variant="h5" gutterBottom>Connect Your Accounts</Typography>
          <WalletConnectButton onAddress={setWalletAddress} />
          {session ? (
            <Button variant="contained" color="secondary" onClick={() => signOut()} sx={{ mb: 2, ml: 2 }}>
              Sign out GitHub ({session.user?.name || session.user?.email})
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={() => signIn('github')} sx={{ mb: 2, ml: 2 }}>
              Sign in with GitHub
            </Button>
          )}
          <Box sx={{ mt: 2 }}>
            <Typography>Wallet: {walletAddress ? walletAddress : 'Not connected'}</Typography>
            <Typography>GitHub: {session ? (session.user?.name || session.user?.email) : 'Not connected'}</Typography>
            <Typography sx={{ fontWeight: 'bold' }}>zkID: {zkID ? zkID : 'Connect both to generate zkID'}</Typography>
          </Box>
        </Paper>
        
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
