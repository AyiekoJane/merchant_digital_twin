# Lightweight — no browser needed, Appium client only
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY agent.js ./

CMD ["node", "agent.js"]
