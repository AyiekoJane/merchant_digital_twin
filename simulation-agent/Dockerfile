FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Install Playwright browsers
RUN npx playwright install chromium

# Copy agent code
COPY agent.js ./

# Run the agent
CMD ["node", "agent.js"]
