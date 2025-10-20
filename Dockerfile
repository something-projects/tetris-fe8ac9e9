# Use official Node.js runtime as base image
FROM node:16-alpine

# Install system dependencies for ttyd and docker buildx
RUN apk add --no-cache curl bash

# Download and install ttyd for web terminal access
RUN curl -L https://github.com/tsl0922/ttyd/releases/download/1.7.4/ttyd.x86_64 -o /usr/local/bin/ttyd \
    && chmod +x /usr/local/bin/ttyd

# Set working directory
WORKDIR /app

# Copy package.json first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application source code
COPY src/ ./src/
COPY .gitignore ./
COPY .eslintrc.js ./
COPY jest.config.js ./

# Create entrypoint script
RUN cat > /usr/local/bin/docker-entrypoint.sh << 'EOF'
#!/bin/bash

# Start ttyd on port 7681 for debugging in the background
ttyd -p 7681 -W /app bash &

# Run the main application command
exec "$@"
EOF

# Make entrypoint script executable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S tetris -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R tetris:nodejs /app

# Switch to non-root user
USER tetris

# Expose ttyd port for web terminal access
EXPOSE 7681

# Set environment variables
ENV NODE_ENV=production
ENV TERM=xterm-256color

# Set default entrypoint and command
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]