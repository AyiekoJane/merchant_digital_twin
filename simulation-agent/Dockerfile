FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Install Playwright browsers
RUN npx playwright install chromium

# Copy agent code and channels
COPY agent.js ./
COPY agent-v2.js ./
COPY channels ./channels

# Default to V2 agent (channel-based)
CMD ["node", "agent-v2.js"]
