# GUIDE DE MAINTENANCE ET DE MISE À JOUR

Ce document est destiné aux développeurs prenant le relais sur le projet. 
Lorsqu'Orange met à jour le firmware ou l'interface (IHM) de la Livebox, les sélecteurs (selectors) HTML ou la structure DOM peuvent changer. Cela provoque des erreurs `Introuvable` ou empêche les clics automatiques lors de l'extraction.

La procédure de correction est extrêmement simple en suivant ces 3 étapes.

---

### ÉTAPE 1 : IDENTIFIER LE FICHIER À MODIFIER
En vous basant sur la barre de progression à l'écran ou l'erreur affichée dans la `Console (F12)`, trouvez le fichier correspondant au module en échec :

* **Ancienne interface (Login à droite) :** Dossier `/extraction/box3bis/`
* **Interface moderne (Box 4 / Box 3 récente) :** Dossier `/extraction/box4/`

*Exemples de fichiers :* `extract_wifi.js`, `extract_natpat.js`, `extract_vpn_nomade.js`, etc.

---

### ÉTAPE 2 : RÉCUPÉRER LES INFORMATIONS DE LA NOUVELLE IHM
1. Ouvrez l'interface de la Livebox Pro manuellement et naviguez jusqu'à la page qui pose problème.
2. Appuyez sur `F12` -> Allez dans l'onglet **Elements**.
3. Utilisez l'outil d'inspection du navigateur pour cibler la balise HTML (input, select, div, bouton) contenant la donnée manquante.
4. Prenez **une capture d'écran** de cette zone (en incluant impérativement l'arborescence DOM visible dans l'onglet Elements).
5. *Astuce :* Faites un clic droit sur la balise HTML -> **Copy** -> **Copy selector** pour obtenir le chemin exact.

---

### ÉTAPE 3 : UTILISER L'IA POUR METTRE À JOUR LE SÉLECTEUR
Ouvrez Gemini, ChatGPT, ou Claude, et collez le Prompt ci-dessous en y joignant l'ancien code source et votre capture d'écran :

> **MODÈLE DE PROMPT POUR L'IA (À COPIER/COLLER) :**
> "Voici l'ancien fichier JavaScript utilisé pour extraire la configuration de la Livebox Pro : `[Collez_Ou_Joignez_Le_Fichier_.js_Ici]`.
> Orange vient de mettre à jour l'interface (IHM). Je te joins une capture d'écran de la nouvelle interface ainsi que le code DOM actuel.
> Peux-tu trouver ce qui a changé et mettre à jour les selectors (dans la fonction `lireChampGWT` ou `document.querySelector`) pour qu'ils correspondent à la nouvelle interface ?
> Règle stricte : Garde la logique et la structure de l'ancienne fonction intactes, modifie uniquement les chaînes de caractères des selectors erronés."

---

### RÈGLE D'OR POUR LES SÉLECTEURS (LES PIÈGES DE GWT)
L'interface d'Orange utilise le framework Google Web Toolkit (GWT), qui génère des classes avec des chaînes de hachage dynamiques (dynamic hash) (Par exemple : `GHIUE4XBJM-fr-orange...`). 

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
