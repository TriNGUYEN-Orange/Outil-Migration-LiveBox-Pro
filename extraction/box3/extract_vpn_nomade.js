/* --- /extraction/box3bis/extract_vpn_nomade.js --- */

window.extraireVpnNomadeBox3 = async function(estRattrapage = false) {
    const { configLivebox, simulerClic, attendreElement, attendrePause, attendreFinChargementGWT, CLE_STORAGE } = window;

    console.warn("=================================================");
    console.warn("[9/x] Extraction sur la page VPN Nomade (Box 3)...");
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

    /* Fonction de lecture super-intelligente */
    const lireApresLabel = (texteLabel) => {
        let labels = document.querySelectorAll("#gwtActivityPanel div[class*='formItemLabel'], #gwtActivityPanel .gwt-Label");
        for (let lbl of labels) {
            if ((lbl.innerText || "").toLowerCase().trim().includes(texteLabel.toLowerCase())) {
                let parent = lbl.parentElement;
                if (parent) {
                    /* Cas 1 : Champ editable (Input / Select) */
                    let input = parent.querySelector("input:not([type='hidden']):not([disabled]), select");
                    if (input) {
                        if (input.tagName === "SELECT") return input.selectedIndex >= 0 ? input.options[input.selectedIndex].text.trim() : "";
                        return input.value.trim();
                    }
                    /* Cas 2 : Input grisé */
                    let inputDisabled = parent.querySelector("input[disabled]");
                    if (inputDisabled) return inputDisabled.value.trim();
                    
                    /* Cas 3 : Texte brut dans une div voisine */
                    let frere = lbl.nextElementSibling;
                    if (frere) return (frere.innerText || frere.textContent).trim();
                }
            }
        }
        return "Introuvable";
    };

    /* ========================================================================= */
    /* 1. NAVIGATION VERS VPN                                                    */
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
    configLivebox.vpn["nomade"] = { "comptes": [], "parametres avancés": {} };

    /* ========================================================================= */
    /* 2. IDENTIFICATION DE LA TABLE NOMADE ET BOUCLE SUR LES COMPTES            */
    /* ========================================================================= */
    let tables = document.querySelectorAll("#gwtActivityPanel table.widgetTable");
    let tableNomade = tables.length > 1 ? tables[1] : tables[0]; 
    
    if (tableNomade) {
        let selecteurBoutonModif = "img[title*='modifier'], img[title*='éditer']";
        let nbComptes = tableNomade.querySelectorAll(selecteurBoutonModif).length;
        
        console.warn("⚠️ " + nbComptes + " compte(s) VPN Nomade trouve(s).");

        for (let i = 0; i < nbComptes; i++) {
            tables = document.querySelectorAll("#gwtActivityPanel table.widgetTable");
            tableNomade = tables.length > 1 ? tables[1] : tables[0];
            let btnModifier = tableNomade.querySelectorAll(selecteurBoutonModif)[i];
            
            if (btnModifier) {
                console.warn(`Ouverture du compte nomade ${i + 1}/${nbComptes}...`);
                btnModifier.scrollIntoView({ block: "center" });
                
                ['mousedown', 'mouseup', 'click'].forEach(evt => {
                    btnModifier.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: window }));
                });
                
                let formOuvert = await attendreElement("#gwtActivityPanel form", 5000);
                await attendrePause(1000); 

                if (formOuvert) {
                    let compteConfig = {};
                    
                    let radioEtat = document.querySelector("input[name='vpnUserActivate']:checked");
                    compteConfig["état de l'utilisateur"] = radioEtat && radioEtat.nextElementSibling ? radioEtat.nextElementSibling.innerText.trim().toLowerCase() : "désactivé";
                    
                    /* CORRECTION ICI : Double vérification pour le nom de l'utilisateur */
                    let nomTrouve = lireApresLabel("nom de l'utilisateur");
                    if (nomTrouve === "Introuvable") nomTrouve = lireApresLabel("utilisateur");
                    compteConfig["nom de l'utilisateur"] = nomTrouve;

                    compteConfig["mot de passe de l'utilisateur"] = lireApresLabel("mot de passe");
                    compteConfig["logiciel VPN nomade"] = lireApresLabel("logiciel vpn");
                    compteConfig["type VPN"] = lireApresLabel("type vpn");
                    compteConfig["clé partagée nomade"] = lireApresLabel("clé");
                    
                    configLivebox.vpn["nomade"]["comptes"].push(compteConfig);

                    /* --- PARAMETRES AVANCES --- */
                    if (i === 0) {
                        let btnAvances = document.querySelector("a[href*='#RoadWarriorVpnPlace'], a[title*='avancés']");
                        if (!btnAvances) {
                            let liens = document.querySelectorAll("#gwtActivityPanel a, #gwtActivityPanel .gwt-Hyperlink");
                            for(let l of liens) {
                                if((l.innerText || "").toLowerCase().includes("avancés")) { btnAvances = l; break; }
                            }
                        }
                        
                        if (btnAvances) {
                            console.warn("Ouverture des parametres avances...");
                            btnAvances.click();
                            await attendreElement("#gwtActivityPanel select", 5000);
                            await attendrePause(1000);
                            
                            const lireDansBloc = (motCle, bloc) => {
                                let labels = bloc.querySelectorAll("div[class*='formItemLabel'], .gwt-Label");
                                for (let lbl of labels) {
                                    if ((lbl.innerText || "").toLowerCase().trim().includes(motCle.toLowerCase())) {
                                        let parent = lbl.parentElement;
                                        if (!parent) continue;
                                        let input = parent.querySelector("input[type='text'], input[type='password'], select");
                                        if (input) {
                                            if (input.tagName === "SELECT") return input.selectedIndex >= 0 ? input.options[input.selectedIndex].text.trim() : "";
                                            return input.value.trim();
                                        }
                                    }
                                }
                                return "Introuvable";
                            };

                            let paramAvances = {};
                            let blocsAvances = document.querySelectorAll("#gwtActivityPanel form div[class*='pageSectionBorder'] > div[class*='formLayout']");
                            
                            if (blocsAvances.length >= 3) {
                                paramAvances["allocation IP"] = lireDansBloc("allocation", blocsAvances[0]);
                                paramAvances["accès Internet utilisateur"] = lireDansBloc("internet", blocsAvances[0]);
                                paramAvances["adresse IP de début"] = lireDansBloc("début", blocsAvances[0]);
                                paramAvances["adresse IP de fin"] = lireDansBloc("fin", blocsAvances[0]);
                                
                                paramAvances["IKE (phase 1)"] = {
                                    "chiffrement": lireDansBloc("chiffrement", blocsAvances[1]),
                                    "authentification": lireDansBloc("authentification", blocsAvances[1]),
                                    "groupe Diffie Hellman": lireDansBloc("diffie", blocsAvances[1]),
                                    "durée de session (en sec)": lireDansBloc("durée", blocsAvances[1])
                                };

                                paramAvances["IKE (phase 2)"] = {
                                    "chiffrement": lireDansBloc("chiffrement", blocsAvances[2]),
                                    "authentification": lireDansBloc("authentification", blocsAvances[2]),
                                    "groupe PFS": lireDansBloc("pfs", blocsAvances[2]),
                                    "durée de session (en sec)": lireDansBloc("durée", blocsAvances[2])
                                };

                                let checkDetection = blocsAvances[2].querySelector("input[type='checkbox']");
                                if (checkDetection) {
                                    paramAvances["IKE (phase 2)"]["détection de déconnexion"] = checkDetection.checked ? "activé" : "désactivé";
                                }
                            }
                            
                            configLivebox.vpn["nomade"]["parametres avancés"] = paramAvances;
                            
                            let btnRetourCompte = document.querySelector("a[title*='précédente'], button[title*='annuler']");
                            if (btnRetourCompte) {
                                btnRetourCompte.click();
                                await fermerPopupSiPresent();
                                await attendreElement("#gwtActivityPanel form", 5000);
                            } else {
                                window.history.back();
                                await attendreElement("#gwtActivityPanel form", 5000);
                            }
                        }
                    }
                    
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

    console.warn("VPN Nomade extrait avec succes !");
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
};