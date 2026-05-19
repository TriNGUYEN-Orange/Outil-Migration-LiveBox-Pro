/* --- /box3/extract_accueil.js --- */

window.extraireAccueilBox3 = async function(estRattrapage = false) {
    const { simulerClic, attendrePause } = window;

    console.warn("[1/x] Preparation de la page Accueil (Box 3)...");

    if (estRattrapage) {
        console.warn("Mode tentative active : Rechargement de l'accueil...");
        simulerClic("#menu_home_hyperlink");
        await window.attendrePause(1500);
    }

    /* ========================================================================= */
    /* 0. VERIFICATION DE LA CONNEXION INTERNET                                  */
    /* ========================================================================= */
    console.warn("Verification de la connexion Internet en cours...");
    let estConnecte = false;
    
    /* Boucle d'attente dynamique (30 secondes maximum) */
    for (let i = 0; i < 60; i++) {
        let blocs = document.querySelectorAll(".homeRight .home-block.content div");
        
        for (let bloc of blocs) {
            let texte = (bloc.innerText || "").toLowerCase();
            /* On cherche la phrase indiquant que la box est en ligne */
            if (texte.includes("connectée à internet depuis") || texte.includes("connectee a internet depuis")) {
                estConnecte = true;
                break;
            }
        }
        
        if (estConnecte) {
            break;
        }
        await attendrePause(500);
    }

    if (!estConnecte) {
        console.error("Erreur fatale : La Livebox ne semble pas etre connectee a Internet. Arret.");
        return; /* Arret immediat du script si aucune connexion n'est detectee */
    }
    
    console.warn("Succes : Connexion Internet confirmee. Suite du processus...");

    /* ========================================================================= */
    /* 1. SELECTION DU MODE AVANCE (EXPERT)                                      */
    /* ========================================================================= */
    console.warn("Verification du mode d'affichage...");
    
    let selects = document.querySelectorAll("select.gwt-ListBox");
    let selectMode = null;
    
    /* Recherche du menu deroulant contenant l'option expert */
    for (let s of selects) {
        if (s.querySelector("option[value='expert']")) {
            selectMode = s;
            break;
        }
    }

    if (selectMode) {
        if (selectMode.value !== "expert") {
            console.warn("Passage en mode avance (expert)...");
            selectMode.value = "expert";
            selectMode.dispatchEvent(new Event('change', { bubbles: true }));
            
            /* Attendre que GWT rafraichisse la page en arriere-plan */
            await attendrePause(2000); 
        } else {
            console.warn("Le mode avance est deja selectionne.");
        }
    } else {
        console.warn("Selecteur de mode introuvable.");
    }

    /* ========================================================================= */
    /* 2. VERIFICATION INTELLIGENTE DU BLOC (SANS NTH-CHILD)                     */
    /* ========================================================================= */
    console.warn("Recherche du bloc cible (Module WiFi)...");

    let blocCible = null;
    
    /* Boucle d'attente dynamique pour trouver le bloc par son contenu */
    for (let i = 0; i < 20; i++) { 
        let blocs = document.querySelectorAll(".homeRight .home-block");
        
        for (let bloc of blocs) {
            let titre = bloc.querySelector(".blockTitle1");
            /* Identifier le bloc de maniere robuste via son texte */
            if (titre && (titre.innerText || "").toLowerCase().includes("wifi")) {
                blocCible = bloc;
                break;
            }
        }
        
        if (blocCible) break;
        await attendrePause(500);
    }

    if (blocCible) {
        let ariaHidden = blocCible.getAttribute("aria-hidden");
        
        if (ariaHidden === "false" || (!ariaHidden && window.getComputedStyle(blocCible).display !== "none")) {
            console.warn("OK : Bloc cible trouve et bien visible. (Mode avance confirme)");
        } else {
            console.warn("OK : Bloc trouve, mais il est masque (aria-hidden=true).");
        }
    } else {
        console.error("ERREUR : Le bloc cible est introuvable dans le DOM.");
    }

    console.warn("Etape d'accueil terminee (sans extraction des donnees).");
};