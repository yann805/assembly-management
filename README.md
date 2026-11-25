# 🏛️ Système de Gestion des Assemblées, Membres et Trésorerie

Application web complète de gestion administrative et financière de plusieurs assemblées.
Devise : **Franc CFA (FCFA)** — MVP v1.0

---

## 📋 Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Structure du projet](#3-structure-du-projet)
4. [Prérequis](#4-prérequis)
5. [Installation locale — étape par étape](#5-installation-locale--étape-par-étape)
6. [Démarrage rapide (Docker)](#6-démarrage-rapide-docker)
7. [Comptes de démonstration](#7-comptes-de-démonstration)
8. [Fonctionnalités implémentées](#8-fonctionnalités-implémentées)
9. [API REST — documentation](#9-api-rest--documentation)
10. [Déploiement en production](#10-déploiement-en-production)
11. [Dépannage](#11-dépannage)

---

## 1. Vue d'ensemble

Ce projet implémente intégralement le cahier des charges fonctionnel et technique :

- **3 acteurs** : Trésorerie générale (admin), Dirigeant, Trésorier d'assemblée.
- **Gestion multi-assemblées** : chaque assemblée a son dirigeant, son trésorier et ses membres.
- **Contributions financières** : dîme + offrande répartie entre rubriques, avec validation des deux égalités financières.
- **Rapports mensuels** : génération, soumission, confirmation de réception physique.
- **Fidélité** : suivi mensuel des dîmes et offrandes par membre.
- **Audit** : journalisation des actions sensibles.
- **Permissions RBAC** : vérifiées côté serveur, isolation des données par assemblée.

---

## 2. Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 14 + React 18 + TypeScript |
| UI | Tailwind CSS + shadcn/ui + Radix UI |
| Formulaires | React Hook Form + Zod |
| Requêtes | TanStack Query (React Query) |
| State | Zustand (persistant) |
| Backend | Node.js + NestJS 10 + TypeScript |
| ORM | Prisma 5 |
| Base de données | PostgreSQL 16 (Supabase en production) |
| Auth | JWT (Passport) |
| API | REST + Swagger / OpenAPI |
| Export Excel | ExcelJS |

---

## 3. Structure du projet

```
assembly-management/
├── docker-compose.yml              # PostgreSQL local
├── .gitignore
├── README.md                        # Ce guide
│
├── backend/                         # assembly-api (NestJS)
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma           # Schéma complet (15+ tables)
│   │   └── seed.ts                 # Données initiales + comptes démo
│   └── src/
│       ├── main.ts                  # Bootstrap + Swagger
│       ├── app.module.ts
│       ├── prisma/                  # PrismaService
│       ├── common/                  # Guards, decorators, filters, utils
│       │   ├── guards/              # JwtAuthGuard, RolesGuard, AssemblyScopeGuard
│       │   ├── decorators/          # @Roles, @CurrentUser, @Public
│       │   ├── filters/             # HttpExceptionFilter
│       │   └── utils/               # financial.ts
│       ├── auth/                    # JWT, login, me, change-password
│       ├── users/                   # Gestion comptes utilisateurs
│       ├── roles/                   # Rôles + attributions
│       ├── assemblies/              # Assemblées + désignation responsables
│       ├── memberships/             # Appartenances membre ↔ assemblée
│       ├── members/                 # Fiches membres (CRUD)
│       ├── categories/              # Rubriques financières
│       ├── contributions/            # Cœur financier (dîme + offrande + répartition)
│       ├── reports/                 # Rapports mensuels + export Excel/HTML
│       ├── confirmations/           # Confirmation réception physique
│       ├── statistics/              # Dashboard + fidélité
│       └── audit/                   # Journal d'audit
│
└── frontend/                        # assembly-web (Next.js)
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.ts
    ├── components.json              # Config shadcn/ui
    ├── .env.example
    └── src/
        ├── app/
        │   ├── layout.tsx           # Root layout + Providers
        │   ├── page.tsx             # Redirection selon rôle
        │   ├── login/               # Page de connexion
        │   └── (dashboard)/         # Layout authentifié
        │       ├── layout.tsx       # Sidebar + guards
        │       ├── admin/           # Trésorerie générale
        │       │   ├── page.tsx               # Dashboard
        │       │   ├── assemblies/           # CRUD assemblées + responsables
        │       │   ├── members/               # Tous les membres
        │       │   ├── categories/            # Rubriques financières
        │       │   ├── reports/               # Validation + confirmation
        │       │   └── statistics/            # Stats + audit
        │       ├── treasurer/       # Trésorier d'assemblée
        │       │   ├── page.tsx               # Dashboard
        │       │   ├── members/               # CRUD membres + détails
        │       │   ├── contributions/         # Saisie avec répartition
        │       │   └── reports/               # Génération + soumission
        │       └── leader/          # Dirigeant (consultation)
        │           └── page.tsx
        ├── components/
        │   ├── ui/                  # shadcn/ui (button, input, card, dialog, etc.)
        │   ├── layout/              # Sidebar, PageHeader, StatCard
        │   ├── forms/               # MemberForm
        │   └── providers.tsx        # React Query + Toaster
        ├── hooks/queries/           # Tous les hooks TanStack Query
        ├── lib/                     # api.ts, utils.ts
        ├── stores/                  # auth-store.ts (Zustand)
        └── types/                   # Types TypeScript partagés
```

---

## 4. Prérequis

Avant de commencer, installez les outils suivants sur votre machine :

| Outil | Version | Vérification |
|-------|---------|--------------|
| **Node.js** | 18.x ou 20.x | `node --version` |
| **npm** | 9+ | `npm --version` |
| **PostgreSQL** | 14+ (ou via Docker) | `psql --version` |
| **Docker** (optionnel) | récent | `docker --version` |
| **Git** | récent | `git --version` |

> 💡 Si vous n'avez pas PostgreSQL installé localement, le `docker-compose.yml` fourni permet de lancer une base en une commande.

---

## 5. Installation locale — étape par étape

### Étape 1 — Décompressez le projet

```bash
unzip assembly-management.zip
cd assembly-management
```

### Étape 2 — Démarrez PostgreSQL (au choix)

**Option A — Avec Docker (recommandé) :**
```bash
docker compose up -d
# PostgreSQL disponible sur localhost:5432
# User: postgres / Password: postgres / DB: assembly_db
```

**Option B — PostgreSQL local déjà installé :**
```bash
createdb assembly_db
# Adaptez le DATABASE_URL dans backend/.env
```

**Option C — Supabase (production) :**
- Créez un projet sur https://supabase.com
- Récupérez l'URL de connexion dans Project Settings → Database
- Utilisez-la comme `DATABASE_URL`

### Étape 3 — Configurez et démarrez le BACKEND

```bash
cd backend

# Copiez le fichier d'environnement
cp .env.example .env

# Éditez .env si besoin (le DATABASE_URL par défaut fonctionne avec Docker)
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/assembly_db?schema=public"

# Installez les dépendances
npm install

# Générez le client Prisma
npx prisma generate

# Créez la base de données et appliquez le schéma
npx prisma db push

# (Optionnel) Initialisez les données de démonstration
npm run prisma:seed

# Démarrez le serveur de développement
npm run start:dev
```

✅ Le backend est accessible sur **http://localhost:4000**
✅ La documentation Swagger sur **http://localhost:4000/api/docs**
✅ Le frontend appelle l'API sur **http://localhost:4000/api** (port `4000` réservé au backend).

### Étape 4 — Configurez et démarrez le FRONTEND

Dans un **nouveau terminal** :

```bash
cd frontend

# Copiez le fichier d'environnement
cp .env.example .env

# Vérifiez que NEXT_PUBLIC_API_URL pointe vers votre backend
# NEXT_PUBLIC_API_URL=http://localhost:4000/api

# Installez les dépendances
npm install

# Démarrez le serveur de développement
npm run dev
```

✅ Le frontend est accessible sur **http://localhost:3000**

### Étape 5 — Connectez-vous

Ouvrez http://localhost:3000/login et utilisez les comptes de démonstration (voir ci-dessous).

---

## 6. Démarrage rapide (Docker)

Pour PostgreSQL uniquement (le backend et le frontend tournent en local pour le développement) :

```bash
docker compose up -d
cd backend && cp .env.example .env && npm install && npx prisma generate && npx prisma db push && npm run prisma:seed && npm run start:dev
# (autre terminal)
cd frontend && cp .env.example .env && npm install && npm run dev
```

---

## 7. Comptes de démonstration

Après le `seed`, ces comptes sont disponibles :

| Rôle | Identifiant | Mot de passe | Description |
|------|-------------|--------------|-------------|
| 👑 Trésorerie générale | `admin@assembly.org` | `Admin@123` | Accès total à toutes les assemblées |
| 💰 Trésorier | `tresorier@assembly.org` | `Tresorier@123` | Trésorier de l'Assemblée Centrale |
| 🏛️ Responsable d'assemblée | `leader@assembly.org` | `Leader@123` | Responsable de l'Assemblée Centrale |

> Le seed crée également une assemblée « Assemblée Centrale », 5 membres de démo, 5 rubriques financières (Construction, Évangélisation, Fonctionnement, Assistance sociale, Missions), un dirigeant et un trésorier.
>
> Si la connexion affiche une erreur de serveur, vérifiez que PostgreSQL et l'API backend sont démarrés avant de vous connecter. Pour initialiser les comptes, exécutez `cd backend && npm run prisma:seed`.

---

## 8. Fonctionnalités implémentées

### 8.1 Authentification & Permissions
- ✅ Connexion par email ou téléphone + mot de passe (bcrypt)
- ✅ JWT stateless avec expiration configurable
- ✅ 3 rôles : `GENERAL_TREASURY`, `ASSEMBLY_LEADER`, `ASSEMBLY_TREASURER`
- ✅ Guards : `JwtAuthGuard`, `RolesGuard`, `AssemblyScopeGuard` (isolation par assemblée)
- ✅ Décorateurs : `@Roles()`, `@CurrentUser()`, `@Public()`
- ✅ Changement de mot de passe

### 8.2 Gestion des assemblées
- ✅ CRUD complet (créer, modifier, activer/désactiver)
- ✅ Désignation du dirigeant et du trésorier (parmi les membres de l'assemblée)
- ✅ Remplacement des responsables (historique conservé)
- ✅ Création automatique du compte utilisateur trésorier avec mot de passe temporaire

### 8.3 Gestion des membres
- ✅ Fiche complète : identification, coordonnées, infos spirituelles (conversion, baptême d'eau, baptême du Saint-Esprit), statut matrimonial, filière, niveau, profession
- ✅ Contacts multiples (téléphone, email, adresse)
- ✅ Recherche, pagination, filtres
- ✅ Désactivation (conserve l'historique)
- ✅ Historique des contributions par membre

### 8.4 Rubriques financières
- ✅ CRUD par la trésorerie générale uniquement
- ✅ Activation/désactivation (pas de suppression physique si utilisée)
- ✅ Statistiques par rubrique

### 8.5 Contributions (cœur financier)
- ✅ Saisie dîme + offrande + répartition par rubriques
- ✅ **Validation de l'Égalité 1** : `dîme + offrande = total payé`
- ✅ **Validation de l'Égalité 2** : `Σ(répartitions) = offrande`
- ✅ Transaction SQL atomique (contribution + allocations + stats)
- ✅ Plusieurs paiements par membre et par mois
- ✅ Vérification du verrouillage de période (rapport soumis → ajout bloqué)

### 8.6 Rapports mensuels
- ✅ Génération automatique à partir des contributions (brouillon)
- ✅ Soumission à la trésorerie générale
- ✅ Statuts : `DRAFT` → `SUBMITTED` → `CONFIRMED`
- ✅ Instantané des montants et noms de rubriques (conservé même si renommage)
- ✅ Un seul rapport final par assemblée/mois/année
- ✅ Export Excel (ExcelJS) et HTML (pour impression PDF)

### 8.7 Confirmation de réception
- ✅ Par la trésorerie générale uniquement
- ✅ Vérification `montant reçu = montant déclaré` (pas de gestion d'écarts)
- ✅ Enregistrement de l'auteur, date, montant

### 8.8 Statistiques & Fidélité
- ✅ Dashboard admin (global) : assemblées, membres, totaux, rapports
- ✅ Dashboard trésorier (limité à son assemblée)
- ✅ Fidélité aux dîmes (mois avec/sans dîme, taux, cumul)
- ✅ Fidélité aux offrandes (mois avec/sans offrande, taux, cumul)
- ✅ Totaux par rubrique

### 8.9 Audit & Journalisation
- ✅ Table `audit_logs` (action, entité, anciennes/nouvelles valeurs)
- ✅ Traçabilité : création/modification membre, contribution, rubrique, responsabilité, rapport, confirmation

---

## 9. API REST — documentation

Une fois le backend démarré, la documentation interactive Swagger est disponible sur :
**http://localhost:4000/api/docs**

### Endpoints principaux

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| POST | `/api/auth/login` | Connexion | Public |
| GET | `/api/auth/me` | Utilisateur connecté | Tous |
| POST | `/api/auth/change-password` | Changer mot de passe | Tous |
| GET | `/api/assemblies` | Liste assemblées | Tous |
| POST | `/api/assemblies` | Créer assemblée | Admin |
| PATCH | `/api/assemblies/:id` | Modifier assemblée | Admin |
| POST | `/api/assemblies/:id/responsibilities` | Désigner responsable | Admin |
| GET | `/api/members` | Liste membres (paginée) | Tous (scope) |
| POST | `/api/members` | Ajouter membre | Admin, Trésorier |
| PATCH | `/api/members/:id` | Modifier membre | Admin, Trésorier |
| GET | `/api/members/:id/contributions` | Contributions d'un membre | Tous (scope) |
| GET | `/api/categories` | Liste rubriques | Tous |
| POST | `/api/categories` | Créer rubrique | Admin |
| PATCH | `/api/categories/:id` | Modifier rubrique | Admin |
| DELETE | `/api/categories/:id` | Désactiver/supprimer | Admin |
| POST | `/api/contributions` | Enregistrer contribution | Admin, Trésorier |
| GET | `/api/contributions` | Liste contributions | Tous (scope) |
| GET | `/api/contributions/monthly-totals/:assemblyId` | Totaux mensuels | Tous (scope) |
| POST | `/api/reports/generate` | Générer rapport | Admin, Trésorier |
| POST | `/api/reports/:id/submit` | Soumettre rapport | Trésorier |
| GET | `/api/reports/:id/export/excel` | Export Excel | Tous (scope) |
| POST | `/api/confirmations/:reportId` | Confirmer réception | Admin |
| GET | `/api/statistics/dashboard` | Tableau de bord | Tous (scope) |
| GET | `/api/statistics/members/:id/fidelity` | Fidélité membre | Tous (scope) |
| GET | `/api/audit` | Journal d'audit | Tous (scope) |

---

## 10. Déploiement en production

### 10.1 Base de données — Supabase

1. Créez un compte sur https://supabase.com
2. Créez un nouveau projet
3. Dans **Project Settings → Database**, copiez l'**URL de connexion** (format `postgresql://...`)
4. Utilisez-la comme `DATABASE_URL`

### 10.2 Backend — Render

1. Poussez le code sur GitHub
2. Sur https://render.com, créez un **Web Service** à partir du dépôt
3. Configuration :
   - **Build Command** : `cd backend && npm install && npx prisma generate`
   - **Start Command** : `cd backend && npx prisma migrate deploy && npm run start:prod`
   - **Variables d'environnement** :
     ```
     DATABASE_URL=postgresql://...supabase...
     JWT_SECRET=votre-clé-secrète-très-longue
     JWT_EXPIRES_IN=7d
     CORS_ORIGINS=https://votre-frontend.vercel.app
     NODE_ENV=production
     ```
4. Déployez — l'API sera sur `https://votre-api.onrender.com`

> ⚠️ Après le premier déploiement, exécutez le seed une fois pour créer le compte admin.

### 10.3 Frontend — Vercel

1. Sur https://vercel.com, importez le dépôt GitHub
2. Configuration :
   - **Root Directory** : `frontend`
   - **Framework Preset** : Next.js
   - **Build Command** : `npm run build` (détecté automatiquement)
   - **Environment Variables** :
     ```
     NEXT_PUBLIC_API_URL=https://votre-api.onrender.com/api
     ```
3. Déployez — le frontend sera sur `https://votre-app.vercel.app`

### 10.4 Mise à jour du CORS

Dans `backend/.env` (ou les variables Render), mettez à jour `CORS_ORIGINS` avec l'URL Vercel :
```
CORS_ORIGINS=https://votre-app.vercel.app
```

### 10.5 Sauvegardes Supabase

Dans Supabase → Database → Backups, activez les sauvegardes automatiques quotidiennes.

---

## 11. Dépannage

### Le backend ne démarre pas

- Vérifiez que PostgreSQL tourne : `docker compose ps` ou `pg_isready`
- Vérifiez le `DATABASE_URL` dans `backend/.env`
- Recréez la base : `npx prisma db push --force-reset` (⚠️ efface les données)

### Le frontend affiche « Chargement... » en boucle

- Vérifiez que le backend tourne sur http://localhost:4000
- Vérifiez que `frontend/.env` contient `NEXT_PUBLIC_API_URL=http://localhost:4000/api` (le frontend lui-même utilise le port `3000`)
- Après modification de `frontend/.env`, arrêtez et redémarrez Next.js (`cd frontend && npm run dev`)
- Vérifiez que `backend/.env` contient `PORT=4000` et `CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"`, puis redémarrez le backend
- Vérifiez la console navigateur (F12) pour les erreurs CORS

### Erreur 401 « Compte invalide »

- Le compte est peut-être désactivé en base (`is_active = false`)
- Activez-le : `UPDATE users SET is_active = true WHERE email = '...';` via Prisma Studio :
  ```bash
  cd backend && npx prisma studio
  ```

### Réinitialiser les données

```bash
cd backend
npx prisma db push --force-reset
npm run prisma:seed
```

### Problème de permissions Prisma

```bash
cd backend
npx prisma generate
npx prisma db push
```

### Ports déjà utilisés

- Backend : changez `PORT=4000` dans `backend/.env`
- Frontend : lancez avec `npm run dev -- -p 3001`
- PostgreSQL : changez le port dans `docker-compose.yml` (et adaptez `DATABASE_URL`)

---

## 📚 Documentation supplémentaire

- **Cahier des charges fonctionnel** : document `assembleProduct.docx` fourni
- **Spécification technique** : document `assembleTechnical.docx` fourni
- **API Swagger** : http://localhost:4000/api/docs (après démarrage du backend)

## 📝 Notes de conception

1. **Approche Backend First** respectée : le backend est entièrement opérationnel indépendamment du frontend (testable via Swagger ou Postman).
2. **Isolation des données** : un trésorier ne peut jamais accéder aux données d'une autre assemblée — vérifié côté serveur par `AssemblyScopeGuard` et dans chaque service.
3. **Cohérence financière** : les deux égalités (`dîme + offrande = total` et `Σ allocations = offrande`) sont vérifiées dans une transaction SQL. Aucune contribution incohérente ne peut être enregistrée.
4. **Conservation de l'historique** : aucune suppression physique des transactions financières. Les rubriques désactivées disparaissent des nouveaux formulaires mais restent dans les rapports historiques (avec leur nom snapshot).
5. **Verrouillage des périodes** : une fois un rapport soumis pour un mois, il est impossible d'ajouter des contributions pour cette période.

---

**Version : 1.0.0 — MVP**  
**Date : Novembre 2026**
