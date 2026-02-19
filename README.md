# TP1 - Projet Node.js pour Jenkins (Freestyle + Pipeline)

Projet de demo pour un premier job Jenkins:
- Build d une application Node/Vite
- Tests automatises avec couverture
- Analyse SonarQube
- Publication d un package `.tgz` dans Nexus

Prerequis local: Node.js 20 (fichier `.nvmrc` fourni).

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
- SonarQube server name: `sonarqube-local`
- Sonar scanner tool name: `sonar-scanner`
- Credentials Nexus id: `nexus-credentials`
- Un repo Nexus `raw-hosted` (ou adapter `NEXUS_REPOSITORY` dans `Jenkinsfile`)

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
