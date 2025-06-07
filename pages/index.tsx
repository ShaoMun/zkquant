import { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, Paper, Alert, Collapse, Stepper, Step, StepLabel, Fade, Slide, Tooltip } from '@mui/material';
import { signIn, signOut, useSession } from 'next-auth/react';
import sha256 from 'crypto-js/sha256';
import { ethers } from 'ethers';
import contractAbi from '../artifacts/contracts/MasterModelMetadata.sol/MasterModelMetadata.json';

function WalletConnectButton({ address, onAddress }: { address: string; onAddress: (address: string) => void }) {
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

  // Add state for tx hash and error
  const [txHash, setTxHash] = useState<string | null>(null);
  const [onchainError, setOnchainError] = useState<string | null>(null);

  // Stepper logic
  const isWalletConnected = !!walletAddress;
  const isGithubConnected = !!session;
  const allConnected = isWalletConnected && isGithubConnected;
  const steps = ['Connect Wallet', 'Connect GitHub', 'Submit Strategy'];
  const activeStep = isWalletConnected ? (isGithubConnected ? 2 : 1) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);
    setTxHash(null);
    setOnchainError(null);
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
      if (data.passed) {
        // Prepare onchain data
        const strategyId = ethers.keccak256(ethers.toUtf8Bytes(strategyCode));
        const zkIDHex = '0x' + zkID; // zkID is already a sha256 hex string
        const metrics = data.metrics;
        // Convert metrics to uint16 (rounded)
        const sharpeRatio = Math.round(metrics.sharpeRatio * 100);
        const maxDrawdown = Math.round(metrics.maxDrawdown * 100);
        const totalReturn = Math.round(metrics.totalReturn * 100);
        const profitFactor = Math.round(metrics.profitFactor * 100);
        const weight = 0; // Default to 0, can be updated later
        // Connect to MetaMask
        if (!(window as any).ethereum) throw new Error('MetaMask not found');
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          '0xa54bE14213da914D9Ae698F32184FA0eFe34183A',
          contractAbi.abi,
          signer
        );
        // Send transaction
        const tx = await contract.submitStrategy(
          strategyId,
          zkIDHex,
          sharpeRatio,
          maxDrawdown,
          totalReturn,
          profitFactor,
          weight
        );
        setTxHash(tx.hash);
        await tx.wait();
      }
    } catch (error: any) {
      setOnchainError(error.message || 'On-chain submission failed');
      console.error('On-chain error:', error);
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
    <Container maxWidth="md" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box sx={{ width: '100%', py: 6 }}>
        <Fade in timeout={800}>
          <Typography
            variant="h1"
            component="h1"
            gutterBottom
            align="center"
            sx={{
              fontWeight: 900,
              letterSpacing: 8,
              color: 'transparent',
              background: 'linear-gradient(90deg, #6dd5ed 0%, #8f6ed5 40%, #e66465 100%)',
              backgroundSize: '200% auto',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Geist, Arial, Helvetica, sans-serif',
              textShadow: '0 4px 32px #8f6ed580, 0 1px 0 #fff2',
              mb: 2,
              fontSize: { xs: '2.8rem', sm: '4rem', md: '5rem' },
              animation: 'shimmer 2.5s linear infinite',
              '@keyframes shimmer': {
                to: {
                  backgroundPosition: '200% center'
                }
              }
            }}
          >
            zkQuant
          </Typography>
        </Fade>
        <Slide in direction="down" timeout={700}>
          <Paper elevation={6} sx={{ p: 4, mt: 4, mb: 4, bgcolor: 'background.paper', border: '1px solid #222', boxShadow: '0 4px 32px #0008', transition: 'box-shadow 0.3s' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>Get Started</Typography>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
              {steps.map((label, idx) => (
                <Step key={label} completed={idx < activeStep}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center', justifyContent: 'center', mb: 2, mt: 2 }}>
              <Tooltip title={isGithubConnected ? 'GitHub connected' : 'Sign in with GitHub'} arrow>
                <span>
                  {session ? (
                    <Button variant="contained" color="secondary" onClick={() => signOut()} sx={{ minWidth: 180, fontWeight: 500 }}>
                      Sign out GitHub ({session.user?.name || session.user?.email})
                    </Button>
                  ) : (
                    <Button variant="contained" color="primary" onClick={() => signIn('github')} sx={{ minWidth: 180, fontWeight: 500 }}>
                      Sign in with GitHub
                    </Button>
                  )}
                </span>
              </Tooltip>
              <Tooltip title={isWalletConnected ? 'Wallet connected' : 'Connect your MetaMask wallet'} arrow>
                <span>
                  <Box sx={{ mt: { xs: 1, sm: 0 } }}>
                    <WalletConnectButton address={walletAddress} onAddress={setWalletAddress} />
                  </Box>
                </span>
              </Tooltip>
            </Box>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 'bold', color: zkID ? 'success.main' : 'text.secondary', mt: 1 }}>zkID: {zkID ? zkID : 'Connect both to generate zkID'}</Typography>
            </Box>
            {!allConnected && (
              <Alert severity="info" sx={{ mt: 3, fontWeight: 500, bgcolor: '#222', color: 'text.primary', border: '1px solid #444' }}>
                Please connect both your wallet and GitHub to continue.
              </Alert>
            )}
          </Paper>
        </Slide>
        {/* Strategy Form - only show if both connected */}
        <Fade in={allConnected} timeout={600}>
          <Box>
            {allConnected && (
              <Paper elevation={6} sx={{ p: 4, mt: 2, bgcolor: 'background.paper', border: '1px solid #222', boxShadow: '0 4px 32px #0008', transition: 'box-shadow 0.3s' }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Submit Your Trading Strategy
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Paste your JavaScript trading strategy below. Your code should return <b>"buy"</b> or <b>"sell"</b> signals based on the price data input. 
                </Typography>
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    multiline
                    rows={12}
                    variant="outlined"
                    label="Strategy Code"
                    value={strategyCode}
                    onChange={(e) => setStrategyCode(e.target.value)}
                    sx={{ mb: 2, bgcolor: '#111', borderRadius: 2, '& .MuiInputBase-root': { color: 'text.primary', fontFamily: 'monospace' } }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                    fullWidth
                    sx={{ fontWeight: 600, py: 1.5, fontSize: 18, letterSpacing: 1, transition: 'background 0.2s' }}
                  >
                    {isSubmitting ? 'Evaluating Strategy...' : 'Evaluate Strategy'}
                  </Button>
                </form>
                <Collapse in={result !== null}>
                  <Box sx={{ mt: 3 }}>
                    <Fade in={!!result} timeout={500}>
                      <Alert severity={result?.passed ? "success" : "error"} sx={{ mb: 2, fontWeight: 500, bgcolor: result?.passed ? '#1b5e20' : '#222', color: 'text.primary', border: '1px solid #444' }}>
                        {result?.passed 
                          ? "Your strategy passed all evaluation criteria!"
                          : "Your strategy did not meet the required criteria."}
                      </Alert>
                    </Fade>
                    {result && (
                      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#111', border: '1px solid #333' }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>Evaluation Results</Typography>
                        <Typography>Sharpe Ratio: {formatMetric(result.metrics.sharpeRatio)}</Typography>
                        <Typography>Max Drawdown: {formatMetric(result.metrics.maxDrawdown)}%</Typography>
                        <Typography>Total Return: {formatMetric(result.metrics.totalReturn)}%</Typography>
                        <Typography>Profit Factor: {formatMetric(result.metrics.profitFactor)}</Typography>
                        <Typography>Number of Trades: {result.metrics.numberOfTrades || 0}</Typography>
                      </Paper>
                    )}
                    {result?.masterModel && (
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#111', border: '1px solid #333' }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>Master Quant Model Overview</Typography>
                        <Typography variant="subtitle1" gutterBottom>Scores:</Typography>
                        <Typography>Low Risk: {formatMetric(result.masterModel.scores.low)}</Typography>
                        <Typography>Medium Risk: {formatMetric(result.masterModel.scores.medium)}</Typography>
                        <Typography>High Risk: {formatMetric(result.masterModel.scores.high)}</Typography>
                        <Typography sx={{ mt: 2 }}>Total Strategies: {result.masterModel.strategies.length}</Typography>
                      </Paper>
                    )}
                    {txHash && (
                      <Alert severity="info" sx={{ mt: 2, fontWeight: 500, bgcolor: '#222', color: 'text.primary', border: '1px solid #444' }}>
                        Strategy metadata submitted on-chain! Tx Hash: <a href={`https://explorer.testnet.xrplevm.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#90caf9' }}>{txHash}</a>
                      </Alert>
                    )}
                    {onchainError && (
                      <Alert severity="error" sx={{ mt: 2, fontWeight: 500, bgcolor: '#222', color: 'text.primary', border: '1px solid #444' }}>
                        {onchainError}
                      </Alert>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            )}
          </Box>
        </Fade>
      </Box>
    </Container>
  );
}
