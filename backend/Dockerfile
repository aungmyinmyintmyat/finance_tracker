# Use a smaller base image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Change ownership to non-root user safely
RUN chown node:node /app

# Switch to non-root user
USER node

# Install dependencies first (better caching)
COPY --chown=node:node package*.json ./

# Fix: Force npm to omit developer test suites to keep the production image tiny
RUN npm install --omit=dev

# Copy application source (Relies completely on your frontend/backend .dockerignore files)
COPY --chown=node:node . .

# Expose app port
ENV PORT=8080
EXPOSE 8080

# Start application
CMD ["node", "src/server.js"]