pipeline {
  agent any

  environment {
    SONAR_INSTANCE = 'sonarqube-local'
    NEXUS_URL = 'localhost:8081'
    NEXUS_REPOSITORY = 'raw-hosted'
    NEXUS_CREDENTIALS = 'nexus-credentials'
    APP_GROUP = 'fr.efrei.devops'
    NODE_FALLBACK_PATH = '/opt/homebrew/opt/node@24/bin:/usr/local/opt/node@24/bin:/opt/homebrew/opt/node@22/bin:/usr/local/opt/node@22/bin:/opt/homebrew/opt/node@20/bin:/usr/local/opt/node@20/bin:/opt/homebrew/bin:/usr/local/bin'
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
          export PATH="$NODE_FALLBACK_PATH:$PATH"

          if ! command -v node >/dev/null 2>&1; then
            echo "ERROR: node not found in PATH."
            echo "Install Node.js 20.19+ or 22.12+ on the Jenkins machine."
            echo "Expected PATH locations already checked: $NODE_FALLBACK_PATH"
            exit 127
          fi

          if ! command -v npm >/dev/null 2>&1; then
            echo "ERROR: npm not found in PATH."
            echo "Install Node.js 20.19+ or 22.12+ on the Jenkins machine."
            echo "Expected PATH locations already checked: $NODE_FALLBACK_PATH"
            exit 127
          fi

          echo "Node binary: $(command -v node)"
          echo "npm binary: $(command -v npm)"
          echo "Node version: $(node -v)"
          echo "npm version: $(npm -v)"

          node -e "const [major, minor] = process.versions.node.split('.').map(Number); const supported = (major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major >= 24; if (!supported) { console.error('ERROR: Node.js 20.19+, 22.12+, or 24+ is required for this project. Node 23 is not supported.'); process.exit(1); }"
        '''
      }
    }

    stage('Install') {
      steps {
        sh '''
          export PATH="$NODE_FALLBACK_PATH:$PATH"
          npm ci
        '''
      }
    }

    stage('Test') {
      steps {
        sh '''
          export PATH="$NODE_FALLBACK_PATH:$PATH"
          npm run test:ci
        '''
      }
    }

    stage('Build') {
      steps {
        sh '''
          export PATH="$NODE_FALLBACK_PATH:$PATH"
          npm run build
        '''
      }
    }

    stage('SonarQube Analysis') {
      steps {
        script {
          def scannerHome = ''
          try {
            scannerHome = tool name: 'sonar-scanner', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
          } catch (Exception err) {
            echo "Sonar scanner Jenkins tool 'sonar-scanner' unavailable: ${err.message}"
          }

          withSonarQubeEnv("${SONAR_INSTANCE}") {
            sh """
              set -eu
              export PATH="$NODE_FALLBACK_PATH:$PATH"

              if [ -n "${scannerHome}" ] && [ -x "${scannerHome}/bin/sonar-scanner" ]; then
                SCANNER_CMD="${scannerHome}/bin/sonar-scanner"
              elif command -v sonar-scanner >/dev/null 2>&1; then
                SCANNER_CMD="$(command -v sonar-scanner)"
              else
                echo "ERROR: sonar-scanner introuvable."
                echo "Configure un outil Jenkins 'sonar-scanner' ou installe sonar-scanner sur l'agent Jenkins."
                exit 127
              fi

              echo "Sonar scanner binary: \$SCANNER_CMD"
              "\$SCANNER_CMD"
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
            script: '''export PATH="$NODE_FALLBACK_PATH:$PATH"
node -e "console.log(JSON.parse(require('fs').readFileSync('package.json','utf8')).version)"''',
            returnStdout: true
          ).trim()
          env.PACKAGE_FILE = sh(
            script: '''export PATH="$NODE_FALLBACK_PATH:$PATH"
npm pack''',
            returnStdout: true
          ).trim()
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
