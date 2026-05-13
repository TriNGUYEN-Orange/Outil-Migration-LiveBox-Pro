/* --- /extraction/box3bis/extract_dyndns.js --- */

window.extraireDyndnsBox3 = async function(estRattrapage = false) {
    const { configLivebox, simulerClic, attendreElement, attendrePause, attendreFinChargementGWT, CLE_STORAGE } = window;

    console.warn("=================================================");
    console.warn("[6/x] Extraction sur la page DynDNS (Box 3)...");
    console.warn("=================================================");

    if (estRattrapage) {
        simulerClic("#menu_home_hyperlink");
        await attendrePause(1500);
        await attendreFinChargementGWT();
    }

    /* Fonction interne pour gerer la destruction des pop-ups de GWT */
    const fermerPopupSiPresent = async () => {
        let popupFerme = false;
        for (let i = 0; i < 8; i++) {
            let popup = document.querySelector(".PopinCss-popinPanel, .popupContent");
            if (popup && window.getComputedStyle(popup).display !== "none") {
                let boutons = popup.querySelectorAll(".gwt-Anchor, .gwt-Button, div[role='button'], a[title]");
                for (let btn of boutons) {
                    let texteBtn = (btn.innerText || btn.textContent || "").trim().toLowerCase();
                    let titreBtn = (btn.getAttribute("title") || "").trim().toLowerCase();
                    if (texteBtn === "oui" || titreBtn.startsWith("oui")) {
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

    /* ========================================================================= */
    /* 1. TECHNIQUE ANTI-LAG : ALLER-RETOUR (WIFI -> DYNDNS)                     */
    /* ========================================================================= */
    console.warn("Forcage du chargement : passage temporaire par la page WiFi...");
    window.location.hash = "#WIFIPlace:";
    await attendrePause(1000);
    await fermerPopupSiPresent(); 
    await attendreFinChargementGWT();

    console.warn("Retour sur la page DynDNS...");
    window.location.hash = "#DynDNSNetworkPlace:";
    await attendrePause(1000); 
    await fermerPopupSiPresent(); 
    await attendreFinChargementGWT();

    /* ========================================================================= */
    /* 2. ATTENTE DU TABLEAU                                                     */
    /* ========================================================================= */
    let conteneurDynDns = await attendreElement("#gwtActivityPanel table.widgetTable", 5000);
    if (!conteneurDynDns) {
        console.error("Echec: Tableau DynDNS introuvable.");
        return;
    }

    /* ========================================================================= */
    /* 3. EXTRACTION MANUELLE POUR RECUPERER L'ATTRIBUT TITLE                    */
    /* ========================================================================= */
    console.warn("Extraction de la table DynDNS en cours...");
    
    configLivebox.dyndns = configLivebox.dyndns || {};
    
    /* Maintien strict de la structure JSON (champs generaux laisses vides) */
    configLivebox.dyndns["activé"] = "";
    configLivebox.dyndns["nom DNS"] = "";
    configLivebox.dyndns["nom de hôte complet"] = "";

    let dynDnsExtraits = [];
    let lignes = document.querySelectorAll("#gwtActivityPanel table.widgetTable tbody tr");

    for (let i = 0; i < lignes.length; i++) {
        let cellules = lignes[i].querySelectorAll("td");
        
        /* On verifie qu'on a bien les colonnes attendues */
        if (cellules.length >= 6) {
            let service = (cellules[0].innerText || cellules[0].textContent).trim();
            let serviceLower = service.toLowerCase();
            
            /* Filtrage strict : on ignore les lignes vides, l'en-tete "service" et "nouveau" */
            if (service !== "" && serviceLower !== "service" && serviceLower !== "nouveau" && serviceLower !== "nouveau...") {
                
                /* Extraction intelligente du nom d'hote via l'attribut title s'il existe */
                let elemNom = cellules[1].querySelector("[title]");
                let nomComplet = elemNom ? elemNom.getAttribute("title").trim() : (cellules[1].innerText || cellules[1].textContent).trim();
                
                let identifiant = (cellules[2].innerText || cellules[2].textContent).trim();
                let motDePasse = (cellules[3].innerText || cellules[3].textContent).trim();
                
                /* Lecture de la checkbox Activer (colonne index 5) */
                let checkbox = cellules[5].querySelector("input[type='checkbox']");
                let actif = checkbox ? checkbox.checked : false;
                
                dynDnsExtraits.push({
                    "Service": service,
                    "Nom d'hôte/de domaine": nomComplet,
                    "Identifiant": identifiant,
                    "Mot de passe": motDePasse,
                    "Activer": actif
                });
            }
        }
    }

    configLivebox.dyndns["DynDNS externes"] = dynDnsExtraits;
    console.warn("DynDNS extrait avec succes. Nombre d'entrees :", dynDnsExtraits.length);

    /* ========================================================================= */
    /* 4. SAUVEGARDE ET FIN SILENCIEUSE                                          */
    /* ========================================================================= */
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
    console.warn("Fin du module DynDNS.");
};