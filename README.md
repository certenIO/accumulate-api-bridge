# CERTEN API Bridge

Accumulate network integration service for the CERTEN Protocol web application. This bridge provides HTTP API endpoints for interacting with the Accumulate blockchain, specifically configured for the Kermit Testnet.

## Features

- ADI (Accumulate Digital Identity) management
- Key book and key page operations
- Credit management
- Data account operations
- Cross-chain transaction intents
- Governance structure queries

## Prerequisites

- Node.js 18+
- Accumulate TypeScript SDK
- Access to Kermit Testnet (or local DevNet)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/certenIO/api-bridge.git
cd api-bridge
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Set Up Accumulate SDK

The bridge requires the Accumulate TypeScript SDK. Set the path via environment variable:

```bash
# Local development
export ACCUMULATE_SDK_PATH=/path/to/typescript-sdk-accumulate/lib

# Or copy SDK to default location
cp -r /path/to/typescript-sdk-accumulate ./typescript-sdk-accumulate
```

### 4. Build and Run

```bash
npm run build
npm start
```

The API will be available at `http://localhost:8085`.

## Docker Deployment

### Build Image

```bash
docker build -t certen/api-bridge .
```

### Run Container

```bash
docker run -d \
  --name certen-api-bridge \
  -p 8085:8085 \
  -v ./typescript-sdk-accumulate:/typescript-sdk-accumulate/lib \
  -v ./data:/app/data \
  --env-file .env \
  certen/api-bridge
```

## API Endpoints

### Health & Config

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/config` | GET | Service configuration |

### ADI Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/adi/create` | POST | Create new ADI |
| `/api/v1/adi/:url/verify` | GET | Verify ADI exists |
| `/api/v1/adi/:url/governance` | GET | Get governance structure |
| `/api/v1/adis` | GET | List all stored ADIs |
| `/api/v1/adis` | POST | Store ADI data |
| `/api/v1/adis/:url` | GET | Get specific ADI |
| `/api/v1/adis/:url` | DELETE | Delete ADI |

### Key Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/keybook/create` | POST | Create key book |
| `/api/v1/keybook/validate` | POST | Validate key book |
| `/api/v1/keypage/create` | POST | Create key page |
| `/api/v1/keypage/update` | POST | Update key page |
| `/api/v1/keypage/:url/version` | GET | Get key page version |
| `/api/v1/keypage/:url/verify` | GET | Verify key page exists |

### Credits

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/credits/add` | POST | Add credits to account |
| `/api/v1/credits/balance` | GET | Get credit balance |
| `/api/v1/credits/verify-minimum` | GET | Verify minimum credits |
| `/api/v1/credits/purchase-deployment` | POST | Purchase deployment credits |

### Accounts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/account/:url` | GET | Get account info |
| `/api/v1/account/:url/balance` | GET | Get account balance |
| `/api/v1/account/authorities/update` | POST | Update account authorities |

### Data Accounts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/data-account/create` | POST | Create data account |
| `/api/v1/data-account/write` | POST | Write data to account |
| `/api/v1/deployment/data-account` | POST | Create deployment data account |

### Intents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/intent/create` | POST | Create transaction intent |

### Network

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/network/status` | GET | Get network status |
| `/api/v1/oracle/price` | GET | Get oracle price |
| `/api/v1/tokens/balance` | GET | Get ACME token balance |

## Network Configuration

### Kermit Testnet (Default)

```
ACCUM_ENDPOINT=http://206.191.154.164/v3
ACCUM_ENDPOINT_V2=http://206.191.154.164/v2
```

Available ports on Kermit: 8660, 8760, 8860, 8960

### Local DevNet

```
ACCUM_ENDPOINT=http://localhost:26660/v3
ACCUM_ENDPOINT_V2=http://localhost:26660/v2
```

## Security Notes

- Never commit `.env` files with real credentials
- Private keys should be properly secured in production
- Use environment variables for all sensitive configuration
- Enable HTTPS in production deployments

## License

MIT License - CERTEN Protocol
