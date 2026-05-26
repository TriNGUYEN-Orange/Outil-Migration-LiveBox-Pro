# Outil Migration Livebox Pro

lien site : https://tringuyen-orange.github.io/Outil-Migration-LiveBox-Pro/ui_generateur/index.html

## Introduction
Ce projet est un outil d'automatisation (sous forme de Bookmarklet / JavaScript injecté directement dans le navigateur) permettant d'extraire "Extraction" la configuration des Livebox Pro v3 v4. Toutes les données extraites sont automatiquement sauvegardées dans un fichier JSON (`livebox_migration_config.json`). Ensuite avec "Application", les données sont chargées dans la nouvelle box Livebox Pro 6, W7.

L'objectif principal est d'aider les techniciens à sauvegarder rapidement l'ancienne configuration afin de préparer la migration vers une nouvelle Livebox.

**Modèles de Livebox Pro supportés :**
* **Pro v3 / v4** : Wifi, Routage, VPN(site à site, nomade), Pare-feu, Airbox, Accès à distance, DHCP, DynDNS, NAT/PAT, DMZ
* **Pro 6 / W7** : Wifi, Routage, VPN(site à site, nomade), Pare-feu, Airbox, Accès à distance

---

## Fonctionnement (Workflow)

L'outil fonctionne entièrement côté client (Frontend) via la technique de Web Scraping (lecture du DOM).

1. **Routage :** L'exécution commence par `extract_router.js` qui analyse l'interface pour identifier la Box actuelle.
2. **Chargement :** Le routeur charge le `extract_main.js` correspondant.
3. **Vérification :** `verification.js` s'assure que l'utilisateur est bien sur `192.168.1.1` et authentifié.
4. **Exécution séquentielle :** L'orchestrateur lance chaque module métier l'un après l'autre. L'état est conservé dans le `localStorage`.
5. **Rattrapage (en cours développement)** Si un module échoue de côté d'extraction, le système effectue jusqu'à 2 tentatives de rattrapage en rechargeant la page.
6. **Finalisation :** `extract_fin.js` regroupe les données du `localStorage` en un fichier `.json` et déclenche son téléchargement.

---

## Guide de Maintenance et de Mise à jour

L'interface des Livebox Pro 6, 77 est toujours en cours de développement, il faut donc modifier l'outil s'il y a un changement de côté Sagemcom.

👉 **[Consulter le Guide de Maintenance (MAINTENANCE.md)](MAINTENANCE.md)**
