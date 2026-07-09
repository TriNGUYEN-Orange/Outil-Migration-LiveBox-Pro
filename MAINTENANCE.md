# GUIDE DE MAINTENANCE ET DE MISE À JOUR

**!!! Attention !!** : le code deployé est dans la branche **main**. 
Il faut donc changer le code dans **main** pour la mise à jour, maintenane,...

Ce document est destiné aux développeurs prenant le relais sur le projet. 
Lorsqu'Orange met à jour le firmware ou l'interface (IHM) de la Livebox, les sélecteurs (selectors) HTML ou la structure DOM peuvent changer. Cela provoque des erreurs `Introuvable` ou empêche les clics automatiques lors de l'extraction.

La procédure de correction est extrêmement simple en suivant ces 3 étapes.

---

### ÉTAPE 1 : IDENTIFIER LE FICHIER À MODIFIER
En vous basant sur la barre de progression à l'écran ou l'erreur affichée dans la `Bilan technique (Box 6, Box 77)`, trouvez le fichier correspondant au module en échec.

*Exemples de fichiers :* `extract_wifi.js`, `extract_natpat.js`, `extract_vpn_nomade.js`, etc.

---

### ÉTAPE 2 : RÉCUPÉRER LES INFORMATIONS DE LA NOUVELLE IHM
1. Ouvrez l'interface de la Livebox Pro manuellement et naviguez jusqu'à la page qui pose problème.
2. Appuyez sur `F12` -> Allez dans l'onglet **Elements**.
3. Utilisez **l'outil d'inspection du navigateur** (ctrl + shift + c) pour cibler la balise HTML (input, select, div, bouton) contenant la donnée manquante.
4. Prenez **une capture d'écran** de cette zone (en incluant impérativement l'arborescence DOM visible dans l'onglet Elements).
5. *Astuce :* Faites un clic droit sur la balise HTML -> **Copy** -> **Copy selector** pour obtenir le chemin exact.

---

### ÉTAPE 3 : UTILISER L'IA POUR METTRE À JOUR LES SÉLECTEURS (VERSION ROBUSTE)

Copiez/collez **exactement** le prompt ci-dessous dans Gemini / ChatGPT / Claude, puis joignez :
1. le fichier `.js` concerné (version actuelle),
2. une capture DevTools (onglet **Elements** avec DOM visible),
3. si possible le `outerHTML` du bloc concerné.

> **PROMPT IA PRÊT À L’EMPLOI (COPIER/COLLER)**
>
> Tu es un expert JavaScript/DOM en maintenance corrective.
> 
> Je te fournis :
> - un fichier JS d’extraction Livebox Pro,
> - une capture de la nouvelle IHM Orange,
> - éventuellement un extrait DOM (`outerHTML`).
>
> ## Objectif
> Corriger uniquement les sélecteurs cassés pour rétablir l’extraction.
>
> ## Contraintes strictes (obligatoires)
> 1. **Ne pas modifier la logique métier** (ordre des étapes, conditions, structure des fonctions).
> 2. **Ne pas renommer les fonctions/variables** existantes.
> 3. **Ne pas changer la structure JSON de sortie**.
> 4. **Ne modifier que** :
>    - chaînes de sélecteurs (`querySelector`, `querySelectorAll`, `lireChampGWT`, etc.),
>    - fallback selectors (ancien + nouveau),
>    - timeout/retry uniquement si nécessaire et minimal.
> 5. Si un bloc est optionnel et introuvable, **ne pas bloquer tout le script** (préférer `console.warn` à `throw` uniquement pour ce bloc optionnel).
> 6. Conserver la compatibilité avec l’ancienne IHM si possible (fallback).
>
> ## Format de réponse attendu (obligatoire)
> Réponds en 4 sections :
>
> ### 1) Diagnostic
> - Liste précise des sélecteurs obsolètes détectés.
> - Explication courte de la cause (ID changé, structure DOM déplacée, iframe, etc.).
>
> ### 2) Patch minimal (diff)
> - Fournis un **diff unifié** (avant/après) ou blocs “REMPLACER PAR”.
> - Ne montrer **que les lignes modifiées**.
>
> ### 3) Code final prêt à coller
> - Redonne la **fonction complète corrigée** (pas tout le projet), directement copiable.
> - Garantis qu’il n’y a **aucune erreur de syntaxe**.
>
> ### 4) Plan de validation
> - Étapes de test manuel (console + UI).
> - Résultat attendu.
> - Cas de repli si un élément reste introuvable.
>
> ## Vérifications automatiques à faire avant de répondre
> - Vérifier parenthèses/accolades/points-virgules.
> - Vérifier que chaque sélecteur proposé existe dans le DOM fourni.
> - Vérifier qu’aucune autre partie non demandée n’a été modifiée.
> - Vérifier que la fonction reste exécutable telle quelle.
>
> Si une information manque, pose des questions **très ciblées** (max 3), sinon fais la meilleure correction possible avec hypothèses explicites.


---

### RÈGLE D'OR POUR LES SÉLECTEURS (LES PIÈGES DE GWT)
L'interface admin utilise le framework Google Web Toolkit (GWT), qui génère des classes avec des chaînes de hachage dynamiques (dynamic hash) (Par exemple : `GHIUE4XBJM-fr-orange...`). 

Pour que votre code survive aux futurs redémarrages de la Box ou aux mises à jour mineures, **ne figez jamais un hash**.

**1. Privilégiez l'attribut `title` (le plus fiable) :**
```javascript
/* MAUVAIS : Cassera au prochain changement de hash */
let input = document.querySelector(".GHIUE4XBJM-fr-orange-livebox-input");

/* BON : Indestructible face aux mises a jour du firmware */
let input = document.querySelector("input[title*='nom de la connexion']");
```

**2. Utilisez le filtre 'contient' (`*=`) si vous devez cibler une classe :**
```javascript
/* BON : Cherche les div dont la classe contient 'formLayout', en ignorant le hash genere devant */
let box = document.querySelectorAll("div[class*='formLayout']");
```

---

### COMMENT AJOUTER UN NOUVEAU MODULE ?
Si vous devez extraire une nouvelle page (ex: VoIP) :
1. Créez un nouveau fichier `extract_voip.js` dans le dossier de la Box concernée.
2. Utilisez `window.simulerClic` ou changez `window.location.hash` pour naviguer.
3. Attendez le chargement avec `await attendreElement(...)` ou `await attendreStabiliteDOM(...)`.
4. Extrayez les données et sauvegardez-les dans l'objet global `configLivebox`.
5. Ajoutez le nom de votre fichier dans le tableau `modulesBox...` à la fin de `extract_main.js`.
6. Appelez votre fonction via `await executerModuleNormal(...)` dans le flux principal.
