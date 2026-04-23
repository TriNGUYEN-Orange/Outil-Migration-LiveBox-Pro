/* --- /push/box6/push_vpn_nomade.js --- */

window.executerVpnNomade = async function() {
    console.log("⏳ Application des paramètres VPN Nomade (Création des comptes)...");

    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    try { configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox; } 
    catch(e) { return; }

    if (!configurationActuelle || !configurationActuelle.vpn || !configurationActuelle.vpn.nomade) {
        console.warn("⚠️ Pas de données VPN Nomade trouvées à appliquer."); return;
    }

    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
        await window.attendrePause(1000); 
    }

    let btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 10000);
    if (btnAvance) {
        window.cliquerBouton("#sah_footer .icon-advanced");
        await window.attendrePause(1500); 
        
        let selecteurVraiWidget = ".swiper-slide-active #internetVPNAnkaa, .swiper-slide-active .internetVPNAnkaa";
        let tuileVpn = document.querySelector(selecteurVraiWidget);
        if (!tuileVpn) tuileVpn = await window.attendreElement("#internetVPNAnkaa", 10000);

        if (tuileVpn) {
            tuileVpn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await window.attendrePause(500); 
            window.cliquerBouton(tuileVpn.querySelector(".widget") || tuileVpn);
            
            let titre = await window.attendreElement("#internetVPNAnkaaTitle", 5000);
            if (titre) {
                await window.attendrePause(500); 
                window.cliquerBouton(titre);
            }

            await window.attendrePause(1000); 

            let vpnNomade = configurationActuelle.vpn.nomade;
            let comptes = vpnNomade.comptes || [];
            let maxComptes = Math.min(comptes.length, 4); 

            console.log("📝 " + maxComptes + " compte(s) VPN à configurer.");

            /* =================================================================================== */
            /* 1. GESTION DES COMPTES (Création et État)                                           */
            /* =================================================================================== */
            for (let i = 0; i < maxComptes; i++) {
                let compte = comptes[i];
                console.log("⏳ Vérification du compte (" + (i + 1) + "/" + maxComptes + ") : " + compte["nom de l'utilisateur"]);

                /* 🌟 APPEL DIRECT AU POP-UP AVEC LE NOM DU MODULE "VPN Nomade" 🌟 */
                let nomConforme = await window.PushUI.validerNom(compte["nom de l'utilisateur"], "Utilisateur", "VPN Nomade");
                if (nomConforme === null) { console.log("⏭️ Compte ignoré."); continue; }
                
                let mdpConforme = await window.PushUI.validerMotDePasse(compte["mot de passe de l'utilisateur"], nomConforme, "VPN Nomade", "User");
                if (mdpConforme === null) { console.log("⏭️ Compte ignoré."); continue; }
                
                compte["nom de l'utilisateur"] = nomConforme;
                compte["mot de passe de l'utilisateur"] = mdpConforme;

                console.log("⏳ Création du compte (" + (i + 1) + "/" + maxComptes + ") : " + compte["nom de l'utilisateur"]);

                let btnAjout = await window.attendreElement("a[data-translation='internetVPNAnkaa.label.add']", 10000);

                if (btnAjout) {
                    btnAjout.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await window.attendrePause(500);
                    
                    if (typeof window.cliquerPur === "function") window.cliquerPur(btnAjout);
                    else btnAjout.click();
                    
                    let popup = await window.attendreElement("#user_popup", 5000);
                    if (popup) {
                        await window.attendrePause(1000); 

                        let typeVpnVoulu = compte["type VPN"];
                        if (typeVpnVoulu) {
                            let selectType = popup.querySelector("select");
                            if (selectType) {
                                let cible = typeVpnVoulu.toLowerCase().trim();
                                let valeurCible = "Wireguard"; 
                                if (cible.includes("l2tp") || cible.includes("ipsec")) valeurCible = "L2TYPE";
                                else if (cible.includes("wireguard") || cible.includes("wg")) valeurCible = "Wireguard";

                                if (selectType.value !== valeurCible) {
                                    selectType.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                                    selectType.focus();
                                    selectType.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                                    await window.attendrePause(300);

                                    selectType.value = valeurCible;
                                    Array.from(selectType.options).forEach(opt => { opt.selected = (opt.value === valeurCible); });

                                    selectType.dispatchEvent(new Event('input', { bubbles: true }));
                                    selectType.dispatchEvent(new Event('change', { bubbles: true }));

                                    selectType.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                                    selectType.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                                    selectType.blur();

                                    await window.attendrePause(2000);
                                }
                            }
                        }

                        const remplirEtValider = async (selecteur, valeur) => {
                            let champ = document.querySelector(selecteur);
                            if (champ && champ.offsetParent !== null) {
                                champ.focus();
                                champ.value = valeur;
                                champ.dispatchEvent(new Event('input', { bubbles: true }));
                                champ.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
                                champ.dispatchEvent(new Event('change', { bubbles: true }));
                                champ.blur();
                                await window.attendrePause(300);
                            }
                        };

                        if (compte["nom de l'utilisateur"]) await remplirEtValider("#user_name", compte["nom de l'utilisateur"]);
                        if (compte["mot de passe de l'utilisateur"]) {
                            await remplirEtValider("#password", compte["mot de passe de l'utilisateur"]);
                            let confirmInput = document.querySelector("#password_confirm");
                            if (confirmInput && confirmInput.offsetParent !== null) {
                                await remplirEtValider("#password_confirm", compte["mot de passe de l'utilisateur"]);
                            }
                        }
                        
                        await window.attendrePause(800);
                        
                        let btnSave = popup.querySelector("#changepwd_save");
                        if (btnSave && btnSave.offsetParent !== null) {
                            
                            await new Promise((resolve) => {
                                let checks = 0;
                                let intv = setInterval(() => {
                                    if (btnSave.getAttribute("aria-disabled") !== "true" || checks > 15) {
                                        clearInterval(intv); resolve();
                                    }
                                    checks++;
                                }, 200);
                            });

                            console.log("💾 Clic sur Enregistrer...");
                            if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave);
                            else btnSave.click();
                            
                            await window.attendrePause(1000); 

                            console.log("⏳ Attente de l'apparition du chargement...");
                            await new Promise((resolve) => {
                                let start = Date.now();
                                let intv = setInterval(() => {
                                    let loading = document.querySelector("body > div.loading_screen");
                                    if ((loading && window.getComputedStyle(loading).display !== "none") || (Date.now() - start > 3000)) {
                                        clearInterval(intv); resolve();
                                    }
                                }, 100);
                            });

                            console.log("⏳ Sauvegarde en cours... Ne touchez à rien.");
                            await new Promise((resolve) => {
                                let intv = setInterval(() => {
                                    let loading = document.querySelector("body > div.loading_screen");
                                    if (!loading || window.getComputedStyle(loading).display === "none") {
                                        clearInterval(intv); resolve();
                                    }
                                }, 500);
                                setTimeout(() => { clearInterval(intv); resolve(); }, 30000);
                            });
                            
                            console.log("✅ Compte " + (i + 1) + " enregistré avec succès !");

                            /* ==================================================================== */
                            /* 2. GESTION DE L'ÉTAT DANS LE TABLEAU APRÈS SAUVEGARDE                */
                            /* ==================================================================== */
                            let etatVoulu = compte["état de l'utilisateur"] ? compte["état de l'utilisateur"].toLowerCase() : "activé";
                            let veutEtreActive = (etatVoulu === "activé" || etatVoulu === "true" || etatVoulu === "active");
                            
                            console.log("🔍 Vérification de l'état (Voulu : " + (veutEtreActive ? "ON" : "OFF") + ")...");
                            await window.attendrePause(1000); 

                            let lignesTableau = document.querySelectorAll("tr.conf-table-ractive-row, table tbody tr");
                            let nomCompteRecherche = compte["nom de l'utilisateur"].toLowerCase().trim();
                            let ligneTrouvee = null;

                            for (let ligne of lignesTableau) {
                                if ((ligne.innerText || "").toLowerCase().includes(nomCompteRecherche)) {
                                    ligneTrouvee = ligne;
                                    break;
                                }
                            }

                            if (ligneTrouvee) {
                                let btnToggle = ligneTrouvee.querySelector(".conf-table-ractive-checkbox-image, td:nth-child(1) div");
                                let wrapperToggle = ligneTrouvee.querySelector(".conf-table-ractive-checkbox-container");
                                
                                if (btnToggle) {
                                    let htmlCellule = (wrapperToggle ? wrapperToggle.innerHTML : ligneTrouvee.innerHTML).toLowerCase();
                                    let classeWrapper = wrapperToggle ? wrapperToggle.className.toLowerCase() : "";
                                    
                                    let estActuellementActive = false;
                                    let inpCheck = ligneTrouvee.querySelector("input[type='checkbox']");
                                    
                                    if (inpCheck) {
                                        estActuellementActive = inpCheck.checked;
                                    } else {
                                        estActuellementActive = htmlCellule.includes("checked") || classeWrapper.includes("checked") || htmlCellule.includes("switch_on");
                                    }

                                    if (estActuellementActive !== veutEtreActive) {
                                        console.log("👉 Basculement de l'état pour " + compte["nom de l'utilisateur"] + "...");
                                        btnToggle.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        await window.attendrePause(500);

                                        if (typeof window.cliquerPur === "function") window.cliquerPur(btnToggle);
                                        else btnToggle.click();

                                        console.log("⏳ Attente de l'apparition du chargement (changement d'état)...");
                                        await new Promise((resolve) => {
                                            let start = Date.now();
                                            let intv = setInterval(() => {
                                                let loading = document.querySelector("body > div.loading_screen");
                                                if ((loading && window.getComputedStyle(loading).display !== "none") || (Date.now() - start > 3000)) {
                                                    clearInterval(intv); resolve();
                                                }
                                            }, 100);
                                        });

                                        console.log("⏳ Sauvegarde de l'état en cours...");
                                        await new Promise((resolve) => {
                                            let intv = setInterval(() => {
                                                let loading = document.querySelector("body > div.loading_screen");
                                                if (!loading || window.getComputedStyle(loading).display === "none") {
                                                    clearInterval(intv); resolve();
                                                }
                                            }, 500);
                                            setTimeout(() => { clearInterval(intv); resolve(); }, 30000);
                                        });
                                        console.log("✅ État mis à jour !");
                                    } else {
                                        console.log("✅ L'état est déjà correct.");
                                    }
                                }
                            } else {
                                console.warn("⚠️ Impossible de retrouver la ligne du compte dans le tableau.");
                            }

                            console.log("⏳ Stabilisation de l'interface (3s)...");
                            await window.attendrePause(3000); 
                            
                        }
                    }
                } else {
                    console.error("❌ Bouton 'Ajouter' introuvable après 10s d'attente. Fin de la boucle.");
                    break;
                }
            }
            console.log("🎉 Tous les comptes VPN ont été créés ! En attente de la suite...");
        }
    }
    
    /* ⚠️ SUPPRESSION DU RETOUR À L'ACCUEIL POUR ENCHAÎNER DIRECTEMENT SUR LES PARAMÈTRES AVANCÉS */
};