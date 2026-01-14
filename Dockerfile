# CERTEN API Bridge - Dockerfile
# Configured for Kermit Testnet deployment

FROM node:18-alpine

# Install build dependencies
RUN apk add --no-cache git python3 make g++ curl

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig.json ./

# Install app dependencies
RUN npm install

# Copy TypeScript SDK with its dependencies
COPY typescript-sdk-accumulate ./typescript-sdk-accumulate

# Install SDK dependencies
RUN cd typescript-sdk-accumulate && npm install --production

# Copy source code
COPY src ./src
COPY .env ./

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
ENV ACCUMULATE_SDK_PATH=/app/typescript-sdk-accumulate

# Start the application
CMD ["npm", "start"]
