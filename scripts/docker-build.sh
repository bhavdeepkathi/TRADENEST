#!/bin/bash
# Docker Build Script for TRADENEST
# Builds all service images with proper tagging

set -e

# Configuration
REGISTRY=${REGISTRY:-ghcr.io}
PROJECT_NAME=${PROJECT_NAME:-tradenest}
TAG=${TAG:-latest}
BUILD_ARGS=${BUILD_ARGS:-""}
PLATFORMS=${PLATFORMS:-"linux/amd64,linux/arm64"}
PUSH=${PUSH:-false}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Services to build
SERVICES=(
    "frontend"
    "backend/auth"
    "backend/catalog"
    "backend/order"
    "backend/payment"
    "backend/ai"
    "backend/notification"
    "backend/gateway"
)

build_service() {
    local service=$1
    local context="./apps/${service}"
    local dockerfile="${context}/Dockerfile"
    local image_name="${REGISTRY}/${PROJECT_NAME}/${service//\//-}"
    local full_tag="${image_name}:${TAG}"
    
    if [ ! -f "$dockerfile" ]; then
        log_warning "Dockerfile not found for ${service}, skipping..."
        return 0
    fi
    
    log_info "Building ${service}..."
    log_info "  Context: ${context}"
    log_info "  Image: ${full_tag}"
    
    # Build with buildx for multi-platform support
    if docker buildx version >/dev/null 2>&1; then
        docker buildx build \
            --platform "${PLATFORMS}" \
            --tag "${full_tag}" \
            --file "${dockerfile}" \
            ${BUILD_ARGS} \
            ${PUSH:+--push} \
            "${context}"
    else
        log_warning "docker buildx not available, building single-platform"
        docker build \
            --tag "${full_tag}" \
            --file "${dockerfile}" \
            ${BUILD_ARGS} \
            "${context}"
        
        if [ "${PUSH}" = "true" ]; then
            docker push "${full_tag}"
        fi
    fi
    
    log_success "Built ${full_tag}"
}

main() {
    log_info "Starting TRADENEST Docker build"
    log_info "Registry: ${REGISTRY}"
    log_info "Project: ${PROJECT_NAME}"
    log_info "Tag: ${TAG}"
    log_info "Platforms: ${PLATFORMS}"
    log_info "Push: ${PUSH}"
    echo ""
    
    # Create buildx builder if needed
    if docker buildx version >/dev/null 2>&1; then
        if ! docker buildx ls | grep -q "tradenest-builder"; then
            log_info "Creating buildx builder..."
            docker buildx create --name tradenest-builder --use --bootstrap
        else
            docker buildx use tradenest-builder
        fi
    fi
    
    # Build all services
    for service in "${SERVICES[@]}"; do
        build_service "${service}"
    done
    
    echo ""
    log_success "All images built successfully!"
    
    if [ "${PUSH}" = "true" ]; then
        log_info "Images pushed to ${REGISTRY}/${PROJECT_NAME}"
    else
        log_info "Images built locally. Use PUSH=true to push to registry."
    fi
}

main "$@"