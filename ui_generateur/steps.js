// Ce fichier contient uniquement les données (textes, étapes) pour la migration.

const MIGRATION_CONTENT = {
    // Les étapes génériques partagées
    outils: {
        titre: "Étape 1 : Installation des outils",
        desc: "Affichez la barre de favoris de votre navigateur (Ctrl+Maj+B ou Cmd+Maj+B). Glissez les deux modules ci-dessous vers cette barre :"
    },
    sauvegarde: {
        titre: "Étape 2 : Sauvegarde de l'ancienne box",
        desc: "Connectez-vous à l'interface de votre ancienne box. Cliquez sur le favori <b>⚙️ Module Extraction</b> que vous venez d'installer pour lire et sauvegarder vos paramètres."
    },
    changement: {
        titre: "Étape 3 : Changement de matériel",
        desc: "Débranchez l'ancienne box et installez la nouvelle à la place. Attendez que la connexion soit établie."
    },
    application: {
        titre: "Étape 4 : Application sur la nouvelle box",
        desc: "Connectez-vous à la nouvelle interface (192.168.1.1). Cliquez sur le favori <b>🚀 Module Application</b> pour transférer et valider automatiquement vos paramètres."
    },
    
    // Fonction pour générer le bloc HTML des Bookmarklets
    genererBookmarkletsHTML: function(codeExtract, codeApply) {
        return `
            <div class="conteneur-bookmarklet" style="display: flex; gap: 15px; justify-content: center; margin-top: 15px;">
                <a href="${codeExtract}" class="bouton-bookmarklet" title="Glissez-moi vers la barre de favoris" draggable="true">⚙️ Module Extraction</a>
                <a href="${codeApply}" class="bouton-bookmarklet" title="Glissez-moi vers la barre de favoris" draggable="true">🚀 Module Application</a>
            </div>
            <p class="instruction-glisser" style="text-align: center;">Astuce : Cliquez et glissez ces boutons vers la barre de favoris de votre navigateur.</p>
        `;
    }
};