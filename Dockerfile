# CERTEN API Bridge - Dockerfile
# Configured for Kermit Testnet deployment

FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache git python3 make g++ curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy TypeScript SDK (mount or copy from local)
# Option 1: Copy from local build
# COPY typescript-sdk-accumulate /typescript-sdk-accumulate/lib

# Option 2: Use volume mount at runtime (recommended for development)
# docker run -v /path/to/sdk:/typescript-sdk-accumulate/lib ...

# Create SDK package.json for dependencies
RUN mkdir -p /typescript-sdk-accumulate && \
    echo '{"type": "module", "dependencies": {"@scure/bip32": "^1.6.0", "@noble/secp256k1": "^2.1.0", "tweetnacl": "^1.0.3", "axios": "^0.27.2", "bn.js": "^5.2.1", "events": "^3.3.0", "reflect-metadata": "^0.1.13", "sprintf-js": "^1.1.3", "@ledgerhq/logs": "^6.10.1", "stream-browserify": "^3.0.0", "bip39": "^3.1.0", "bip32": "^4.0.0", "bip32-path": "^0.4.2", "bitcoinjs-lib": "^6.1.5", "crypto-browserify": "^3.12.1", "@noble/hashes": "^1.3.1", "ed25519-hd-key": "^1.3.0", "@scure/bip39": "^1.2.1"}}' > /typescript-sdk-accumulate/package.json && \
    cd /typescript-sdk-accumulate && \
    npm install --production

# Copy source code
COPY . .

# Create data directory for persistent storage
RUN mkdir -p /app/data

# Build TypeScript
RUN npm run build

# Expose API port
EXPOSE 8085

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8085/health || exit 1

# Environment defaults for Kermit Testnet
ENV ACCUM_ENDPOINT=http://206.191.154.164/v3
ENV ACCUM_ENDPOINT_V2=http://206.191.154.164/v2
ENV PORT=8085

# Start the application
CMD ["npm", "start"]
