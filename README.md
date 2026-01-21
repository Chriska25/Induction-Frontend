# Induction PM13 - Frontend

Frontend React pour la Plateforme de Formation PM13.

## 🚀 Technologies

- **React 18**
- **Vite**
- **React Router**
- **TypeScript**

## 📋 Prérequis

- Node.js 18+
- Backend API déployé

## ⚙️ Installation

### 1. Cloner le repository

```bash
git clone https://github.com/Chriska25/Induction-Frontend.git
cd Induction-Frontend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration

Copiez `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Modifiez `.env` :

```env
VITE_API_URL=https://votre-backend-url.com
```

### 4. Démarrer en développement

```bash
npm run dev
```

Le frontend démarre sur `http://localhost:5173`

## 🏗️ Build pour Production

```bash
npm run build
```

Les fichiers sont générés dans `dist/`

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
npm i -g vercel
vercel
```

### Netlify

```bash
npm i -g netlify-cli
netlify deploy
```

### Coolify

1. Créer une nouvelle application
2. Connecter le repository GitHub
3. Configurer `VITE_API_URL` dans les variables d'environnement
4. Déployer

## 📝 Variables d'Environnement

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL du backend API |

## 🔗 Backend

Ce frontend nécessite le backend :
- Repository : https://github.com/Chriska25/Induction-Backend
- Documentation : Voir README du backend

## 📄 Licence

MIT
