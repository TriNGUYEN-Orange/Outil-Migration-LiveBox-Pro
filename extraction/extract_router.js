/* --- /extraction/extract_router.js --- */

(async function() {
    console.warn("=================================================");
    console.warn("ROUTEUR EXTRACTION : Detection de la Livebox...");
    console.warn("=================================================");

    /* 1. Nettoyage des scripts precedents pour eviter les conflits SPA */
    let anciensScripts = document.querySelectorAll("script[src*='extract_main.js']");
    anciensScripts.forEach(script => script.remove());

    /* Fonction utilitaire pour laisser le temps au DOM de se construire */
    const attendre = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await attendre(1500);

    let boxDetectee = "box4"; /* Valeur par defaut */
    let estBox4 = false;
    let estBox3 = false;

    /* --- LOGIQUE DE DETECTION BOX 4 (MODERNE) --- */
    
    /* Critere 1 : Presence du widget de login (fourni par l'utilisateur) */
    /* On utilise *= sur la classe pour eviter que ca casse si Orange modifie le hash GIB5... */
    let loginModerne = document.querySelector("#authentification_widget div[class*='AuthenticationWidgetCss-inner']") || document.querySelector("#authentification_widget");
    
    /* Critere 2 : Presence de l'icone Internet sur l'accueil moderne */
    let accueilModerne = document.querySelector("#homepage_myservices_iconInternet_image");

    if (loginModerne || accueilModerne) {
        estBox4 = true;
    }

    /* --- LOGIQUE DE DETECTION BOX 3 (ANCIENNE) --- */
    if (!estBox4) {
        /* On ne se fie plus a #gwtActivityPanel. Le menu gauche est exclusif a l'ancienne box */
        if (document.querySelector("#gwtLeftMenuBar")) {
            estBox3 = true;
        } else {
            let selects = document.querySelectorAll("select.gwt-ListBox, select[class*='HeaderCss-hwModeCb']");
            for (let s of selects) {
                let texteOptions = (s.innerText || "").toLowerCase();
                if (texteOptions.includes("expert") || texteOptions.includes("standard") || texteOptions.includes("avance")) {
                    estBox3 = true;
                    break;
                }
            }
        }
    }

    if (estBox4) {
        boxDetectee = "box4"; /* Dossier box4 pour Box 4 ET Box 3 IHM moderne */
        console.warn("Livebox Moderne (Box 4 ou Box 3 avec IHM recente) detectee avec certitude !");
    } else if (estBox3) {
        boxDetectee = "box3"; /* Dossier box3 pour l'ancienne IHM */
        console.warn("Ancienne Livebox 3 Pro detectee !");
    } else {
        console.warn("Aucun marqueur specifique trouve, essai par defaut sur Livebox Moderne...");
    }

    /* --- CHARGEMENT DU SCRIPT PRINCIPAL CORRESPONDANT --- */
    let scriptCible = "";
    let baseUrl = "";

    /* Deduire l'URL de base dynamique a partir de l'emplacement de ce routeur */
    if (document.currentScript && document.currentScript.src) {
        baseUrl = document.currentScript.src.substring(0, document.currentScript.src.lastIndexOf('/'));
    } else {
        let scripts = document.getElementsByTagName("script");
        for (let s of scripts) {
            if (s.src && s.src.includes("extract_router.js")) {
                baseUrl = s.src.substring(0, s.src.lastIndexOf('/'));
                break;
            }
        }
    }

    /* Fallback local si introuvable */
    if (!baseUrl) {
        baseUrl = "http://127.0.0.1:5500/extraction"; 
    }

    scriptCible = baseUrl + "/" + boxDetectee + "/extract_main.js?v=" + Date.now();

    console.warn("Chargement du module principal : " + scriptCible);

    let scriptElement = document.createElement('script');
    scriptElement.src = scriptCible;
    scriptElement.onload = () => console.warn("Module principal charge avec succes.");
    scriptElement.onerror = () => console.error("Echec du chargement du module principal.");
    document.head.appendChild(scriptElement);
})();