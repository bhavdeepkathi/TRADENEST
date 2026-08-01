#!/bin/bash
# Docker Push Script for TRADENEST
# Pushes all service images to registry

set -e

REGISTRY=${REGISTRY:-ghcr.io}
PROJECT_NAME=${PROJECT_NAME:-tradenest}
TAG=${TAG:-latest}

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

log_info() { echo -e "\033[0;34m[INFO]\033[0m $1"; }
log_success() { echo -e "\033[0;32m[SUCCESS]\033[0m $1"; }

for service in "${SERVICES[@]}"; do
    image_name="${REGISTRY}/${PROJECT_NAME}/${service//\//-}"
    full_tag="${image_name}:${TAG}"
    
    log_info "Pushing ${full_tag}..."
    docker push "${full_tag}"
    log_success "Pushed ${full_tag}"
done

log_success "All images pushed to ${REGISTRY}/${PROJECT_NAME}:${TAG}"