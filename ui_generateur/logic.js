// Variables pour stocker les données de migration
let ancienneBox = "";
let nouvelleBox = "";
let navigateurChoisi = "";

// Variables globales pour les codes des Bookmarklets
let codeExtractBookmarklet = ""; 
let codeApplyBookmarklet = "";

const LOCAL_BASE_URL = "http://127.0.0.1:5500"; 

// --- GÉNERATEURS DE BOOKMARKLETS (Architecture Loader - LOCAL) ---
function genererCodeExtraction(boxAncienne) {
    let dossierBox = boxAncienne.includes('4') ? 'box4' : 'box3'; 
    return `javascript:(function(){var d=document,s=d.createElement('script');s.src='${LOCAL_BASE_URL}/extraction/${dossierBox}/extract_main.js?v='+Date.now();d.head.appendChild(s);})();`;
}

function genererCodeApplication(boxNouvelle) {
    let dossierBox = boxNouvelle.includes('7') ? 'box7' : (boxNouvelle.includes('6') ? 'box6' : 'box5');
    return `javascript:(function(){var d=document,s=d.createElement('script');s.src='${LOCAL_BASE_URL}/push/${dossierBox}/push_main.js?v='+Date.now();d.head.appendChild(s);})();`;
}

// Fonction pour créer l'effet d'ondulation (Ripple effect) lors du clic
function createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement("span");
    ripple.classList.add("ripple");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    const rect = button.getBoundingClientRect();
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - rect.left - radius}px`;
    ripple.style.top = `${event.clientY - rect.top - radius}px`;
    const existingRipple = button.querySelector(".ripple");
    if (existingRipple) existingRipple.remove();
    button.appendChild(ripple);
}

// Fonction pour enlever la classe 'choisi'
function markedAsSelected(stepId) {
    const conteneur = document.getElementById(stepId);
    const boutons = conteneur.querySelectorAll('.bouton-choix');
    boutons.forEach(btn => btn.classList.remove('choisi'));
}

// --- GESTION DES ÉTAPES DU WIZARD ---
function choisirAncienne(event, choix) {
    createRipple(event);
    ancienneBox = choix;
    markedAsSelected('etape1');
    event.currentTarget.classList.add('choisi');
    revealNextStep('etape2');
}

function choisirNouvelle(event, choix) {
    createRipple(event);
    nouvelleBox = choix;
    markedAsSelected('etape2');
    event.currentTarget.classList.add('choisi');
    revealNextStep('etape3');
}

function choisirNavigateur(event, choix) {
    createRipple(event);
    navigateurChoisi = choix;
    markedAsSelected('etape3');
    event.currentTarget.classList.add('choisi');
    triggerFinalView();
}

function revealNextStep(nextStepId) {
    const nextStep = document.getElementById(nextStepId);
    nextStep.classList.remove("masque");
    void nextStep.offsetHeight; 
    nextStep.classList.add("active");
}

// --- GESTION DE LA VUE FINALE ---
function triggerFinalView() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateRecapBar();
    document.body.classList.add('mode-final');
    
    // Génération avec l'URL locale
    codeExtractBookmarklet = genererCodeExtraction(ancienneBox);
    codeApplyBookmarklet = genererCodeApplication(nouvelleBox);
    
    afficherResultat();
    
    const pageInstructions = document.getElementById("pageInstructions");
    pageInstructions.classList.remove("masque");
    setTimeout(() => { pageInstructions.classList.add("active"); }, 10);
}

function updateRecapBar() {
    document.getElementById("recapAncienne").innerText = "Actuelle : " + getSelectedText('etape1');
    document.getElementById("recapNouvelle").innerText = "Nouvelle : " + getSelectedText('etape2');
    document.getElementById("recapNavigateur").innerText = "Nav : " + getSelectedText('etape3');
}

function getSelectedText(stepId) {
    const conteneur = document.getElementById(stepId);
    const boutonChoisi = conteneur.querySelector('.bouton-choix.choisi');
    return boutonChoisi ? boutonChoisi.innerText : "?"; 
}

function resetToInitialView() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.classList.remove('mode-final');
    const pageInstructions = document.getElementById("pageInstructions");
    pageInstructions.classList.remove("active");
    setTimeout(() => { pageInstructions.classList.add("masque"); }, 500); 

    ancienneBox = ""; nouvelleBox = ""; navigateurChoisi = "";
    document.querySelectorAll('.conteneur-question').forEach(cont => {
        cont.classList.add('masque'); 
        cont.classList.remove('active'); 
    });
    ['etape1', 'etape2', 'etape3'].forEach(markedAsSelected);
    revealNextStep('etape1');
}

// --- LOGIQUE DE GÉNÉRATION DES INSTRUCTIONS ---
function afficherResultat() {
    const zoneContent = document.getElementById("contenuInstructions");
    let contenuFinalHTML = "<h2>Instructions Détaillées de Migration</h2>";
    let etapes = [];

    const htmlBookmarklets = MIGRATION_CONTENT.genererBookmarkletsHTML(codeExtractBookmarklet, codeApplyBookmarklet);

    etapes.push({
        titre: MIGRATION_CONTENT.outils.titre,
        desc: MIGRATION_CONTENT.outils.desc,
        htmlExtra: htmlBookmarklets
    });
    etapes.push({
        titre: MIGRATION_CONTENT.sauvegarde.titre,
        desc: MIGRATION_CONTENT.sauvegarde.desc.replace("ancienne box", "<b>" + getSelectedText('etape1') + "</b>")
    });
    etapes.push({
        titre: MIGRATION_CONTENT.changement.titre,
        desc: MIGRATION_CONTENT.changement.desc.replace("nouvelle", "<b>" + getSelectedText('etape2') + "</b>")
    });
    etapes.push({
        titre: MIGRATION_CONTENT.application.titre,
        desc: MIGRATION_CONTENT.application.desc
    });

    let htmlEtapes = '<div id="conteneurEtapes">';
    etapes.forEach((etape, index) => {
        const num = index + 1;
        const classeInitiale = num === 1 ? 'active' : 'masque'; 
        const contenuSupplementaire = etape.htmlExtra ? etape.htmlExtra : ""; 
        htmlEtapes += `
            <div id="instruction-etape-${num}" class="bloc-instruction ${classeInitiale}">
                <div class="contenu-etape">
                    <h3>${etape.titre}</h3>
                    <p>${etape.desc}</p>
                    ${contenuSupplementaire}
                </div>
                <button id="btn-valider-${num}" class="bouton-valider-etape" onclick="validerEtapeInstruction(${num}, ${etapes.length})">Terminer cette étape</button>
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

// --- INITIALISATION ---
window.onload = function() {
    revealNextStep('etape1'); 
};