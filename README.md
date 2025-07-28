# KidneyCare - Système de Gestion des Patients Rénaux

## 📋 Description

KidneyCare est une application web moderne dédiée à la gestion des patients atteints de maladie rénale chronique (CKD). Elle permet aux médecins de suivre les consultations, surveiller les paramètres vitaux et recevoir des alertes en temps réel pour une meilleure prise en charge des patients.

## ✨ Fonctionnalités Principales

### 🏥 Gestion des Patients
- Enregistrement et suivi des patients atteints de CKD
- Historique médical complet
- Classification par stade de CKD (1-5)
- Informations de contact et d'urgence

### 📊 Consultations Médicales
- Enregistrement des consultations avec paramètres vitaux
- Suivi de la créatinine, poids, tension artérielle
- Notes médicales détaillées
- Historique des consultations par patient

### 🚨 Système d'Alertes
- Surveillance automatique des seuils critiques
- Alertes en temps réel pour :
  - Créatinine élevée
  - Tension artérielle anormale
  - Perte de poids significative
- Niveaux de sévérité : Critique, Élevé, Avertissement
- Seuils personnalisables par patient

### 📈 Tableaux de Bord
- Vue d'ensemble des patients
- Graphiques de suivi des paramètres
- Statistiques et rapports
- Interface responsive et moderne

### 🔐 Authentification
- Système de connexion sécurisé
- Gestion des rôles utilisateurs
- Protection des routes sensibles

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** - Interface utilisateur
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling moderne
- **Radix UI** - Composants accessibles
- **React Query** - Gestion d'état serveur
- **Wouter** - Routage léger
- **Recharts** - Graphiques et visualisations
- **Framer Motion** - Animations

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Drizzle ORM** - Gestion de base de données
- **PostgreSQL** - Base de données
- **Passport.js** - Authentification
- **WebSocket** - Communication temps réel

### Outils de Développement
- **Vite** - Build tool et dev server
- **ESBuild** - Bundling de production
- **Drizzle Kit** - Migrations de base de données
- **Zod** - Validation de schémas

## 🚀 Installation et Configuration

### Prérequis
- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn

### 1. Cloner le Repository
```bash
git clone <repository-url>
cd KidneyCare
```

### 2. Installer les Dépendances
```bash
npm install
```

### 3. Configuration de l'Environnement
Créer un fichier `.env` à la racine du projet :
```env
DATABASE_URL=postgresql://username:password@localhost:5432/kidneycare
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-session-secret
```

### 4. Configuration de la Base de Données
```bash
# Pousser le schéma vers la base de données
npm run db:push
```

### 5. Lancer l'Application
```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

L'application sera accessible sur `http://localhost:5000`

## 📁 Structure du Projet

```
KidneyCare/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── hooks/         # Hooks personnalisés
│   │   ├── pages/         # Pages de l'application
│   │   └── lib/           # Utilitaires et configuration
│   └── index.html
├── server/                # Backend Express
│   ├── routes.ts          # Définition des routes API
│   ├── auth.ts            # Configuration authentification
│   ├── db.ts              # Configuration base de données
│   └── services/          # Services métier
├── shared/                # Code partagé
│   └── schema.ts          # Schéma de base de données
└── migrations/            # Migrations Drizzle
```

## 🔧 Scripts Disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Build de production
- `npm run start` - Lance le serveur de production
- `npm run check` - Vérification TypeScript
- `npm run db:push` - Synchronise le schéma avec la base de données

## 📊 Modèle de Données

### Tables Principales
- **users** - Utilisateurs du système (médecins)
- **patients** - Patients avec informations médicales
- **consultations** - Consultations avec paramètres vitaux
- **alerts** - Alertes générées automatiquement
- **alert_thresholds** - Seuils d'alerte personnalisables

## 🔒 Sécurité

- Authentification par session
- Hachage des mots de passe avec bcrypt
- Validation des données avec Zod
- Protection CSRF
- Routes protégées

## 📱 Interface Utilisateur

L'interface utilise un design moderne avec :
- Palette de couleurs médicales
- Composants accessibles (WCAG)
- Responsive design
- Animations fluides
- Navigation intuitive

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request


## 👥 Équipe

Développé pour améliorer la prise en charge des patients atteints de maladie rénale chronique.

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur le repository GitHub. 
