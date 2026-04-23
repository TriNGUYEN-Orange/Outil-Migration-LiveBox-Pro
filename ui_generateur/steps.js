// Ce fichier contient uniquement les données (textes, étapes) pour la migration.

const MIGRATION_CONTENT = {
    // Les étapes génériques partagées
    outils: {
        titre: "Étape 1 : Préparez vos outils 🛠️",
        desc: "Affichez la barre de favoris de votre navigateur en appuyant sur <b>Ctrl+Maj+B</b> (ou <b>Cmd+Maj+B</b> sur Mac).<br><br>👉 <b>Glissez-déposez</b> les deux boutons ci-dessous directement dans cette barre d'outils :"
    },
    sauvegarde: {
        titre: "Étape 2 : Sauvegarde de l'ancienne box 💾",
        desc: `
            <ol style="margin-top: 10px; padding-left: 20px; line-height: 1.6;">
                <li>Ouvrez l'interface de votre ancienne box : <a href="http://192.168.1.1" target="_blank" style="color: #ff7900; font-weight: bold;">http://192.168.1.1</a></li>
                <li>Connectez-vous avec votre mot de passe administrateur.</li>
                <li>Cliquez sur votre nouveau favori <b>⚙️ Module Extraction</b> et laissez l'outil aspirer vos paramètres !</li>
            </ol>
        `
    },
    changement: {
        titre: "Étape 3 : Place au nouveau matériel 🔌",
        desc: `
            <ol style="margin-top: 10px; padding-left: 20px; line-height: 1.6;">
                <li>Débranchez complètement votre ancienne Livebox.</li>
                <li>Installez et allumez votre nouvelle Livebox.</li>
                <li>Patientez jusqu'à ce que les voyants indiquent qu'elle est bien connectée à Internet.</li>
            </ol>
        `
    },
    application: {
        titre: "Étape 4 : Restauration magique ✨",
        desc: `
            <ol style="margin-top: 10px; padding-left: 20px; line-height: 1.6;">
                <li>Allez sur la nouvelle interface : <a href="http://192.168.1.1" target="_blank" style="color: #ff7900; font-weight: bold;">http://192.168.1.1</a> et connectez-vous.</li>
                <li>Cliquez sur votre favori <b>🚀 Module Application</b>.</li>
                <li>Détendez-vous pendant que tous vos paramètres sont restaurés automatiquement !</li>
            </ol>
        `
    },
    
    // Fonction pour générer le bloc HTML des Bookmarklets
    genererBookmarkletsHTML: function(codeExtract, codeApply) {
        return `
            <div class="conteneur-bookmarklet" style="display: flex; gap: 15px; justify-content: center; margin-top: 15px; padding: 20px; background-color: #fff9f0; border-radius: 10px; border: 2px dashed #ff7900;">
                <a href="${codeExtract}" class="bouton-bookmarklet" title="Glissez-moi vers la barre de favoris" draggable="true">⚙️ Module Extraction</a>
                <a href="${codeApply}" class="bouton-bookmarklet" title="Glissez-moi vers la barre de favoris" draggable="true">🚀 Module Application</a>
            </div>
            <p class="instruction-glisser" style="text-align: center; color: #ff7900; font-weight: bold; margin-top: 15px;">
                ↑ Cliquez, maintenez enfoncé et glissez ces boutons vers votre barre de favoris ↑
            </p>
        `;
    }
};