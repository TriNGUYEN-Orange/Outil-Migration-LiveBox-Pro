/* --- /extraction/box3bis/extract_vpn_siteasite.js --- */

window.extraireVpnSiteBox3 = async function(estRattrapage = false) {
    const { configLivebox, simulerClic, attendreElement, attendrePause, attendreFinChargementGWT, CLE_STORAGE } = window;

    console.warn("=================================================");
    console.warn("[10/x] Extraction sur la page VPN Site a Site (Box 3)...");
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

    /* Fonction de lecture ultime, capable de fouiller les divs voisins */
    const lireChampGWT = (motCle, occurrence = 0, prendreValeur = false) => {
        let matchs = [];
        
        /* 1. Recherche par attribut title (Le plus precis) */
        let elements = document.querySelectorAll("#gwtActivityPanel input:not([type='hidden']), #gwtActivityPanel select");
        for (let el of elements) {
            let titre = (el.getAttribute("title") || "").toLowerCase();
            if (titre.includes(motCle.toLowerCase())) {
                if (el.tagName === "SELECT") {
                    matchs.push(prendreValeur ? el.value : (el.selectedIndex >= 0 ? el.options[el.selectedIndex].text.trim() : ""));
                } else {
                    matchs.push(el.value !== undefined ? el.value.trim() : "");
                }
            }
        }
        
        if (matchs.length > occurrence) return matchs[occurrence];

        /* 2. Recherche par Label (Fouille approfondie des balises soeurs) */
        matchs = []; 
        let labels = document.querySelectorAll("#gwtActivityPanel div[class*='formItemLabel'], #gwtActivityPanel .gwt-Label, #gwtActivityPanel label");
        for (let lbl of labels) {
            if ((lbl.innerText || "").toLowerCase().trim().includes(motCle.toLowerCase())) {
                let champTrouve = null;

                /* A. Chercher dans le meme conteneur parent */
                if (lbl.parentElement) {
                    champTrouve = lbl.parentElement.querySelector("input:not([type='hidden']), select");
                }

                /* B. Chercher dans l'element frere suivant (cas de div separees) */
                if (!champTrouve && lbl.nextElementSibling) {
                    let frere = lbl.nextElementSibling;
                    if (frere.tagName === "INPUT" || frere.tagName === "SELECT") {
                        champTrouve = frere;
                    } else {
                        champTrouve = frere.querySelector("input:not([type='hidden']), select");
                    }
                }

                /* C. Chercher dans le frere du parent (cas imbrique complexe) */
                if (!champTrouve && lbl.parentElement && lbl.parentElement.nextElementSibling) {
                    let oncle = lbl.parentElement.nextElementSibling;
                    if (oncle.tagName === "INPUT" || oncle.tagName === "SELECT") {
                        champTrouve = oncle;
                    } else {
                        champTrouve = oncle.querySelector("input:not([type='hidden']), select");
                    }
                }

                if (champTrouve) {
                    if (champTrouve.tagName === "SELECT") {
                        matchs.push(prendreValeur ? champTrouve.value : (champTrouve.selectedIndex >= 0 ? champTrouve.options[champTrouve.selectedIndex].text.trim() : ""));
                    } else {
                        matchs.push(champTrouve.value.trim());
                    }
                } else {
                    /* S'il n'y a pas d'input, c'est peut-etre juste du texte affiche */
                    let frereTexte = lbl.nextElementSibling;
                    if (frereTexte) matchs.push((frereTexte.innerText || frereTexte.textContent).trim());
                }
            }
        }
        
        if (matchs.length > occurrence) return matchs[occurrence];
        return "Introuvable";
    };

    /* ========================================================================= */
    /* NAVIGATION VERS VPN                                                       */
    /* ========================================================================= */
    console.warn("Passage temporaire par la page WiFi...");
    window.location.hash = "#WIFIPlace:";
    await attendrePause(1000);
    await fermerPopupSiPresent(); 
    await attendreFinChargementGWT();

    console.warn("Navigation vers la page VPN...");
    window.location.hash = "#VpnPlace:";
    await attendrePause(1500); 
    await fermerPopupSiPresent(); 
    await attendreFinChargementGWT();

    let conteneurVpn = await attendreElement("#gwtActivityPanel table.widgetTable", 5000);
    if (!conteneurVpn) {
        console.error("Echec: Tableaux VPN introuvables.");
        return;
    }

    configLivebox.vpn = configLivebox.vpn || {};
    configLivebox.vpn["vpn site à site"] = [];

    /* ========================================================================= */
    /* BOUCLE SUR LES CONNEXIONS SITE A SITE                                     */
    /* ========================================================================= */
    let tables = document.querySelectorAll("#gwtActivityPanel table.widgetTable");
    let tableSite = tables[0]; 
    
    if (tableSite) {
        let selecteurBoutonModif = "img[title*='modifier'], img[title*='éditer']";
        let nbComptes = tableSite.querySelectorAll(selecteurBoutonModif).length;
        
        console.warn("⚠️ " + nbComptes + " connexion(s) VPN Site a Site trouvee(s).");

        for (let i = 0; i < nbComptes; i++) {
            tables = document.querySelectorAll("#gwtActivityPanel table.widgetTable");
            tableSite = tables[0];
            let btnModifier = tableSite.querySelectorAll(selecteurBoutonModif)[i];
            
            if (btnModifier) {
                console.warn(`Ouverture de la connexion ${i + 1}/${nbComptes}...`);
                btnModifier.scrollIntoView({ block: "center" });
                
                ['mousedown', 'mouseup', 'click'].forEach(evt => {
                    btnModifier.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: window }));
                });
                
                let formOuvert = await attendreElement("#gwtActivityPanel form", 5000);
                await attendrePause(1500); 

                if (formOuvert) {
                    let vpnConfig = {};
                    
                    /* --- ETAT D'ACTIVATION (Correction pour Checkbox) --- */
                    let spanActiver = document.querySelector("span.gwt-RadioButton[title*='activer cette connexion']");
                    vpnConfig["activé"] = spanActiver 
                        ? spanActiver.querySelector("input[type='radio']").checked 
                        : false;

                    
                    /* --- INFORMATIONS GENERALES --- */
                    vpnConfig["nom VPN"] = lireChampGWT("nom de la connexion");
                    vpnConfig["adresse IP du site distant"] = lireChampGWT("machine VPN distante");
                    vpnConfig["équipement distant"] = lireChampGWT("équipement distant", 0, true);
                    vpnConfig["clé partagée"] = lireChampGWT("clé partagée");
                    
                    /* --- RESEAUX --- */
                    vpnConfig["réseau local"] = { 
                        "ip": lireChampGWT("réseau local"), 
                        "masque": lireChampGWT("masque", 0) 
                    };

                    vpnConfig["réseau distant"] = { 
                        "ip": lireChampGWT("réseau distant"), 
                        "masque": lireChampGWT("masque", 1) 
                    };

                    /* --- MODE DE TUNNEL --- */
                    let modeTrouve = "Introuvable";
                    let radiosMode = document.querySelectorAll("input[type='radio'][name*='Mode']:checked, input[type='radio'][name*='mode']:checked");
                    if (radiosMode.length > 0 && radiosMode[0].nextElementSibling) {
                        modeTrouve = radiosMode[0].nextElementSibling.innerText.trim().toLowerCase();
                    } else {
                        modeTrouve = lireChampGWT("mode");
                    }
                    vpnConfig["mode de configuration du tunnel"] = modeTrouve;
                    
                    configLivebox.vpn["vpn site à site"].push(vpnConfig);
                    
                    let btnRetourListe = document.querySelector("a[title*='précédente'], button[title*='annuler']");
                    if (btnRetourListe) {
                        btnRetourListe.click();
                        await fermerPopupSiPresent();
                        await attendreElement("#gwtActivityPanel table.widgetTable", 5000);
                    } else {
                        window.location.hash = "#VpnPlace:";
                        await attendreFinChargementGWT();
                        await attendreElement("#gwtActivityPanel table.widgetTable", 5000);
                    }
                }
            }
        }
    }

    console.warn("VPN Site a Site extrait avec succes !");
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
};