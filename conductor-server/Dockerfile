# Node 24 LTS, production-focused image
FROM node:24-slim AS base
WORKDIR /app
ENV NODE_ENV=production
# tini for clean shutdowns; openssl/curl are handy for pg + healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends tini openssl curl \
    && rm -rf /var/lib/apt/lists/*
ENTRYPOINT ["/usr/bin/tini", "--"]

# Install only production deps from package.json/package-lock.json
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source
COPY . .

# App port
ENV PORT=3000
EXPOSE 3000

# Start the API
CMD ["node", "server.js"]
