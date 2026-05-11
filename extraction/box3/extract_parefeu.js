/* --- /extraction/box3/extract_pare-feu.js --- */

window.extraireParefeuBox3 = async function(estRattrapage = false) {
    const { configLivebox, simulerClic, attendreElement, attendrePause, attendreFinChargementGWT, CLE_STORAGE } = window;

    console.warn("=================================================");
    console.warn("[8/x] Extraction sur la page Pare-feu (Box 3)...");
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
    /* 1. TECHNIQUE ANTI-LAG : ALLER-RETOUR (WIFI -> PARE-FEU)                   */
    /* ========================================================================= */
    console.warn("Passage temporaire par la page WiFi...");
    window.location.hash = "#WIFIPlace:";
    await attendrePause(1000);
    await fermerPopupSiPresent(); 
    await attendreFinChargementGWT();

    console.warn("Retour sur la page Pare-feu...");
    window.location.hash = "#FirewallPlace:";
    await attendrePause(1000); 
    await fermerPopupSiPresent(); 
    await attendreFinChargementGWT();

    /* ========================================================================= */
    /* 2. ATTENTE DU FORMULAIRE                                                  */
    /* ========================================================================= */
    let conteneurPareFeu = await attendreElement("#gwtActivityPanel form", 5000);
    if (!conteneurPareFeu) {
        console.error("Echec: Page Pare-feu introuvable.");
        return;
    }

    /* ========================================================================= */
    /* 3. EXTRACTION DES DONNEES                                                 */
    /* ========================================================================= */
    console.warn("Extraction du Pare-feu en cours...");
    
    configLivebox.parefeu = configLivebox.parefeu || {};

    /* -- Niveau de protection -- */
    let radioProtectionCoche = document.querySelector("input[name='levelRadioButtons']:checked");
    
    if (radioProtectionCoche) {
        /* On cherche le label associe a l'ID du bouton radio pour avoir le texte lisible */
        let labelAssocie = document.querySelector('label[for="' + radioProtectionCoche.id + '"]');
        configLivebox.parefeu["niveau de protection"] = labelAssocie ? (labelAssocie.innerText || labelAssocie.textContent).trim() : radioProtectionCoche.value;
    } else {
        configLivebox.parefeu["niveau de protection"] = "Introuvable";
    }

    /* -- Repondre au ping (Recherche approximative si present) -- */
    let radioPingOn = document.querySelector("input[name*='ping'][value='on'], input[name*='Ping'][value='on']");
    if (radioPingOn) {
        configLivebox.parefeu["répondre au ping"] = radioPingOn.checked;
    } else {
        let checkboxPing = document.querySelector("input[type='checkbox'][name*='ping'], input[type='checkbox'][title*='ping']");
        if (checkboxPing) {
            configLivebox.parefeu["répondre au ping"] = checkboxPing.checked;
        } else {
            configLivebox.parefeu["répondre au ping"] = "Introuvable";
        }
    }

    console.warn("Pare-feu extrait avec succes :", configLivebox.parefeu);

    /* ========================================================================= */
    /* 4. SAUVEGARDE ET FIN SILENCIEUSE                                          */
    /* ========================================================================= */
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
    console.warn("Fin du module Pare-feu.");
};