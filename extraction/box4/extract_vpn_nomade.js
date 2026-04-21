/* --- /box4/extract_vpn_nomade.js --- */

window.extraireVpnNomade = async function(estRattrapage = false) {
    const { 
        configLivebox, 
        simulerClic, 
        attendreElement, 
        attendrePause, 
        lireEtat, 
        CLE_STORAGE 
    } = window;

    /* --- BLOC 11 : VPN Nomade (Client à Site) --- */
    console.log("⏳ [11/x] Extraction sur la page VPN Nomade...");

    if (estRattrapage) {
        console.log("🔄 Mode tentative activé : Passage par le menu Wi-Fi d'abord...");
        simulerClic("#homepage_wifi_configuration_hyperlink");
        await attendrePause(1000); 
    }

    /* 🛠️ Fonction de lecture ultra-sécurisée anti-crash */
    const lireSecuriseNomade = (selecteur) => {
        let el = document.querySelector(selecteur);
        if (!el) return "";
        if (el.tagName === 'SELECT') {
            return el.selectedIndex >= 0 ? el.options[el.selectedIndex].text.trim() : "";
        }
        let val = (el.tagName === 'INPUT') ? el.value : (el.innerText || el.textContent);
        return val ? String(val).trim() : "";
    };

    /* 🛡️ REFACTOR : Algorithme intelligent pour trouver les champs par leur texte (Label) */
    const lireAvanceNomade = (motCle, blocParent, balise = "select") => {
        /* On cherche d'abord par le titre (si Orange a bien fait son travail) */
        let el = blocParent.querySelector(balise + "[title*='" + motCle + "']");
        if (el) {
            if (balise === 'select') return el.selectedIndex >= 0 ? el.options[el.selectedIndex].text.trim() : "";
            return el.value.trim();
        }

        /* Plan B : Scanner tous les labels texte pour trouver le mot clé */
        let labels = blocParent.querySelectorAll("div[class*='formItemLabel']");
        for (let i = 0; i < labels.length; i++) {
            if ((labels[i].innerText || "").toLowerCase().includes(motCle.toLowerCase())) {
                /* Le champ se trouve généralement dans la balise soeur ou le parent */
                let parent = labels[i].parentElement;
                if (parent) {
                    let input = parent.querySelector(balise);
                    if (input) {
                        if (balise === 'select') return input.selectedIndex >= 0 ? input.options[input.selectedIndex].text.trim() : "";
                        return input.value.trim();
                    }
                }
            }
        }
        return "Introuvable";
    };

    /* Fonction dédiée pour abattre les pop-ups qui bloquent la boucle */
    const fermerPopUpGWT = async () => {
        let popUpOui = await attendreElement("#confirm_button", 2500);
        if (popUpOui) {
            console.log("⚠️ Pop-up de sortie détectée ! Clic sur OUI...");
            popUpOui.click();
            simulerClic("#confirm_button");
            await attendrePause(1000); /* Pause réduite pour laisser le temps au clic de s'enregistrer */
            
            let elementsBloquants = document.querySelectorAll("div[class*='popinPanel'], div[class*='glassPanel'], div[class*='popinGlass']");
            elementsBloquants.forEach(el => {
                el.style.pointerEvents = "none";
                el.style.display = "none";
                el.remove();
            });
        }
    };

    configLivebox.vpn = configLivebox.vpn || {};
    configLivebox.vpn["nomade"] = { "comptes": [], "parametres avancés": {} };

    let selecteurBoutonNomade = "img[title*='éditer'][title*='utilisateur'], img[title*='modifier'][title*='utilisateur'], img[title*='éditer'][title*='nomade'], img[title*='modifier'][title*='nomade']";
    
    await attendreElement(selecteurBoutonNomade, 10000);
    let nbConnexionsNomades = document.querySelectorAll(selecteurBoutonNomade).length;

    if (nbConnexionsNomades > 0) {
        console.log("⚠️ " + nbConnexionsNomades + " compte(s) VPN Nomade trouvé(s). Début de la boucle...");

        for (let i = 0; i < nbConnexionsNomades; i++) {
            await attendreElement(selecteurBoutonNomade, 15000);
            await attendrePause(1000);

            let boutons = document.querySelectorAll(selecteurBoutonNomade);
            let boutonActuel = boutons[i];

            if (boutonActuel) {
                boutonActuel.click();
                if(boutonActuel.parentElement) boutonActuel.parentElement.click();
                ['mousedown', 'mouseup', 'click'].forEach(evt => {
                    boutonActuel.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: window }));
                });
                
                let blocFormulaireNomade = "#gwtActivityPanel form div[class*='formLayout']";
                let formVisible = await attendreElement(blocFormulaireNomade, 15000);
                
                if (formVisible) {
                    await attendrePause(1500);
                    let nomadeConfig = {}; 
                    
                    let etatActif = lireEtat(blocFormulaireNomade + " > div:nth-child(1)");
                    nomadeConfig["état de l'utilisateur"] = (etatActif === true) ? "activé" : "désactivé";
                    
                    let valNom = lireSecuriseNomade("input[title*='nom'][title*='utilisateur']");
                    nomadeConfig["nom de l'utilisateur"] = valNom ? valNom : lireSecuriseNomade(blocFormulaireNomade + " > div:nth-child(2) input");

                    let valMdp = lireSecuriseNomade("input[title*='mot de passe']");
                    nomadeConfig["mot de passe de l'utilisateur"] = valMdp ? valMdp : lireSecuriseNomade(blocFormulaireNomade + " > div:nth-child(3) input");

                    let valLogiciel = lireSecuriseNomade("input[title*='logiciel']");
                    nomadeConfig["logiciel VPN nomade"] = valLogiciel ? valLogiciel : lireSecuriseNomade(blocFormulaireNomade + " > div:nth-child(7) input, " + blocFormulaireNomade + " > div:nth-child(7) div[class*='formItemInput']");

                    let valType = lireSecuriseNomade("input[title*='type VPN'], div[title*='type VPN']");
                    nomadeConfig["type VPN"] = valType ? valType : lireSecuriseNomade(blocFormulaireNomade + " > div:nth-child(8) div[class*='formItemInput']");

                    let valCle = lireSecuriseNomade("input[title*='clé partagée']");
                    nomadeConfig["clé partagée nomade"] = valCle ? valCle : lireSecuriseNomade(blocFormulaireNomade + " > div:nth-child(9) input");

                    configLivebox.vpn["nomade"]["comptes"].push(nomadeConfig);

                    /* ========================================================================= */
                    /* EXTRACTION DES PARAMÈTRES AVANCÉS SANS AUCUN NTH-CHILD !                  */
                    /* ========================================================================= */
                    if (i === 0) {
                        let selecteurLienAvance = "#gwtActivityPanel a, .gwt-Hyperlink a";
                        let tousLesLiens = document.querySelectorAll(selecteurLienAvance);
                        let lienAvances = Array.from(tousLesLiens).find(a => a.innerText.toLowerCase().includes("avancés"));
                        
                        if (lienAvances) {
                            lienAvances.click();
                            await attendreElement("#gwtActivityPanel form div[class*='formLayout'] select", 6000); 
                            
                            /* On récupère les 3 grands blocs de la page (Réseau, Phase 1, Phase 2) */
                            let blocsAvances = document.querySelectorAll("#gwtActivityPanel form div[class*='formLayout']");
                            
                            if(blocsAvances.length >= 3) {
                                let paramAvances = {};
                                
                                /* Bloc 1 : Paramètres Réseaux */
                                paramAvances["allocation IP"] = lireAvanceNomade("allocation", blocsAvances[0], "select");
                                paramAvances["accès Internet utilisateur"] = lireAvanceNomade("internet", blocsAvances[0], "select");
                                paramAvances["adresse IP de début"] = lireAvanceNomade("début", blocsAvances[0], "input");
                                paramAvances["adresse IP de fin"] = lireAvanceNomade("fin", blocsAvances[0], "input");
                                
                                /* Bloc 2 : IKE Phase 1 */
                                paramAvances["IKE (phase 1)"] = {
                                    "chiffrement": lireAvanceNomade("chiffrement", blocsAvances[1], "select"),
                                    "authentification": lireAvanceNomade("authentification", blocsAvances[1], "select"),
                                    "groupe Diffie Hellman": lireAvanceNomade("diffie", blocsAvances[1], "select"),
                                    "durée de session (en sec)": lireAvanceNomade("durée", blocsAvances[1], "input")
                                };
                                
                                /* Bloc 3 : IKE Phase 2 */
                                let detectionCochee = blocsAvances[2].querySelector("input[type='checkbox'], input[type='radio']");
                                paramAvances["IKE (phase 2)"] = {
                                    "chiffrement": lireAvanceNomade("chiffrement", blocsAvances[2], "select"),
                                    "authentification": lireAvanceNomade("authentification", blocsAvances[2], "select"),
                                    "groupe PFS": lireAvanceNomade("pfs", blocsAvances[2], "select"),
                                    "durée de session (en sec)": lireAvanceNomade("durée", blocsAvances[2], "input"),
                                    "détection de déconnexion": detectionCochee ? (detectionCochee.checked ? "activé" : "désactivé") : "inconnu"
                                };
                                
                                configLivebox.vpn["nomade"]["parametres avancés"] = paramAvances;
                                console.log("✅ Paramètres avancés extraits intelligemment !");
                            }

                            let btnRetourAvance = document.querySelector("#back_form_button");
                            if (btnRetourAvance) {
                                btnRetourAvance.click();
                                simulerClic("#back_form_button");
                                await fermerPopUpGWT();
                                await attendreElement("input[title*='nom'][title*='utilisateur'], " + blocFormulaireNomade, 10000);
                            }
                        }
                    }

                } else {
                    console.error("❌ Impossible d'ouvrir le formulaire Nomade.");
                }

                let btnRetourList = document.querySelector("#back_form_button");
                if (btnRetourList) {
                    btnRetourList.click();
                    simulerClic("#back_form_button");
                    await fermerPopUpGWT();
                    
                    let listeReapparait = await attendreElement(selecteurBoutonNomade, 6000);
                    if (!listeReapparait) {
                        simulerClic("#menu_menuNetwork_vpn_hyperlink");
                        await attendreElement(selecteurBoutonNomade, 10000);
                    }
                } else {
                    simulerClic("#menu_menuNetwork_vpn_hyperlink");
                    await attendreElement(selecteurBoutonNomade, 15000);
                }
            }
        }
    }

    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
};