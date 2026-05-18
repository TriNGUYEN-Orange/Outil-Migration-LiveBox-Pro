# Outil Migration Livebox Pro

## Introduction
Ce projet est un outil d'automatisation (sous forme de Bookmarklet / JavaScript injecté directement dans le navigateur) permettant d'extraire (Extraction) la configuration des routeurs Orange Livebox Pro. Toutes les données extraites sont automatiquement sauvegardées dans un fichier JSON (`livebox_migration_config.json`).

L'objectif principal est d'aider les techniciens à sauvegarder rapidement l'ancienne configuration (WiFi, DHCP, NAT/PAT, VPN, DMZ...) afin de préparer la migration vers une nouvelle Livebox.

**Modèles de Livebox supportés :**
* **Box 3 bis** (Ancienne interface GWT) - Terminé
* **Box 3 moderne / Box 4** (Interface SPA commune) - Terminé
* **Box 6 / Box 7** - En développement

---

## Architecture du projet

Le projet est organisé en modules pour faciliter la maintenance :

```text
Outil-Migration-LiveBox-Pro
 ┣ extraction/
 ┃ ┣ extract_router.js       <-- (Point d'entrée) Détecte automatiquement le modèle de la Box
 ┃ ┣ extract_utils.js        <-- Fonctions partagées (clics, attente DOM, lecture de tableaux...)
 ┃ ┣ extract_ui.js           <-- Interface utilisateur (Barre de progression, Pop-ups)
 ┃ ┣ extract_fin.js          <-- Génère le fichier JSON et force le téléchargement
 ┃ ┣ box3bis/                <-- Code d'extraction spécifique à l'ancienne Box 3
 ┃ ┃ ┣ extract_main.js       <-- Orchestrateur : lance les modules séquentiellement
 ┃ ┃ ┣ extract_wifi.js       <-- Module WiFi
 ┃ ┃ ┗ ...
 ┃ ┣ box4/                   <-- Code d'extraction pour la Box 4 et Box 3 moderne
 ┃ ┃ ┣ extract_main.js
 ┃ ┃ ┗ ...
 ┣ outil/
 ┃ ┗ verification.js         <-- Vérification de l'environnement (IP, Login, bon outil...)
 ┗ NOTES                     <-- Prises de notes et codes secrets du projet
```

---

## Fonctionnement (Workflow)

L'outil fonctionne entièrement côté client (Frontend) via la technique de Web Scraping (lecture du DOM).

1. **Routage :** L'exécution commence par `extract_router.js` qui analyse le HTML pour identifier la Box actuelle.
2. **Chargement :** Le routeur charge le `extract_main.js` correspondant, en nettoyant les anciens scripts si nécessaire (architecture SPA).
3. **Vérification :** `verification.js` s'assure que l'utilisateur est bien sur `192.168.1.1` et authentifié.
4. **Exécution séquentielle :** L'orchestrateur lance chaque module métier l'un après l'autre. L'état est conservé dans le `localStorage`.
5. **Rattrapage (Failover) :** Si un module échoue (ex: latence réseau), le système effectue jusqu'à 2 tentatives de rattrapage en rechargeant la page.
6. **Finalisation :** `extract_fin.js` regroupe les données du `localStorage` en un fichier `.json` et déclenche son téléchargement.

---

## Guide de Maintenance et de Mise à jour

L'interface des Livebox étant amenée à évoluer, les sélecteurs CSS peuvent se casser au fil du temps. 
Un guide complet a été rédigé pour vous expliquer comment réparer facilement le code à l'aide de l'Intelligence Artificielle.

👉 **[Consulter le Guide de Maintenance (MAINTENANCE.md)](MAINTENANCE.md)**
