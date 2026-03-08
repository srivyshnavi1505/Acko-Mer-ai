FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/health || exit 1

EXPOSE 5000

USER node

CMD ["node", "server.js"]
