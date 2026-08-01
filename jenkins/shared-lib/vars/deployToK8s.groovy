#!/usr/bin/env groovy

def call(Map config = [:]) {
    def environment = config.environment ?: 'staging'
    def namespace = config.namespace ?: "tradenest-${environment}"
    def services = config.services ?: ['frontend', 'auth', 'catalog', 'order', 'payment', 'ai', 'notification', 'gateway']
    def registry = config.registry ?: 'ghcr.io'
    def project = config.project ?: 'tradenest'
    def tag = config.tag ?: "build-${env.BUILD_NUMBER}"
    def timeout = config.timeout ?: '300s'
    def kubeContext = config.kubeContext ?: environment

    sh "kubectl config use-context ${kubeContext}"

    services.each { service ->
        def fullImage = "${registry}/${project}/${service}"
        sh """
            kubectl set image deployment/${service} ${service}=${fullImage}:${tag} -n ${namespace}
        """
    }

    services.each { service ->
        sh """
            kubectl rollout status deployment/${service} -n ${namespace} --timeout=${timeout}
        """
    }
}