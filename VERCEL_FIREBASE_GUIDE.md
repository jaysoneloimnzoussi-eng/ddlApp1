# Guide Officiel : Liaison Vercel ⚡ Google Firebase & Firestore
## Direction Départementale des Loisirs de Pointe-Noire (DDL-PN)

Ce document détaille les deux étapes indispensables pour lier votre déploiement **Vercel** avec le backend **Google Firebase / Firestore** de l'application.

---

### Résumé de votre Configuration Firebase Active

| Paramètre | Valeur |
|---|---|
| **Projet Firebase (GCP)** | `gen-lang-client-0446306316` |
| **Base Firestore Dédiée** | `ai-studio-ddlpnsovereignen-f4fe3879-a1e8-417a-81fb-f966d65f82fd` |
| **Auth Domain** | `gen-lang-client-0446306316.firebaseapp.com` |
| **Storage Bucket** | `gen-lang-client-0446306316.firebasestorage.app` |

---

### Étape 1 : Autoriser votre Domaine Vercel dans Firebase (Obligatoire pour Google Auth)

Google exige que tout domaine web exécutant l'application soit déclaré dans les paramètres de sécurité Firebase :

1. Rendez-vous sur la console Firebase du projet :
   👉 **[Paramètres d'Authentification Firebase](https://console.firebase.google.com/project/gen-lang-client-0446306316/authentication/settings)**
2. Dans le menu, descendez jusqu'à la section **Domaines autorisés (Authorized domains)**.
3. Cliquez sur **Ajouter un domaine (Add domain)**.
4. Renseignez votre sous-domaine Vercel :
   - Exemple : `votre-app-ddl-pn.vercel.app`
   - *(Si vous utilisez un domaine personnalisé, ajoutez également `votre-domaine.cg`)*.
5. Cliquez sur **Enregistrer**.

> 💡 **Astuce intégrée :** Dans l'application, cliquez sur le bouton **`▲ 🔥 Vercel ⚡ Firebase`** dans l'en-tête en haut à droite pour copier automatiquement votre nom d'hôte actuel en 1 clic.

---

### Étape 2 : Variables d'Environnement sur Vercel (Recommandé)

Le code contient déjà `firebase-applet-config.json` qui fonctionne par défaut.  
Pour sécuriser et personnaliser votre instance sur Vercel :

1. Ouvrez votre projet sur [Vercel Dashboard](https://vercel.com/dashboard).
2. Allez dans **Settings** > **Environment Variables**.
3. Ajoutez les variables suivantes (disponibles également dans `.env.example`) :

```env
VITE_FIREBASE_API_KEY=AIzaSyBCtCUx01YDAiRyUTWre-cxme_tXY3C6DU
VITE_FIREBASE_PROJECT_ID=gen-lang-client-0446306316
VITE_FIREBASE_APP_ID=1:616288262136:web:008fb6f2d82fe741c2280d
VITE_FIREBASE_AUTH_DOMAIN=gen-lang-client-0446306316.firebaseapp.com
VITE_FIREBASE_FIRESTORE_DATABASE_ID=ai-studio-ddlpnsovereignen-f4fe3879-a1e8-417a-81fb-f966d65f82fd
VITE_FIREBASE_STORAGE_BUCKET=gen-lang-client-0446306316.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=616288262136
```

4. Cliquez sur **Save** et redéployez (ou laissez Vercel déployer automatiquement le commit).

---

### Étape 3 : Configuration Vercel (`vercel.json`)

Le fichier `vercel.json` est déjà configuré avec :
- Redirection SPA client (`rewrites: /(.*) -> /index.html`)
- Politique d'ouverture de popups Google : `Cross-Origin-Opener-Policy: same-origin-allow-popups` pour permettre l'authentification Google via popup sans blocage navigateur.

---

### Vérification & Diagnostic

Depuis l'application déployée sur Vercel :
- Cliquez sur **`▲ 🔥 Vercel ⚡ Firebase`** dans l'en-tête.
- Allez dans l'onglet **3. Test & Statut Firestore**.
- Cliquez sur **Lancer un Test de Connexion Firestore** : un test réel est immédiatement exécuté contre la base de données.
