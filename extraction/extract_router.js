/* --- /extraction/extract_router.js --- */

(async function() {
    console.warn("=================================================");
    console.warn("ROUTEUR EXTRACTION : Detection de la Livebox...");
    console.warn("=================================================");

    /* Fonction utilitaire pour laisser le temps au DOM de se construire */
    const attendre = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await attendre(1500);

    let boxDetectee = "box4"; /* Par defaut, on suppose que c'est une Box 4 */

    /* --- LOGIQUE DE DETECTION BOX 3 --- */
    /* On cherche le menu deroulant du mode d'affichage specifique a la Box 3 */
    let selects = document.querySelectorAll("select.gwt-ListBox, select[class*='HeaderCss-hwModeCb']");
    let estBox3 = false;

    for (let s of selects) {
        let texteOptions = (s.innerText || "").toLowerCase();
        if (texteOptions.includes("expert") || texteOptions.includes("standard") || texteOptions.includes("avance")) {
            estBox3 = true;
            break;
        }
    }

    /* Securite supplementaire : presence de la div principale GWT */
    if (!estBox3 && document.querySelector("#gwtActivityPanel")) {
        estBox3 = true;
    }

    if (estBox3) {
        boxDetectee = "box3";
        console.warn("Livebox 3 Pro detectee !");
    } else {
        console.warn("Livebox 4 Pro (ou interface moderne) detectee !");
    }

    /* --- CHARGEMENT DU SCRIPT PRINCIPAL CORRESPONDANT --- */
    let scriptCible = "";
    let baseUrl = "";

    /* Deduire l'URL de base dynamique a partir de l'emplacement de ce routeur */
    let scripts = document.getElementsByTagName("script");
    for (let s of scripts) {
        if (s.src && s.src.includes("extract_router.js")) {
            let urlRouteur = s.src;
            baseUrl = urlRouteur.substring(0, urlRouteur.lastIndexOf('/'));
            break;
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