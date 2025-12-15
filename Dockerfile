# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
# Copy internal server files/scripts if needed (e.g., Python scripts for Swiss Eph if used directly via shell)
# Note: standard swisseph-v2 is a node module, so it's in node_modules
COPY --from=builder /app/server/swiss_chart_generator_kp.py ./server/

# Environment setup
ENV NODE_ENV=production
ENV PORT=5000

# Create volume mount point for SQLite database and artifacts
VOLUME ["/app/data"]

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "dist/index.js"]
