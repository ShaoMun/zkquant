# zkQuant

zkQuant is building the largest decentralized quant model by enabling strategy contributors to collaborate securely and contribute verifiable strategies through zkID and TEE.

---

## Table of Contents
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Smart Contract](#smart-contract)
- [Strategy Evaluation](#strategy-evaluation)
- [Master Quant Model](#master-quant-model)
- [Setup & Development](#setup--development)
- [Deployment](#deployment)
- [Customization](#customization)
- [UI Screenshots](#ui-screenshots)
- [Demo Video](#demo-video)
- [License](#license)

---

## Features
- **TEE-backed confidential strategy evaluation**
- **zkID**: Privacy-preserving user identity (GitHub + wallet)
- **On-chain, immutable strategy metadata** (XRP Ledger EVM Sidechain)
- **Modern, animated UI** (Next.js, MUI)
- **MetaMask & GitHub OAuth integration**
- **Master quant model**: Aggregates and scores strategies by risk

---

## Architecture Overview

1. **Frontend**: Users connect their GitHub and wallet, submit strategies, and view results.
2. **TEE**: Strategies are evaluated in a Trusted Execution Environment for privacy and integrity. The TEE produces cryptographic attestations of the evaluation.
3. **Backend/API**: Handles strategy evaluation, zkID mapping, and master model state.
4. **Smart Contract**: Stores strategy metadata and master model metrics on the XRPL EVM Sidechain.

---

## Tech Stack
- **Frontend**: Next.js, React, TypeScript, Material UI, Tailwind CSS (optional)
- **Blockchain**: Solidity, Hardhat, ethers.js, XRPL EVM Sidechain
- **Authentication**: NextAuth.js (GitHub OAuth), MetaMask
- **TEE**: (Conceptual) for secure, private strategy evaluation and attestation
- **Backend/Utils**: Node.js, custom evaluation and model logic
- **Containerization**: Docker (for reproducible builds and deployment)
- **Deployment**: Vercel

---

## How It Works

1. **Connect Accounts**:  Users must connect both their GitHub and MetaMask wallet.
2. **zkID Generation**:  A zkID is created by hashing the wallet address and GitHub identity, providing privacy-preserving, cross-platform identity.
3. **Strategy Submission**:  Users submit JavaScript trading strategies via the UI.
4. **TEE Evaluation**:  The strategy is evaluated in a TEE, ensuring code privacy and trustworthy results. The TEE produces a cryptographic attestation of the evaluation. Only metrics (not code) are revealed.
5. **On-Chain Submission**:  If the strategy passes, its metadata (hash, zkID, metrics, TEE attestation) is submitted to the `MasterModelMetadata` contract on the XRPL EVM Sidechain.
6. **Master Model Aggregation**:  All strategies are aggregated and scored by risk level in the master quant model.

---

## Smart Contract

**File:** `contracts/MasterModelMetadata.sol`

- Stores submitted strategies (by hash/ID, zkID, metrics, timestamp, weight)
- Emits events for new submissions and model updates
- Aggregates master model metrics for different risk levels
- Provides view functions for all strategy IDs and master model state

**Deployment:**  
Deploy using Hardhat and the provided `scripts/deploy.js` script.

---

## Strategy Evaluation

**File:** `utils/strategyEvaluator.ts`

- Accepts user-submitted JavaScript strategy code
- Runs the code on multiple synthetic datasets
- Calculates key metrics: Sharpe ratio, max drawdown, total return, profit factor, number of trades
- Requires a minimum number of trades for validity
- (Conceptually) runs inside a TEE for privacy and attestation
- TEE produces a cryptographic proof that can be submitted on-chain

---

## Master Quant Model

**File:** `utils/masterQuantModel.ts`

- Aggregates all valid strategies and their metrics
- Assigns weights for each risk level (low, medium, high) based on normalized metrics
- Computes overall scores for each risk level
- Persists state to disk for API access

---

## Setup & Development

### Prerequisites
- Node.js (18+ recommended)
- npm, yarn, or pnpm
- MetaMask (browser extension)
- GitHub account
- Docker (for containerized builds)

### Install Dependencies
```bash
npm install
# or
yarn install
```

### Run Locally
```bash
npm run dev
# or
yarn dev
```
Visit [http://localhost:3000](http://localhost:3000).

### Build Contracts
```bash
npx hardhat compile
```

### Deploy Contract (XRPL EVM Sidechain)
```bash
npx hardhat run scripts/deploy.js --network <your_network>
```

### Docker Usage
Build and run the app in a container:
```bash
docker build -t zkquant .
docker run -p 3000:3000 zkquant
```

---

## Deployment
- The app is designed for deployment on [Vercel](https://vercel.com/).
- The contract ABI is inlined in the frontend for compatibility with serverless deployments.
- Docker can be used for local or on-premise deployments.

---

## Customization
- **Contract Address:**  Update the contract address in `pages/index.tsx` if you redeploy.
- **Evaluation Logic:**  Modify `utils/strategyEvaluator.ts` for custom metrics or datasets.
- **Master Model Logic:**  Adjust scoring/weighting in `utils/masterQuantModel.ts`.
- **Styling:**  Edit `styles/globals.css` or use MUI theme overrides in `_app.tsx`.

---

## UI Screenshots

> _Below are placeholders. Replace with your actual screenshots and video links._

| ![Screenshot 1](screenshots/ui1.png) | ![Screenshot 2](screenshots/ui2.png) | ![Screenshot 3](screenshots/ui3.png) |
|:---:|:---:|:---:|
| ![Screenshot 4](screenshots/ui4.png) | ![Screenshot 5](screenshots/ui5.png) | ![Screenshot 6](screenshots/ui6.png) |

**UI Walkthrough Video:**

[![UI Walkthrough](screenshots/ui-walkthrough.png)](https://your-video-link.com)

---

## Demo Video

[![Demo Video](screenshots/demo-video.png)](https://your-demo-video-link.com)

---

## License
MIT

---

## Acknowledgements
- [Next.js](https://nextjs.org/)
- [Material UI](https://mui.com/)
- [ethers.js](https://docs.ethers.org/)
- [XRPL EVM Sidechain](https://evm-sidechain.xrpl.org/)
- [Hardhat](https://hardhat.org/)
- [Trusted Execution Environments (TEE)](https://en.wikipedia.org/wiki/Trusted_execution_environment)
- [Docker](https://www.docker.com/)
