pipeline {
  agent any

  tools {
    nodejs 'nodejs'
  }

  environment {
    SONAR_INSTANCE = 'sonarqube-local'
    NEXUS_URL = 'localhost:8081'
    NEXUS_REPOSITORY = 'raw-hosted'
    NEXUS_CREDENTIALS = 'nexus-credentials'
    APP_GROUP = 'fr.efrei.devops'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Validate Toolchain') {
      steps {
        sh '''
          set -eu

          if ! command -v node >/dev/null 2>&1; then
            echo "ERROR: node not found in PATH."
            echo "Configure Manage Jenkins > Tools > NodeJS installations with the exact name: nodejs"
            exit 127
          fi

          if ! command -v npm >/dev/null 2>&1; then
            echo "ERROR: npm not found in PATH."
            echo "Configure Manage Jenkins > Tools > NodeJS installations with the exact name: nodejs"
            exit 127
          fi

          echo "Node version: $(node -v)"
          echo "npm version: $(npm -v)"

          node -e "const [major, minor] = process.versions.node.split('.').map(Number); const supported = (major === 20 && minor >= 19) || (major === 22 && minor >= 12); if (!supported) { console.error('ERROR: Node.js 20.19+ or 22.12+ is required for this project.'); process.exit(1); }"
        '''
      }
    }

    stage('Install') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Test') {
      steps {
        sh 'npm run test:ci'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('SonarQube Analysis') {
      steps {
        script {
          def scannerHome = tool 'sonar-scanner'
          withSonarQubeEnv("${SONAR_INSTANCE}") {
            sh """
              ${scannerHome}/bin/sonar-scanner \\
                -Dsonar.projectKey=tp1-jenkins-node-ui \\
                -Dsonar.projectName='TP1 Jenkins Node UI' \\
                -Dsonar.sources=src \\
                -Dsonar.tests=src \\
                -Dsonar.test.inclusions='src/**/*.test.js' \\
                -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
            """
          }
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 2, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Package') {
      steps {
        script {
          env.APP_VERSION = sh(
            script: "node -e \"console.log(JSON.parse(require('fs').readFileSync('package.json','utf8')).version)\"",
            returnStdout: true
          ).trim()
          env.PACKAGE_FILE = sh(script: 'npm pack', returnStdout: true).trim()
        }
      }
    }

    stage('Publish Nexus') {
      steps {
        nexusArtifactUploader(
          nexusVersion: 'nexus3',
          protocol: 'http',
          nexusUrl: "${NEXUS_URL}",
          repository: "${NEXUS_REPOSITORY}",
          credentialsId: "${NEXUS_CREDENTIALS}",
          groupId: "${APP_GROUP}",
          version: "${env.APP_VERSION}",
          artifacts: [[
            artifactId: 'jenkins-ui-demo',
            classifier: '',
            file: "${env.PACKAGE_FILE}",
            type: 'tgz'
          ]]
        )
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'dist/**,coverage/**,*.tgz', allowEmptyArchive: true
    }
  }
}
