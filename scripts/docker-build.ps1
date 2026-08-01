<#
.SYNOPSIS
    Docker Build Script for TRADENEST
.DESCRIPTION
    Builds all service images with proper tagging and multi-platform support
.PARAMETER Registry
    Container registry (default: ghcr.io)
.PARAMETER ProjectName
    Project name (default: tradenest)
.PARAMETER Tag
    Image tag (default: latest)
.PARAMETER Platforms
    Target platforms (default: linux/amd64,linux/arm64)
.PARAMETER Push
    Push images to registry after build
.PARAMETER BuildArgs
    Additional build arguments
.EXAMPLE
    .\scripts\docker-build.ps1 -Tag "v1.0.0" -Push
.EXAMPLE
    .\scripts\docker-build.ps1 -Registry "myregistry.io" -Tag "staging" -Platforms "linux/amd64"
#>

param(
    [string]$Registry = "ghcr.io",
    [string]$ProjectName = "tradenest",
    [string]$Tag = "latest",
    [string]$Platforms = "linux/amd64,linux/arm64",
    [switch]$Push,
    [string]$BuildArgs = ""
)

$ErrorActionPreference = "Stop"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $color = switch ($Level) {
        "INFO"    { "Cyan" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR"   { "Red" }
        default   { "White" }
    }
    Write-Host "[$Level] $Message" -ForegroundColor $color
}

$services = @(
    "frontend"
    "backend/auth"
    "backend/catalog"
    "backend/order"
    "backend/payment"
    "backend/ai"
    "backend/notification"
    "backend/gateway"
)

function Build-Service {
    param([string]$service)
    
    $context = "./apps/$service"
    $dockerfile = "$context/Dockerfile"
    $imageName = "$Registry/$ProjectName/$($service -replace '/', '-')"
    $fullTag = "$imageName:$Tag"
    
    if (-not (Test-Path $dockerfile)) {
        Write-Log "Dockerfile not found for $service, skipping..." "WARNING"
        return
    }
    
    Write-Log "Building $service..." "INFO"
    Write-Log "  Context: $context" "INFO"
    Write-Log "  Image: $fullTag" "INFO"
    
    # Check if buildx is available
    if (docker buildx version 2>$null) {
        $pushFlag = if ($Push) { "--push" } else { "" }
        $buildArgs = if ($BuildArgs) { $BuildArgs } else { "" }
        
        docker buildx build `
            --platform $Platforms `
            --tag $fullTag `
            --file $dockerfile `
            $buildArgs `
            $pushFlag `
            $context
    } else {
        Write-Log "docker buildx not available, building single-platform" "WARNING"
        docker build `
            --tag $fullTag `
            --file $dockerfile `
            $BuildArgs `
            $context
        
        if ($Push) {
            docker push $fullTag
        }
    }
    
    Write-Log "Built $fullTag" "SUCCESS"
}

# Main
Write-Log "Starting TRADENEST Docker build" "INFO"
Write-Log "Registry: $Registry" "INFO"
Write-Log "Project: $ProjectName" "INFO"
Write-Log "Tag: $Tag" "INFO"
Write-Log "Platforms: $Platforms" "INFO"
Write-Log "Push: $Push" "INFO"
Write-Host ""

# Create buildx builder if needed
if (docker buildx version 2>$null) {
    if (-not (docker buildx ls | Select-String "tradenest-builder")) {
        Write-Log "Creating buildx builder..." "INFO"
        docker buildx create --name tradenest-builder --use --bootstrap
    } else {
        docker buildx use tradenest-builder
    }
}

# Build all services
foreach ($service in $services) {
    Build-Service -service $service
}

Write-Host ""
Write-Log "All images built successfully!" "SUCCESS"

if ($Push) {
    Write-Log "Images pushed to $Registry/$ProjectName" "INFO"
} else {
    Write-Log "Images built locally. Use -Push to push to registry." "INFO"
}