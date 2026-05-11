const LOCAL_BASE_URL = "http://127.0.0.1:5500"; 

/* --- GENERATEURS DE BOOKMARKLETS (Architecture Routeur) --- */
/* Les bookmarklets pointent desormais vers les fichiers routeurs globaux */
function genererCodeExtraction() {
    return `javascript:(function(){var d=document,s=d.createElement('script');s.src='${LOCAL_BASE_URL}/extraction/extract_router.js?v='+Date.now();d.head.appendChild(s);})();`;
}

function genererCodeApplication() {
    return `javascript:(function(){var d=document,s=d.createElement('script');s.src='${LOCAL_BASE_URL}/push/push_router.js?v='+Date.now();d.head.appendChild(s);})();`;
}

/* --- LOGIQUE DE GENERATION DES INSTRUCTIONS --- */
function afficherResultat() {
    const zoneContent = document.getElementById("contenuInstructions");
    let contenuFinalHTML = "<h2>Instructions Détaillées de Migration</h2>";
    let etapes = [];

    const codeExtract = genererCodeExtraction();
    const codeApply = genererCodeApplication();
    const htmlBookmarklets = MIGRATION_CONTENT.genererBookmarkletsHTML(codeExtract, codeApply);

    etapes.push({ titre: MIGRATION_CONTENT.outils.titre, desc: MIGRATION_CONTENT.outils.desc, htmlExtra: htmlBookmarklets });
    etapes.push({ titre: MIGRATION_CONTENT.sauvegarde.titre, desc: MIGRATION_CONTENT.sauvegarde.desc });
    etapes.push({ titre: MIGRATION_CONTENT.changement.titre, desc: MIGRATION_CONTENT.changement.desc });
    etapes.push({ titre: MIGRATION_CONTENT.application.titre, desc: MIGRATION_CONTENT.application.desc });

    let htmlEtapes = '<div id="conteneurEtapes">';
    etapes.forEach((etape, index) => {
        const num = index + 1;
        const classeInitiale = num === 1 ? 'active' : 'masque'; 
        const contenuSupplementaire = etape.htmlExtra ? etape.htmlExtra : ""; 
        
        let codeHtmlFlecheGuide = '';
        if (num === 1) {
            codeHtmlFlecheGuide = `
                <div class="lm-next-hint">
                    <span class="lm-hint-text">Cliquer pour continuer</span>
                    <span class="lm-hint-arrow">➔</span>
                </div>
            `;
        }

        htmlEtapes += `
            <div id="instruction-etape-${num}" class="bloc-instruction ${classeInitiale}">
                <div class="contenu-etape">
                    <h3>${etape.titre}</h3>
                    <p>${etape.desc}</p>
                    ${contenuSupplementaire}
                </div>
                
                <div class="lm-actions-wrapper">
                    ${codeHtmlFlecheGuide}
                    <button id="btn-valider-${num}" class="bouton-valider-etape" onclick="validerEtapeInstruction(${num}, ${etapes.length})">Terminer cette étape</button>
                </div>
            </div>
        `;
    });
    htmlEtapes += '</div>';
    zoneContent.innerHTML = contenuFinalHTML + htmlEtapes;

    /* FIX FIREFOX : Rendre les boutons glissables */
    setTimeout(() => {
        zoneContent.querySelectorAll("button[onclick^='javascript:'], a[href^='javascript:']").forEach(el => {
            el.setAttribute("draggable", "true");
            el.style.cursor = "grab";
        });
    }, 50);
}

function validerEtapeInstruction(numEtape, totalEtapes) {
    const etapeActuelle = document.getElementById(`instruction-etape-${numEtape}`);
    etapeActuelle.classList.add('terminee');
    const btnActuel = document.getElementById(`btn-valider-${numEtape}`);
    btnActuel.innerText = "✓ Terminé";
    btnActuel.disabled = true;

    if (numEtape < totalEtapes) {
        const etapeSuivante = document.getElementById(`instruction-etape-${numEtape + 1}`);
        etapeSuivante.classList.remove('masque');
        setTimeout(() => {
            etapeSuivante.classList.add('active');
            etapeSuivante.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
    } else {
        const zoneContent = document.getElementById("contenuInstructions");
        const messageFin = document.createElement('div');
        messageFin.innerHTML = "<h3 style='color: #4caf50; text-align: center; margin-top: 40px; opacity: 0; transform: scale(0.8); transition: all 0.5s ease;' id='message-felicitations'>🎉 Migration terminée avec succès !</h3>";
        zoneContent.appendChild(messageFin);
        setTimeout(() => {
            const message = document.getElementById('message-felicitations');
            message.style.opacity = '1';
            message.style.transform = 'scale(1)';
            messageFin.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
    }
}

/* Affichage immediat au chargement */
window.onload = function() {
    afficherResultat();
};