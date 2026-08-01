#!/bin/bash
# Docker Security Scan Script for TRADENEST
# Scans images for vulnerabilities using Trivy or Docker Scout

set -e

REGISTRY=${REGISTRY:-ghcr.io}
PROJECT_NAME=${PROJECT_NAME:-tradenest}
TAG=${TAG:-latest}
SCANNER=${SCANNER:-trivy}  # trivy or docker-scout
SEVERITY=${SEVERITY:-HIGH,CRITICAL}
EXIT_CODE=${EXIT_CODE:-1}

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
log_warning() { echo -e "\033[1;33m[WARNING]\033[0m $1"; }
log_error() { echo -e "\033[0;31m[ERROR]\033[0m $1"; }

check_scanner() {
    if [ "$SCANNER" = "trivy" ]; then
        if ! command -v trivy &> /dev/null; then
            log_error "Trivy not installed. Install from https://aquasecurity.github.io/trivy/"
            exit 1
        fi
    elif [ "$SCANNER" = "docker-scout" ]; then
        if ! docker scout version &> /dev/null; then
            log_error "Docker Scout not available. Update Docker Desktop or install Docker Scout CLI."
            exit 1
        fi
    else
        log_error "Unknown scanner: $SCANNER. Use 'trivy' or 'docker-scout'."
        exit 1
    fi
}

scan_image() {
    local image=$1
    log_info "Scanning $image with $SCANNER..."
    
    if [ "$SCANNER" = "trivy" ]; then
        trivy image \
            --severity "$SEVERITY" \
            --exit-code "$EXIT_CODE" \
            --format table \
            --ignore-unfixed \
            "$image"
    else
        docker scout cves "$image" --exit-code "$EXIT_CODE"
    fi
}

main() {
    log_info "Starting security scan for TRADENEST images"
    log_info "Registry: $REGISTRY"
    log_info "Project: $PROJECT_NAME"
    log_info "Tag: $TAG"
    log_info "Scanner: $SCANNER"
    log_info "Severity: $SEVERITY"
    echo ""
    
    check_scanner
    
    FAILED=0
    
    for service in "${SERVICES[@]}"; do
        image_name="${REGISTRY}/${PROJECT_NAME}/${service//\//-}"
        full_tag="${image_name}:${TAG}"
        
        if ! docker manifest inspect "$full_tag" &> /dev/null; then
            log_warning "Image $full_tag not found locally or in registry, skipping..."
            continue
        fi
        
        if ! scan_image "$full_tag"; then
            log_error "Vulnerabilities found in $full_tag"
            FAILED=1
        else
            log_success "No critical vulnerabilities in $full_tag"
        fi
    done
    
    echo ""
    if [ $FAILED -eq 1 ]; then
        log_error "Security scan failed - vulnerabilities detected"
        exit 1
    else
        log_success "All images passed security scan"
    fi
}

main "$@"