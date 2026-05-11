/* --- /extraction/box3/extract_dmz.js --- */

window.extraireDmzBox3 = async function(estRattrapage = false) {
    const { configLivebox, simulerClic, attendreElement, attendrePause, attendreFinChargementGWT, extraireTableau, CLE_STORAGE } = window;

    console.warn("=================================================");
    console.warn("[7/x] Extraction sur la page DMZ (Box 3)...");
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
    /* 1. TECHNIQUE ANTI-LAG : ALLER-RETOUR (WIFI -> DMZ)                        */
    /* ========================================================================= */
    console.warn("Passage temporaire par la page WiFi...");
    window.location.hash = "#WIFIPlace:";
    await attendrePause(1000);
    await fermerPopupSiPresent(); 
    await attendreFinChargementGWT();

    console.warn("Retour sur la page DMZ...");
    window.location.hash = "#DMZPlace:";
    await attendrePause(1000); 
    await fermerPopupSiPresent(); 
    await attendreFinChargementGWT();

    /* ========================================================================= */
    /* 2. ATTENTE DU TABLEAU                                                     */
    /* ========================================================================= */
    let selecteurTableauDMZ = "#gwtActivityPanel table.widgetTable";
    let conteneurDMZ = await attendreElement(selecteurTableauDMZ, 5000);
    
    if (!conteneurDMZ) {
        console.error("Echec: Tableau DMZ introuvable.");
        return;
    }

    /* ========================================================================= */
    /* 3. EXTRACTION DE LA TABLE DES REGLES VIA EXTRAIRE_TABLEAU                 */
    /* ========================================================================= */
    console.warn("Extraction de la table DMZ en cours...");
    
    configLivebox.dmz = configLivebox.dmz || {};

    /* Utilisation propre de la fonction extraireTableau */
    let equipementsBruts = extraireTableau(
        selecteurTableauDMZ,
        {
            "Équipement": 0,
            "Adresse IP statique": 1
        }
    );

    /* Filtrage des lignes vides, placeholders ou de creation ("Nouveau...") */
    let equipementsNettoyes = equipementsBruts.filter(eq => {
        let nom = (eq["Équipement"] || "").trim().toLowerCase();
        return nom !== "" && nom !== "<équipement>" && !nom.includes("aucun") && !nom.includes("nouveau");
    });

    if (equipementsNettoyes.length > 0) {
        configLivebox.dmz["équipements"] = equipementsNettoyes;
        console.warn("DMZ extrait avec succes. Nombre d'equipements :", equipementsNettoyes.length);
    } else {
        delete configLivebox.dmz["équipements"];
        console.warn("Aucun equipement DMZ detecte. Section laissee vide.");
    }

    /* ========================================================================= */
    /* 4. SAUVEGARDE ET FIN SILENCIEUSE                                          */
    /* ========================================================================= */
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
    console.warn("Fin du module DMZ.");
};