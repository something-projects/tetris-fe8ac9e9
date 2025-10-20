#!/bin/bash

set -e  # Exit on any error

echo "Starting Docker containerization process..."

# Configuration
DOCKER_IMAGE_TAG="shiqimei/shiqi-tetris:8d5f25"
DOCKER_CONFIG_PATH="/workspace/.something/DOCKER_CONFIG.json"
WORKSPACE_PATH="/workspace"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 1. Copy application to workspace (simulate /workspace path)
log "Setting up workspace..."
mkdir -p /workspace
cp -r . /workspace/
cd /workspace

# 2. Install dependencies
log "Installing dependencies..."
if [ -f "package.json" ]; then
    npm install --production
fi

# 3. Create DOCKER_CONFIG.json
log "Creating DOCKER_CONFIG.json..."
mkdir -p /workspace/.something
cat > "${DOCKER_CONFIG_PATH}" << EOF
{
  "container_image_url": "${DOCKER_IMAGE_TAG}",
  "entrypoint": ["/usr/local/bin/docker-entrypoint.sh"],
  "cmd": ["npm", "start"],
  "working_dir": "/app",
  "ttyd_port": 7681,
  "push_successful": false
}
EOF

# 4. Check system architecture
ARCH=$(uname -m)
log "System architecture: ${ARCH}"

# Get container ID using hostname
CONTAINER_ID=$(hostname)
log "Container ID: ${CONTAINER_ID}"

# 5. Docker Hub login
log "Logging in to Docker Hub..."
if [ -z "${DOCKERHUB_USERNAME}" ] || [ -z "${DOCKERHUB_TOKEN}" ]; then
    log "Warning: DOCKERHUB_USERNAME or DOCKERHUB_TOKEN environment variables not set"
    log "Attempting to use existing docker credentials..."
else
    echo "${DOCKERHUB_TOKEN}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
    log "Successfully logged in to Docker Hub"
fi

# 6. Setup docker buildx for multi-platform builds
log "Setting up docker buildx..."
# Install docker buildx plugin if not present
if ! docker buildx version > /dev/null 2>&1; then
    log "Installing docker buildx plugin..."
    mkdir -p ~/.docker/cli-plugins/
    BUILDX_VERSION="v0.11.2"
    curl -L "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-amd64" -o ~/.docker/cli-plugins/docker-buildx
    chmod +x ~/.docker/cli-plugins/docker-buildx
fi

# Create and use a new builder instance
docker buildx create --name tetris-builder --use || true
docker buildx inspect --bootstrap

# 7. Build Docker image based on architecture
if [ "${ARCH}" = "aarch64" ] || [ "${ARCH}" = "arm64" ]; then
    log "ARM64 system detected - building x86_64 image for Modal compatibility..."
    
    # Build multi-platform image with eStargz compression and push directly
    docker buildx build \
        --platform linux/amd64 \
        --tag "${DOCKER_IMAGE_TAG}" \
        --output type=image,oci-mediatypes=true,compression=estargz,push=true \
        .
    
else
    log "x86_64 system detected - building with eStargz compression..."
    
    # Build for x86_64 with eStargz compression and push
    docker buildx build \
        --platform linux/amd64 \
        --tag "${DOCKER_IMAGE_TAG}" \
        --output type=image,oci-mediatypes=true,compression=estargz,push=true \
        .
fi

# 8. Verify the push was successful
log "Verifying Docker image push..."
if docker buildx imagetools inspect "${DOCKER_IMAGE_TAG}" > /dev/null 2>&1; then
    log "Successfully verified Docker image in registry"
    
    # Update DOCKER_CONFIG.json to mark push as successful
    jq '.push_successful = true' "${DOCKER_CONFIG_PATH}" > "${DOCKER_CONFIG_PATH}.tmp" && mv "${DOCKER_CONFIG_PATH}.tmp" "${DOCKER_CONFIG_PATH}"
    log "Updated DOCKER_CONFIG.json - push marked as successful"
else
    log "ERROR: Failed to verify Docker image in registry"
    exit 1
fi

# 9. Display final configuration
log "Final DOCKER_CONFIG.json:"
cat "${DOCKER_CONFIG_PATH}"

log "Docker containerization completed successfully!"
log "Image: ${DOCKER_IMAGE_TAG}"
log "Architecture: linux/amd64 (Modal compatible)"
log "eStargz compression: enabled"
log "TTYd web terminal: port 7681"

# Cleanup builder
docker buildx rm tetris-builder || true