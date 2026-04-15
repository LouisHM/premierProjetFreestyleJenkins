# TP1 - Projet Node.js pour Jenkins (Freestyle + Pipeline)

Projet de demo pour un premier job Jenkins:
- Build d une application Node/Vite
- Tests automatises avec couverture
- Analyse SonarQube
- Publication d un package `.tgz` dans Nexus

Prerequis local: Node.js `20.19+`, `22.12+`, ou `24+`.

## 1) Lancer en local

```bash
npm ci
npm run dev
```

App: http://localhost:5173

### Commandes CI locales

```bash
npm run test:ci
npm run build
npm pack
```

## 2) Job Jenkins Freestyle (UI Jenkins)

Dans **Build Steps > Execute shell**, mets exactement:

```bash
npm ci
npm run test:ci
npm run build
npm pack
```

Ensuite:
- SonarQube: ajouter une action d analyse Sonar (plugin SonarQube Scanner)
- Nexus: ajouter l upload de l artefact `.tgz` (plugin Nexus Artifact Uploader)

## 3) Job Jenkins Pipeline

Ce repo contient un `Jenkinsfile` a la racine. Le pipeline fait:
1. `npm ci`
2. `npm run test:ci`
3. `npm run build`
4. SonarQube scan + Quality Gate
5. `npm pack`
6. Upload de `*.tgz` vers Nexus

### Prerequis Jenkins (important)

Configurer dans Jenkins:
- Plugins: `Git`, `Pipeline`, `SonarQube Scanner`, `Nexus Artifact Uploader`
- Installer Node.js directement sur la machine Jenkins: `24.x` ou `22.x` recommande, `20.19+` acceptable
- Le pipeline ajoute deja ces chemins au `PATH` en priorite: `.../node@24/bin`, `.../node@22/bin`, `.../node@20/bin`, puis `/opt/homebrew/bin` et `/usr/local/bin`
- SonarQube server name: `sonarqube-local`
- Option A: configurer un outil Jenkins SonarScanner nomme `sonar-scanner`
- Option B: installer `sonar-scanner` directement sur la machine Jenkins et le laisser accessible dans le `PATH`
- Credentials Nexus id: `nexus-credentials`
- Un repo Nexus `raw-hosted` (ou adapter `NEXUS_REPOSITORY` dans `Jenkinsfile`)

Le pipeline contient maintenant une etape `Validate Toolchain` qui echoue clairement si `node` ou `npm` ne sont pas disponibles sur l agent Jenkins, ou si Jenkins utilise une version non supportee comme `Node 23`.

Si tu veux absolument utiliser le plugin Jenkins `NodeJS`, il faut le plugin correspondant et il faudra reintroduire cette configuration dans le `Jenkinsfile`. Dans l etat actuel, le pipeline n en depend plus.

## 4) Variables a adapter dans Jenkinsfile

Dans `Jenkinsfile`:
- `SONAR_INSTANCE`
- `NEXUS_URL`
- `NEXUS_REPOSITORY`
- `NEXUS_CREDENTIALS`

## 5) Acces repo en lecture (demande TP)

Ajouter en lecture les comptes:
- GitHub: `Branlute`
- GitLab: `tlanquetin`

## Scripts npm disponibles

```bash
npm run dev
npm run test
npm run test:ci
npm run build
npm run preview
npm run ci
```
