#!/usr/bin/env groovy

def call(Map config = [:]) {
    def registry = config.registry ?: 'ghcr.io'
    def project = config.project ?: 'tradenest'
    def service = config.service
    def tag = config.tag ?: "build-${env.BUILD_NUMBER}"
    def context = config.context ?: "./apps/${service}"
    def platforms = config.platforms ?: 'linux/amd64,linux/arm64'
    def push = config.push ?: true

    if (!service) {
        error "Service name is required"
    }

    def fullImage = "${registry}/${project}/${service}"
    def tags = ["${fullImage}:${tag}", "${fullImage}:latest"]

    def tagArgs = tags.collect { "-t ${it}" }.join(' ')

    sh """
        docker buildx build \
            --platform ${platforms} \
            ${tagArgs} \
            ${push ? '--push' : '--load'} \
            ${context}
    """
}