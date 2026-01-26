# Build Stage
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Install Python dependencies for any build scripts that might need them (optional but safe)
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production Stage
FROM node:20-bullseye-slim AS runner

WORKDIR /app

# Install Python and dependencies
# numpy/pandas/pyswisseph often require build tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages required by the app
# (Derived from pyproject.toml)
RUN pip3 install --no-cache-dir pyswisseph ephem pandas numpy

# Install only production Node dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Copy ALL python scripts from server directory
# This ensures helper scripts like find_ayanamsa_zero.py are also present
COPY --from=builder /app/server/*.py ./server/

# Environment setup
ENV NODE_ENV=production
ENV PORT=5000

# Create volume mount point for data/artifacts
VOLUME ["/app/data"]

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "dist/index.js"]
