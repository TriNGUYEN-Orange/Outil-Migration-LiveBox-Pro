/* --- /extraction/box3/extract_natpat.js --- */

window.extraireNatpatBox3 = async function(estRattrapage = false) {
    const { configLivebox, simulerClic, attendreElement, attendrePause, attendreFinChargementGWT, extraireTableau, CLE_STORAGE } = window;

    console.warn("=================================================");
    console.warn("[5/x] Extraction sur la page NAT/PAT (Box 3)...");
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
    /* 1. TECHNIQUE ANTI-LAG : ALLER-RETOUR (WIFI -> NAT/PAT)                    */
    /* ========================================================================= */
    console.warn("Forcage du chargement : passage temporaire par la page WiFi...");
    window.location.hash = "#WIFIPlace:";
    await attendrePause(1000);
    await fermerPopupSiPresent(); 
    await attendreFinChargementGWT();

    console.warn("Retour sur la page NAT/PAT...");
    window.location.hash = "#NATPATPlace:";
    await attendrePause(1000); 
    await fermerPopupSiPresent(); 
    await attendreFinChargementGWT();

    /* ========================================================================= */
    /* 2. ATTENTE DU FORMULAIRE                                                  */
    /* ========================================================================= */
    let conteneurNatPat = await attendreElement("#gwtActivityPanel form, #gwtActivityPanel table", 5000);
    if (!conteneurNatPat) {
        console.error("Echec: Page NAT/PAT introuvable.");
        return;
    }

    /* ========================================================================= */
    /* 3. EXTRACTION DE LA TABLE DES REGLES VIA EXTRAIRE_TABLEAU                 */
    /* ========================================================================= */
    console.warn("Extraction de la table NAT/PAT en cours...");
    
    configLivebox.natpat = configLivebox.natpat || {};
    
    /* Configuration des colonnes (0-index) d'apres le DOM de la Box 3 */
    let configurationColonnesNAT = {
        "Application/Service": 0,
        "Port interne": 5,
        "Port externe": 4,
        "Protocole": 1,
        "Équipement": 6,
        "IP externe": 2, 
        "Activé": 7
    };
    
    /* Utilisation de la fonction globale pour extraire le tableau */
    let donneesTableauNAT = extraireTableau("#gwtActivityPanel table", configurationColonnesNAT);
    
    /* Filtrage : on ignore les lignes vides ou la ligne d'ajout ("Nouveau...") */
    configLivebox.natpat["règles IPv4"] = donneesTableauNAT.filter(regle => {
        let app = (regle["Application/Service"] || "").trim().toLowerCase();
        let port = (regle["Port interne"] || "").trim();
        return app !== "" && app !== "nouveau" && app !== "nouveau..." && port !== "";
    });

    console.warn("NAT/PAT extrait avec succes. Nombre de regles :", configLivebox.natpat["règles IPv4"].length);

    /* ========================================================================= */
    /* 4. SAUVEGARDE ET FIN SILENCIEUSE                                          */
    /* ========================================================================= */
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
    console.warn("Fin du module NAT/PAT.");
};