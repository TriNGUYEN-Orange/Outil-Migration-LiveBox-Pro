/* --- /extraction/box3/extract_dyndns.js --- */

window.extraireDyndnsBox3 = async function(estRattrapage = false) {
    const { configLivebox, simulerClic, attendreElement, attendrePause, attendreFinChargementGWT, extraireTableau, CLE_STORAGE } = window;

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
    /* 3. EXTRACTION DE LA TABLE DES REGLES VIA EXTRAIRE_TABLEAU                 */
    /* ========================================================================= */
    console.warn("Extraction de la table DynDNS en cours...");
    
    configLivebox.dyndns = configLivebox.dyndns || {};
    
    /* Maintien strict de la structure JSON (champs generaux laisses vides) */
    configLivebox.dyndns["activé"] = "";
    configLivebox.dyndns["nom DNS"] = "";
    configLivebox.dyndns["nom de hôte complet"] = "";

    /* Cartographie des colonnes basee sur le DOM Box 3 (8 colonnes au total) */
    let configurationColonnesDynDNS = {
        "Service": 0,
        "Nom d'hôte/de domaine": 1,
        "Identifiant": 2,
        "Mot de passe": 3,
        "Activer": 5
    };
    
    let donneesTableauDynDNS = extraireTableau("#gwtActivityPanel table.widgetTable", configurationColonnesDynDNS);
    
    /* Filtrage : on ignore les lignes vides ou la ligne d'ajout ("Nouveau...") */
    configLivebox.dyndns["DynDNS externes"] = donneesTableauDynDNS.filter(regle => {
        let service = (regle["Service"] || "").trim().toLowerCase();
        return service !== "" && service !== "nouveau" && service !== "nouveau...";
    });

    console.warn("DynDNS extrait avec succes. Nombre d'entrees :", configLivebox.dyndns["DynDNS externes"].length);

    /* ========================================================================= */
    /* 4. SAUVEGARDE ET FIN SILENCIEUSE                                          */
    /* ========================================================================= */
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
    console.warn("Fin du module DynDNS.");
};