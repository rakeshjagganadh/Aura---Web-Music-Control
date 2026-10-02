# -------------------------------------------------------------
# Stage 1: Build Application & Server Bundle
# -------------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build production assets
COPY . .
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production Container Runtime for Cloud Run
# -------------------------------------------------------------
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
# Google Cloud Run default ingress port
ENV PORT=8080

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy pre-compiled Vite static frontend and esbuild server.cjs bundle
COPY --from=builder /app/dist ./dist

# Preserve auxiliary binaries
COPY --from=builder /app/bin ./bin

EXPOSE 8080

# Run server.cjs directly for optimal SIGTERM/SIGINT signal handling in Cloud Run
CMD ["node", "dist/server.cjs"]
