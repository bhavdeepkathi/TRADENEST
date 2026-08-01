<#
.SYNOPSIS
    Docker Push Script for TRADENEST
.DESCRIPTION
    Pushes all service images to container registry
.PARAMETER Registry
    Container registry (default: ghcr.io)
.PARAMETER ProjectName
    Project name (default: tradenest)
.PARAMETER Tag
    Image tag (default: latest)
#>

param(
    [string]$Registry = "ghcr.io",
    [string]$ProjectName = "tradenest",
    [string]$Tag = "latest"
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

foreach ($service in $services) {
    $imageName = "$Registry/$ProjectName/$($service -replace '/', '-')"
    $fullTag = "$imageName:$Tag"
    
    Write-Log "Pushing $fullTag..." "INFO"
    docker push $fullTag
    Write-Log "Pushed $fullTag" "SUCCESS"
}

Write-Log "All images pushed to $Registry/$ProjectName:$Tag" "SUCCESS"