/* --- /extraction/box3bis/extract_acces_distance.js --- */

window.extraireAccesDistanceBox3 = async function(estRattrapage = false) {
    const { configLivebox, simulerClic, attendreElement, attendrePause, attendreFinChargementGWT, CLE_STORAGE } = window;

    console.warn("=================================================");
    console.warn("[11/x] Extraction sur la page Acces a distance (Box 3)...");
    console.warn("=================================================");

    if (estRattrapage) {
        simulerClic("#menu_home_hyperlink");
        await attendrePause(1500);
        await attendreFinChargementGWT();
    }

    const fermerPopupSiPresent = async () => {
        let popupFerme = false;
        for (let i = 0; i < 8; i++) {
            let popup = document.querySelector(".PopinCss-popinPanel, .popupContent");
            if (popup && window.getComputedStyle(popup).display !== "none") {
                let boutons = popup.querySelectorAll(".gwt-Anchor, .gwt-Button, div[role='button'], a[title]");
                for (let btn of boutons) {
                    let texteBtn = (btn.innerText || btn.textContent || "").trim().toLowerCase();
                    let titreBtn = (btn.getAttribute("title") || "").trim().toLowerCase();
                    if (texteBtn === "oui" || titreBtn.startsWith("oui") || texteBtn === "continuer") {
                        btn.scrollIntoView({ block: "center" });
                        btn.focus();
                        ['mouseover', 'mouseenter', 'mousedown', 'mouseup', 'click'].forEach(function(type) {
                            btn.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
                        });
                        popupFerme = true;
                        await attendrePause(1200);
                        break;
                    }
                }
            }
            if (popupFerme) break;
            await attendrePause(400); 
        }
    };

    const lireChampGWT = (motCle, occurrence = 0, prendreValeur = false) => {
        let matchs = [];
        
        let elements = document.querySelectorAll("#gwtActivityPanel input:not([type='hidden']), #gwtActivityPanel select");
        for (let el of elements) {
            let titre = (el.getAttribute("title") || "").toLowerCase();
            if (titre.includes(motCle.toLowerCase())) {
                let val = el.tagName === "SELECT" ? (prendreValeur ? el.value : (el.selectedIndex >= 0 ? el.options[el.selectedIndex].text.trim() : "")) : (el.value !== undefined ? el.value.trim() : "");
                if (val !== "") matchs.push(val);
            }
        }
        
        if (matchs.length > occurrence) return matchs[occurrence];

        matchs = []; 
        let labels = document.querySelectorAll("#gwtActivityPanel div[class*='formItemLabel'], #gwtActivityPanel .gwt-Label, #gwtActivityPanel label");
        for (let lbl of labels) {
            if ((lbl.innerText || "").toLowerCase().trim() === motCle.toLowerCase() || (lbl.innerText || "").toLowerCase().trim().includes(motCle.toLowerCase())) {
                let champTrouve = null;

                if (lbl.parentElement) champTrouve = lbl.parentElement.querySelector("input:not([type='hidden']), select");
                if (!champTrouve && lbl.nextElementSibling) {
                    let frere = lbl.nextElementSibling;
                    champTrouve = (frere.tagName === "INPUT" || frere.tagName === "SELECT") ? frere : frere.querySelector("input:not([type='hidden']), select");
                }
                if (!champTrouve && lbl.parentElement && lbl.parentElement.nextElementSibling) {
                    let oncle = lbl.parentElement.nextElementSibling;
                    champTrouve = (oncle.tagName === "INPUT" || oncle.tagName === "SELECT") ? oncle : oncle.querySelector("input:not([type='hidden']), select");
                }

                if (champTrouve) {
                    let val = champTrouve.tagName === "SELECT" ? (prendreValeur ? champTrouve.value : (champTrouve.selectedIndex >= 0 ? champTrouve.options[champTrouve.selectedIndex].text.trim() : "")) : champTrouve.value.trim();
                    if (val !== "") matchs.push(val);
                } else {
                    let frereTexte = lbl.nextElementSibling;
                    if (frereTexte) {
                        let val = (frereTexte.innerText || frereTexte.textContent).trim();
                        if (val !== "") matchs.push(val);
                    }
                }
            }
        }
        
        if (matchs.length > occurrence) return matchs[occurrence];
        return "Introuvable";
    };

    /* ========================================================================= */
    /* NAVIGATION VERS ACCES A DISTANCE                                          */
    /* ========================================================================= */
    console.warn("Passage temporaire par la page WiFi...");
    window.location.hash = "#WIFIPlace:";
    await attendrePause(1000);
    await fermerPopupSiPresent(); 
    await attendreFinChargementGWT();

    console.warn("Passage par la page Mon Compte...");
    window.location.hash = "#MyPasswordPlace:";
    await attendrePause(1000);
    await fermerPopupSiPresent(); 
    await attendreFinChargementGWT();

    console.warn("Navigation vers la page Acces distant...");
    window.location.hash = "#MyAccountRemoteAccessPlace:";
    await attendrePause(1500); 
    await fermerPopupSiPresent(); 
    await attendreFinChargementGWT();

    let formulaireCharge = await attendreElement("#gwtActivityPanel form", 5000);
    if (!formulaireCharge) {
        console.error("Echec: Page Acces a distance introuvable ou non chargee.");
        return;
    }

    await attendrePause(1500);

    /* ========================================================================= */
    /* EXTRACTION DES DONNEES                                                    */
    /* ========================================================================= */
    configLivebox["accès à distance"] = {};

    /* --- ETAT D'ACTIVATION --- */
    let etatAcces = "désactivé";
    let radiosCoches = document.querySelectorAll("#gwtActivityPanel input[type='radio']:checked");
    for (let radio of radiosCoches) {
        let nameRadio = (radio.name || "").toLowerCase();
        let textRadio = radio.nextElementSibling ? (radio.nextElementSibling.innerText || "").toLowerCase().trim() : "";
        if (nameRadio.includes("enable") || textRadio === "activé" || textRadio === "oui") {
            etatAcces = "activé";
            break;
        }
    }
    configLivebox["accès à distance"]["état"] = etatAcces;

    /* --- CHAMPS DE FORMULAIRE --- */
    
    /* 1. Identifiant : Utilisation du selecteur exact fourni par l'utilisateur (nettoye des hash GWT) */
    let selecteurIdentifiantExact = "#gwtActivityPanel form > div > div:nth-child(1) > div > div:nth-child(1) > div[class*='formLayout'] > div:nth-child(1) > div[class*='bold_font']";
    let elementIdentifiant = document.querySelector(selecteurIdentifiantExact);
    
    if (elementIdentifiant) {
        configLivebox["accès à distance"]["identifiant"] = (elementIdentifiant.innerText || elementIdentifiant.textContent).trim();
    } else {
        /* Fallback de securite */
        configLivebox["accès à distance"]["identifiant"] = lireChampGWT("identifiant");
    }

    configLivebox["accès à distance"]["mot de passe"] = lireChampGWT("mot de passe");
    configLivebox["accès à distance"]["port"] = lireChampGWT("port");

    console.warn("Acces a distance extrait avec succes :", configLivebox["accès à distance"]);

    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
};