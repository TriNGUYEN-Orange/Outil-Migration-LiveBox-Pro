# 🚀 Outil de Migration LiveBox Pro

Bienvenue sur l'**Outil de Migration LiveBox Pro** ! Ce projet a été conçu pour automatiser, simplifier la migration des paramètres de configuration entre une ancienne Livebox Pro (v3, v4) et une nouvelle (v6, v7).

Grâce à un système de **Bookmarklet** (favori intelligent) exécuté directement dans le navigateur, l'outil injecte vos configurations de manière transparente, sans nécessiter l'installation de logiciels tiers.

🌐 **Lien direct vers l'outil :** [Outil Migration LiveBox Pro](https://tringuyen-orange.github.io/Outil-Migration-LiveBox-Pro/ui_generateur/index.html)

---

## ✨ Fonctionnalités Principales

- **Automatisation complète :** Injection rapide des paramètres réseau.
- **Support Multi-Modules :**
  - 📡 Réseaux Wi-Fi
  - 🛡️ Pare-feu (Firewall)
  - 🌐 Accès à distance (Identifiants et Ports)
  - 🔑 VPN Nomade (Création d'utilisateurs et de clés)
  - 🏢 VPN Site à Site
  - 📶 Airbox & Routage
- **Sécurité et Interactivité (Push UI) :**
  - Vérification en temps réel des règles de sécurité (mots de passe forts, noms valides).
  - Pop-up interactives pour corriger les données à la volée.
  - Bouclier anti-scroll pour protéger la page pendant l'injection.
- **Rapport de Migration (Bilan) :** Génération automatique d'un tableau récapitulatif des modifications et téléchargement d'un rapport PDF détaillé en fin de processus.

---

## 🛠️ Prérequis

- Un navigateur web moderne (Chrome, Firefox, Edge, Safari).
- L'affichage de la **barre de favoris** activé dans votre navigateur (`Ctrl+Maj+B` ou `Cmd+Maj+B`).
- Accès à l'interface d'administration de la Livebox (généralement `http://192.168.1.1`).

---

## 🚀 Installation & Utilisation

L'outil ne nécessite **aucune installation sur votre ordinateur**. Tout se passe dans le navigateur.

### Étape 1 : Obtenir le Bookmarklet
1. Rendez-vous sur la [page d'accueil de l'outil](https://tringuyen-orange.github.io/Outil-Migration-LiveBox-Pro/).
2. Cliquez, maintenez, et **glissez le bouton orange "🖱️ Migration LiveBox (Glissez-moi)"** vers la barre de favoris de votre navigateur.

### Étape 2 : Lancer la Migration
1. Connectez-vous à l'interface de la **nouvelle Livebox** avec vos identifiants administrateur.
2. Une fois connecté, **cliquez simplement sur le favori** que vous venez d'ajouter.
3. L'outil prend le relais ! Suivez les indications à l'écran et laissez les différents modules configurer votre Box.

### Étape 3 : Bilan
1. À la fin de l'opération, un récapitulatif s'affiche.
2. Cliquez sur **"📄 Télécharger le Rapport (PDF)"** pour conserver une trace des éléments modifiés (mots de passe, logins, etc.).

---

## 📂 Architecture du Projet

Le projet est construit sur une architecture **modulaire, découplée**. Le code n'est injecté dans la Livebox que lorsque cela est strictement nécessaire, ce qui garantit une exécution rapide et sans surcharge de la mémoire.

L'architecture se divise en 3 couches principales :

```text
📁 Outil-Migration-LiveBox-Pro/
│
├── 1️⃣ COUCHE DE PRÉSENTATION (Générateur de Bookmarklet)
│   ├── 📄 index.html              # Interface utilisateur (Wizard interactif & Bouton Drag & Drop)
│   ├── 📄 view.css                # Feuille de style de la landing page
│   ├── 📄 logic.js                # Logique locale : configure dynamiquement l'URL du Bookmarklet
│   └── 📄 steps.js                # Contenu textuel et tutoriel d'utilisation
│
└── 2️⃣ COUCHE D'INJECTION (Hébergée sur GitHub Pages, exécutée sur la Livebox)
    ├── 📁 push/
    │   ├── 📄 push_utils.js       # Boîte à outils globale (Fonctions d'attente DOM, clics sécurisés)
    │   │
    │   └── 📁 box6/               # Implémentation spécifique au firmware Livebox 6 (et +)
    │       │
    │       ├── ⚙️ LE CŒUR (Orchestrateur & UI)
    │       │   ├── push_main.js   # Script Maître : Gère la boucle (DRY), charge les modules actifs et gère l'état global.
    │       │   ├── push_ui.js     # Interface Centralisée : Barre de progression, Pop-ups de validation, Écoute des modifications.
    │       │   └── push_pdf.js    # Moteur de génération : Convertit le bilan final en document PDF téléchargeable.
    │       │
    │       └── 🧩 LES MODULES MÉTIERS (Features)
    │           ├── push_acces_distance.js  # Script autonome : Navigation et remplissage de l'accès à distance.
    │           ├── push_vpn_nomade.js      # Script autonome : Création itérative des utilisateurs VPN.
    │           └── push_vpn_siteasite.js   # Script autonome : Configuration des tunnels IPsec.
