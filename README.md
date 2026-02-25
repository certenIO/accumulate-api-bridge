# Certen API Bridge

HTTP API service that provides Accumulate network integration and multi-chain abstract account management for the Certen Protocol web application. Supports ADI management, cross-chain transaction intents, two-phase signing with Key Vault, and sponsored account deployment across 13 blockchain networks.

## Overview

The Certen API Bridge is an Express.js service that exposes REST endpoints for interacting with the Accumulate blockchain and managing Certen Abstract Accounts across multiple target chains. It handles ADI (Accumulate Digital Identifier) lifecycle management, key book/page operations, credit management, transaction intent creation, and cross-chain account deployment. The service supports both direct signing (using server-side keys) and two-phase signing (with Key Vault browser extension).

Key capabilities:

1. **ADI Management**: Create, verify, and query Accumulate Digital Identifiers
2. **Key Infrastructure**: Create key books and key pages with configurable thresholds
3. **Credit Management**: Add credits to key pages for transaction fees
4. **Transaction Intents**: Create cryptographically-signed cross-chain intents
5. **Two-Phase Signing**: Prepare/submit pattern for external Key Vault signing
6. **Authority Management**: Update account authorities with multi-sig support
7. **Multi-Chain Account Deployment**: Deploy and manage Certen Abstract Accounts on 13 target chains
8. **Sponsored Deployment**: Gas-sponsored account creation on non-EVM chains (NEAR, TON)

## Architecture

```
+------------------------------------------------------------------+
|                       Certen API Bridge                           |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------+    +------------------+    +---------------+ |
|  |   Express.js     |    |   Accumulate     |    |    Intent     | |
|  |   REST API       |--->|   Service        |--->|    Service    | |
|  +------------------+    +------------------+    +---------------+ |
|          |                       |                      |         |
|          v                       v                      v         |
|  +------------------+    +------------------+    +---------------+ |
|  |   ADI Storage    |    |   Chain Handler  |    |  4-Blob       | |
|  |   (JSON File)    |    |   Registry       |    |  Protocol     | |
|  +------------------+    +------------------+    +---------------+ |
|                                  |                                |
|                    +-------------+-------------+                  |
|                    v             v             v                  |
|              +----------+ +----------+ +----------+              |
|              |   EVM    | | Non-EVM  | |   TON    |              |
|              | Handlers | | Handlers | | Handler  |              |
|              +----------+ +----------+ +----------+              |
|                                                                   |
+------------------------------------------------------------------+
                                  |
                                  v
+------------------------------------------------------------------+
|                      External Services                            |
+------------------------------------------------------------------+
|  - Accumulate Network (v2/v3 API)                                 |
|  - EVM Chains (Ethereum, Arbitrum, Optimism, Base, BSC,           |
|    Polygon, Moonbeam — all testnets)                              |
|  - Non-EVM Chains (Solana, Aptos, Sui, NEAR, TON, TRON)          |
|  - Key Vault Browser Extension                                    |
|  - Certen Proofs Service                                          |
+------------------------------------------------------------------+
```

## Features

- **RESTful API**: Clean HTTP endpoints for all Accumulate and chain operations
- **Two-Phase Signing**: Prepare transaction hash, sign externally, submit
- **ADI Registry**: Automatic detection and storage of ADI credentials
- **Retry Logic**: Built-in retry with exponential backoff for network operations
- **CORS Support**: Configurable origins for web application integration
- **Intent Protocol**: 4-blob data structure for cross-chain intents
- **Multi-Leg Intents**: Support for complex multi-destination transfers
- **13-Chain Support**: Unified chain handler interface for EVM and non-EVM blockchains
- **Sponsored Deployment**: Gas-free account deployment on NEAR and TON via sponsor wallets
- **Deterministic Addresses**: Predict abstract account addresses before deployment (CREATE2 / StateInit)

## Supported Target Chains

The API Bridge manages Certen Abstract Accounts across 13 blockchain networks through a unified `ChainHandler` interface:

### EVM Chains (7 testnets)

| Chain | Chain ID | Network | Explorer |
|-------|----------|---------|----------|
| Ethereum Sepolia | `sepolia` | 11155111 | etherscan.io |
| Arbitrum Sepolia | `arbitrum-sepolia` | 421614 | arbiscan.io |
| Base Sepolia | `base-sepolia` | 84532 | base.org |
| BSC Testnet | `bsc-testnet` | 97 | bscscan.com |
| Optimism Sepolia | `optimism-sepolia` | 11155420 | etherscan.io |
| Polygon Amoy | `polygon-amoy` | 80002 | polygonscan.com |
| Moonbase Alpha | `moonbase-alpha` | 1287 | moonscan.io |

### Non-EVM Chains (6 testnets)

| Chain | Chain ID | Runtime | Explorer |
|-------|----------|---------|----------|
| Solana Devnet | `solana-devnet` | Anchor/Rust | solscan.io |
| Aptos Testnet | `aptos-testnet` | Move | aptoslabs.com |
| Sui Testnet | `sui-testnet` | Move | suiscan.xyz |
| NEAR Testnet | `near-testnet` | Rust/WASM | nearblocks.io |
| TRON Shasta | `tron-testnet` | Solidity/TVM | tronscan.org |
| TON Testnet | `ton-testnet` | Tact/FunC | tonscan.org |

Each chain handler implements: `getAccountAddress`, `deployAccount`, `getAddressBalance`, and `getSponsorStatus`.

## Prerequisites

- Node.js 18+
- Accumulate TypeScript SDK
- Access to Accumulate network (Kermit Testnet or DevNet)

## Quick Start

```bash
# Clone repository
git clone https://github.com/certenIO/api-bridge.git
cd api-bridge

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your configuration

# Build
npm run build

# Start service
npm start
```

The API will be available at `http://localhost:8085`.

## Installation

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Docker

```bash
# Build image
docker build -t certen/api-bridge .

# Run container
docker run -d \
  --name certen-api-bridge \
  -p 8085:8085 \
  -v ./data:/app/data \
  --env-file .env \
  certen/api-bridge
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 8085 | API server port |
| `CORS_ORIGINS` | No | localhost | Comma-separated allowed origins |
| `ACCUM_ENDPOINT` | Yes | - | Accumulate v3 API endpoint |
| `ACCUM_ENDPOINT_V2` | No | - | Accumulate v2 API endpoint |
| `ACCUM_PUBLIC_KEY` | Yes | - | Lite identity public key (hex) |
| `ACCUM_PRIV_KEY` | Yes | - | Lite identity private key (hex) |
| `ACCUM_PUBLIC_KEY_HASH` | Yes | - | Public key hash (hex) |
| `ACCUM_LTA` | Yes | - | Lite Token Account URL |
| `ACCUM_LID` | Yes | - | Lite Identity URL |
| `ETHEREUM_URL` | No | - | Ethereum RPC endpoint |
| `ETH_CHAIN_ID` | No | 11155111 | Ethereum chain ID (Sepolia) |
| `ETH_PRIVATE_KEY` | No | - | Ethereum wallet private key |
| `ETH_ACCOUNT_ADDRESS` | No | - | Ethereum wallet address |
| `ANCHOR_CONTRACT_ADDRESS` | No | - | CertenAnchor contract address |
| `ACCOUNT_ABSTRACTION_ADDRESS` | No | - | ERC-4337 account address |
| `PROOF_SERVICE_URL` | No | localhost:8082 | Proofs service endpoint |
| `DATA_DIR` | No | ./data | ADI storage directory |
| `LOG_LEVEL` | No | debug | Logging verbosity |
| `DEBUG_TRANSACTIONS` | No | false | Enable transaction logging |
| `INFURA_API_KEY` | No | - | Infura API key for EVM chain RPCs |
| `NEAR_SPONSORED_DEPLOYMENT_ENABLED` | No | false | Enable sponsored NEAR deployment |
| `NEAR_FACTORY_ACCOUNT` | No | - | NEAR factory contract ID |
| `NEAR_SPONSOR_ACCOUNT_ID` | No | - | NEAR sponsor account ID |
| `NEAR_SPONSOR_PRIVATE_KEY` | No | - | NEAR sponsor Ed25519 private key |
| `TON_SPONSORED_DEPLOYMENT_ENABLED` | No | false | Enable sponsored TON deployment |
| `TON_FACTORY_ADDRESS` | No | - | TON factory contract address |
| `TON_TESTNET_API_KEY` | No | - | TON Center API key (avoids rate limits) |
| `TON_SPONSOR_MNEMONIC` | No | - | TON sponsor wallet 24-word mnemonic |

### Network Endpoints

| Network | v3 Endpoint | v2 Endpoint |
|---------|-------------|-------------|
| Kermit Testnet | `http://206.191.154.164/v3` | `http://206.191.154.164/v2` |
| DevNet | `http://localhost:26660/v3` | `http://localhost:26660/v2` |
| Mainnet | `https://mainnet.accumulatenetwork.io/v3` | `https://mainnet.accumulatenetwork.io/v2` |

## Project Structure

```
api-bridge/
├── src/
│   ├── index.ts                  # Entry point
│   ├── server.ts                 # Express server and routes
│   ├── AccumulateService.ts      # Accumulate SDK wrapper
│   ├── AdiStorageService.ts      # ADI persistence
│   ├── CertenIntentService.ts    # Intent creation
│   ├── Logger.ts                 # Winston logger
│   └── chains/                   # Multi-chain handler system
│       ├── index.ts              # Barrel exports
│       ├── registry.ts           # Chain handler registration
│       ├── types.ts              # ChainHandler interface
│       ├── utils.ts              # Address derivation (owner bytes, salt)
│       ├── validator-addresses.ts # Validator wallet addresses per chain
│       ├── evm.handler.ts        # EVM chains (7 networks)
│       ├── solana.handler.ts     # Solana Devnet
│       ├── aptos.handler.ts      # Aptos Testnet
│       ├── sui.handler.ts        # Sui Testnet
│       ├── near.handler.ts       # NEAR Testnet
│       ├── tron.handler.ts       # TRON Shasta
│       └── ton.handler.ts        # TON Testnet
├── data/
│   └── adis.json                 # Stored ADI data
├── .env.example                  # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## API Reference

### Health and Configuration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/config` | GET | Current service configuration |

### ADI Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/adi/create` | POST | Create new ADI |
| `/api/v1/adi/:url/verify` | GET | Verify ADI exists (with retry) |
| `/api/v1/adi/:url/governance` | GET | Get governance structure |
| `/api/v1/adis` | GET | List all stored ADIs |
| `/api/v1/adis` | POST | Store ADI data |
| `/api/v1/adis/:url` | GET | Get specific ADI |
| `/api/v1/adis/:url` | DELETE | Delete ADI |

### Key Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/keybook/create` | POST | Create key book |
| `/api/v1/keybook/create/prepare` | POST | Prepare key book (two-phase) |
| `/api/v1/keybook/create/submit-signed` | POST | Submit signed key book |
| `/api/v1/keypage/create` | POST | Create key page |
| `/api/v1/keypage/create/prepare` | POST | Prepare key page (two-phase) |
| `/api/v1/keypage/create/submit-signed` | POST | Submit signed key page |
| `/api/v1/keypage/:url/verify` | GET | Verify key page exists |

### Credit Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/credits/add` | POST | Add credits to key page |
| `/api/v1/credits/purchase-deployment` | POST | Purchase 100,000 credits |

### Account Operations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/account/:url` | GET | Get account information |
| `/api/v1/account/:url/balance` | GET | Get account balance |
| `/api/v1/account/authorities` | GET | Get account authorities |
| `/api/v1/account/authorities/prepare` | POST | Prepare authority update |
| `/api/v1/account/authorities/submit-signed` | POST | Submit signed authority update |

### Data Accounts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/data-account/create` | POST | Create data account |
| `/api/v1/deployment/complete` | POST | Create ADI + data account + credits |
| `/api/v1/deployment/data-account` | POST | Create deployment data account |

### Transaction Intents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/intent/create` | POST | Create transaction intent |
| `/api/v1/intent/prepare` | POST | Prepare intent (two-phase) |
| `/api/v1/intent/submit-signed` | POST | Submit signed intent |
| `/api/v1/intent/multi-leg/create` | POST | Create multi-leg intent |
| `/api/v1/intent/multi-leg/prepare` | POST | Prepare multi-leg (two-phase) |

### Chain Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/chain/account-address` | GET | Predict abstract account address on target chain |
| `/api/v1/chain/deploy-account` | POST | Deploy Certen Abstract Account (sponsored) |
| `/api/v1/chain/wallet-balance` | GET | Get native token balance on any chain |
| `/api/v1/chain/sponsor-status` | GET | Check sponsor wallet status across all chains |
| `/api/v1/chain/validator-balances` | GET | Get validator node balances on non-EVM chains |
| `/api/v1/chain/verify-address` | POST | Verify address ownership on target chain |

### Network Information

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/network/status` | GET | Get network status |
| `/api/v1/oracle/price` | GET | Get ACME oracle price |
| `/api/v1/query` | POST | Query transaction status |

## Two-Phase Signing

The API supports two-phase signing for integration with the Key Vault browser extension:

### Phase 1: Prepare

```typescript
// Request
POST /api/v1/intent/prepare
{
  "intent": {
    "id": "uuid",
    "fromChain": "accumulate",
    "toChain": "ethereum",
    "fromAddress": "acc://my-adi.acme",
    "toAddress": "0x...",
    "amount": "0.1",
    "tokenSymbol": "ETH",
    "adiUrl": "acc://my-adi.acme",
    "initiatedBy": "user@example.com",
    "timestamp": 1704067200000
  },
  "contractAddresses": {
    "anchor": "0x...",
    "anchorV2": "0x...",
    "abstractAccount": "0x...",
    "entryPoint": "0x..."
  },
  "publicKey": "hex-public-key",
  "proofClass": "on_demand"
}

// Response
{
  "success": true,
  "requestId": "req-uuid",
  "transactionHash": "0x...",
  "hashToSign": "0x...",  // Sign this with Key Vault
  "signerKeyPageUrl": "acc://my-adi.acme/book/1",
  "keyPageVersion": 1
}
```

### Phase 2: Submit

```typescript
// Request
POST /api/v1/intent/submit-signed
{
  "requestId": "req-uuid",
  "signature": "0x...",  // ED25519 signature from Key Vault
  "publicKey": "hex-public-key"
}

// Response
{
  "success": true,
  "txId": "0x...",
  "txHash": "0x...",
  "intentId": "uuid"
}
```

## Intent Data Structure

Transaction intents use a 4-blob protocol:

| Blob | Purpose | Contents |
|------|---------|----------|
| `data[0]` | Intent Metadata | Protocol version, proof class, description |
| `data[1]` | Cross-Chain Data | Legs, gas policies, contract addresses |
| `data[2]` | Governance Data | Authorization, validation rules, compliance |
| `data[3]` | Replay Protection | Nonces, timestamps, security flags |

### Proof Classes

| Class | Description | Use Case |
|-------|-------------|----------|
| `on_demand` | Immediate proof generation | Time-sensitive transfers |
| `on_cadence` | Batched proof generation | Cost-optimized operations |

## Development

### Running Tests

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

### Building

```bash
# Development build
npm run build

# Clean build
rm -rf dist && npm run build
```

## Deployment

### Systemd Service

```ini
[Unit]
Description=Certen API Bridge
After=network.target

[Service]
Type=simple
User=certen
WorkingDirectory=/opt/api-bridge
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Cloud Run / GCP

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/api-bridge

# Deploy
gcloud run deploy api-bridge \
  --image gcr.io/PROJECT_ID/api-bridge \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars ACCUM_ENDPOINT=https://...
```

## Security Considerations

- **Private Keys**: Never commit `.env` files with real credentials
- **CORS**: Configure allowed origins for production
- **HTTPS**: Enable TLS in production deployments
- **Rate Limiting**: Consider adding rate limiting for public deployments
- **Key Vault**: Use two-phase signing for user-controlled keys

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Verify `ACCUM_ENDPOINT` is correct |
| ADI not found | Wait for network propagation, use verify endpoint |
| Insufficient credits | Use `/api/v1/credits/add` to add credits |
| Signature invalid | Ensure Key Vault signs `hashToSign` not `transactionHash` |

## Related Components

| Component | Repository | Description |
|-----------|------------|-------------|
| Smart Contracts | `certen-contracts` | EVM, Solana, Aptos, Sui, NEAR, TON, TRON contract suites |
| Validator | `independant_validator` | BFT consensus node for proof generation and anchoring |
| Web App | `certen-web-app` | React SPA that uses this API |
| Key Vault | `key-vault-signer` | Browser extension for signing |
| Pending Service | `certen-pending-service` | Multi-sig discovery |
| Proofs Service | `proofs_service` | Proof storage and retrieval |

## License

MIT License

Copyright 2026 Certen Protocol. All rights reserved.
