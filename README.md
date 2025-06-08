# zkQuant

zkQuant is a decentralized platform designed to build the largest open quant model in the world. It allows data scientists and quant strategists to contribute trading algorithms anonymously and securely using zero-knowledge identity (zkID) and Trusted Execution Environments (TEE). By aggregating, evaluating, and weighting thousands of strategies, zkQuant forms a master model that dynamically adapts to market conditions.

The platform uses the XRP Ledger to store verifiable metadata such as strategy hashes, contributor zkIDs, performance summaries, and version checkpoints. This ensures transparency, immutability, and a fair contribution record for each participant. Rather than relying on reputation or social trust, zkQuant distributes rewards based on real strategy performance and contribution weights, verified on-chain.

This system solves key issues in collaborative quant research:
-Privacy for contributors
-Security for code and identity
-Fairness in attribution and rewards
-Transparency in strategy evolution

zkQuant is not just a platform—it's an open-source ecosystem for building the future of decentralized quant finance, with trust-minimized contribution, on-chain accountability, and cross-border reward distribution at its core.

---

## Table of Contents
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [How We Use the XRPL](#how-we-use-the-xrpl)
- [Smart Contract](#smart-contract)
- [Strategy Evaluation](#strategy-evaluation)
- [Master Quant Model](#master-quant-model)
- [Setup & Development](#setup--development)
- [Deployment](#deployment)
- [Customization](#customization)
- [UI Screenshots](#ui-screenshots)
- [Demo Video](#demo-video)
- [License](#license)
- [Links & Resources](#links--resources)

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

## How We Use the XRPL:
-**On-Chain Metadata Storage**
We store core quant strategy metadata—such as model metrics, timestamps, and zkID associations—directly on XRPL for auditability and traceability.

-**EVM Sidechain Smart Contracts**
Our core logic is deployed on the XRPL EVM sidechain, enabling compatibility with Solidity-based tooling and Ethereum-style smart contracts.

-**zkID Binding to Wallets**
We utilize wallet addresses on XRPL to anchor zkID-based identities, ensuring pseudonymous yet verifiable strategy submissions.

-**Reward Distribution (Cross-Chain)**
Future enhancements will use XRPL’s cross-chain features to distribute rewards across chains while maintaining transparency.

-**Low-Cost, High-Speed Settlement**
XRPL's fast and affordable transaction layer ensures efficient updates and claims, even at scale.

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

### Live App

You can also try the deployed version here: [zkquant.vercel.app](https://zkquant.vercel.app)

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

<img width="1470" alt="Screenshot 2025-06-08 at 6 45 14 AM" src="https://github.com/user-attachments/assets/0e0ab9f4-dc31-4542-8f05-6630a240d00f" /><img width="1470" alt="Screenshot 2025-06-08 at 6 46 12 AM" src="https://github.com/user-attachments/assets/5e5f5435-e04d-453e-a3dc-bc6e933c5cb6" /><img width="1470" alt="Screenshot 2025-06-08 at 6 47 01 AM" src="https://github.com/user-attachments/assets/c9b43ef2-9db8-4666-a2a3-f763389b27a2" /><img width="1470" alt="Screenshot 2025-06-08 at 6 47 38 AM" src="https://github.com/user-attachments/assets/7de698be-13d8-4e0c-9055-bb21caee6fc5" /><img width="1470" alt="Screenshot 2025-06-08 at 6 47 50 AM" src="https://github.com/user-attachments/assets/27cc871b-93af-4335-aef1-8b9df6ca22c1" /><img width="1470" alt="Screenshot 2025-06-08 at 6 48 35 AM" src="https://github.com/user-attachments/assets/3da05217-917c-468c-918a-76c20766a600" />


**UI Walkthrough Video:**


https://github.com/user-attachments/assets/052d883a-998b-432b-a780-2533c7e0e1fc



---

## Demo Video
https://www.loom.com/share/ca8a472d30b64ba6bd335dd7dd0616b6?sid=0e1ee759-1088-40e0-801f-272751cd3463


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

---

## Links & Resources

- **Block Explorer:** [View Contract on XRPL EVM Sidechain](https://explorer.testnet.xrplevm.org/address/0xa54bE14213da914D9Ae698F32184FA0eFe34183A?tab=index)
- **Live App:** [zkquant.vercel.app](https://zkquant.vercel.app)
- **Presentation Slide:** [Canva Presentation](https://www.canva.com/design/DAGptVw07QM/J9dpzocNzpV4zud1vdvsvA/edit?utm_content=DAGptVw07QM&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)
- **Twitter:** https://x.com/mun336699/status/1931538383341576211?s=46
