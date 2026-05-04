/* --- /push/box7/push_acces_distance.js --- */

window.executerAccesDistance = async function() {
    console.log("⏳ Application des paramètres d'Accès à distance...");

    let configJSON = localStorage.getItem("livebox_migration_config");
    if (!configJSON) return;
    let configLivebox = JSON.parse(configJSON);

    if (configLivebox && configLivebox["accès à distance"]) {
        let btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 10000);
        
        if (btnAvance) {
            window.cliquerBouton("#sah_footer .icon-advanced");
            await window.attendrePause(800); 
            
            let tuileAcces = await window.attendreElement("#internetRemote", 10000);
            if (tuileAcces) {
                tuileAcces.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await window.attendrePause(500);
                
                window.cliquerBouton("#internetRemote .widget");
                
                let iframe = await window.attendreElement("#iframeapp", 10000);
                if (iframe) {
                    let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                    
                    /* 🚨 Box 7 utilise une CHECKBOX unique (#admin_true), pas de boutons radio ! */
                    let checkboxAdmin = await window.attendreElementDansDoc(docIframe, "#admin_true", 10000);
                    
                    if (checkboxAdmin) {
                        let configAcces = configLivebox["accès à distance"];
                        let etatVoulu = configAcces["état"] ? configAcces["état"].toLowerCase() : "désactivé";
                        let estActiveVoulu = (etatVoulu === "activé" || etatVoulu === "active");

                        /* Fonction pour forcer le basculement de la checkbox et alerter l'interface */
                        const forcerCheckbox = (cocheVoulue) => {
                            if (checkboxAdmin.checked !== cocheVoulue) {
                                let label = docIframe.querySelector('label[for="admin_true"]');
                                if (label) {
                                    window.cliquerPur(label);
                                    label.click(); 
                                } else {
                                    window.cliquerPur(checkboxAdmin);
                                    checkboxAdmin.click();
                                }
                                checkboxAdmin.checked = cocheVoulue;
                                checkboxAdmin.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        };

                        if (estActiveVoulu) {
                            /* --- MODE ACTIVÉ --- */
                            forcerCheckbox(true);
                            await window.attendrePause(800);
                            
                            /* Remplir les champs UNIQUEMENT si l'accès est activé */
                            if (configAcces["identifiant"]) {
                                window.ecrireTexteDansDoc(docIframe, "#login", configAcces["identifiant"]);
                                let inpLogin = docIframe.querySelector("#login");
                                if (inpLogin) {
                                    inpLogin.dispatchEvent(new Event('input', { bubbles: true }));
                                    inpLogin.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                                await window.attendrePause(200);
                            }
                            
                            if (configAcces["mot de passe"]) {
                                let mdpValide = configAcces["mot de passe"];
                                if (typeof window.obtenirMotDePasseConforme === "function") {
                                    mdpValide = await window.obtenirMotDePasseConforme(configAcces["mot de passe"], "Accès à distance");
                                } else if (window.PushUI && typeof window.PushUI.validerMotDePasse === "function") {
                                    mdpValide = await window.PushUI.validerMotDePasse(configAcces["mot de passe"], "Accès à distance");
                                }

                                if (mdpValide) {
                                    window.ecrireTexteDansDoc(docIframe, "#remote_password", mdpValide);
                                    let inpPass = docIframe.querySelector("#remote_password");
                                    if (inpPass) {
                                        inpPass.dispatchEvent(new Event('input', { bubbles: true }));
                                        inpPass.dispatchEvent(new Event('change', { bubbles: true }));
                                    }
                                    configAcces["mot de passe"] = mdpValide; 
                                    await window.attendrePause(200);
                                }
                            }
                            
                            if (configAcces["port"]) {
                                let portActuel = parseInt(configAcces["port"], 10);
                                if (!isNaN(portActuel) && portActuel < 10000) portActuel = portActuel + 10000;
                                window.ecrireTexteDansDoc(docIframe, "#port", portActuel.toString());
                                let inpPort = docIframe.querySelector("#port");
                                if (inpPort) {
                                    inpPort.dispatchEvent(new Event('input', { bubbles: true }));
                                    inpPort.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                                await window.attendrePause(200);
                            }

                        } else {
                            /* --- MODE DÉSACTIVÉ --- */
                            forcerCheckbox(false);
                            await window.attendrePause(800);
                        }
                        
                        /* Réactiver l'interface avant de sauvegarder */
                        docIframe.body.dispatchEvent(new Event('click', { bubbles: true }));
                        await window.attendrePause(800);

                        /* Sauvegarde */
                        let btnSave = docIframe.querySelector("#submit, #save, #bt_save, .btn-save");
                        if (btnSave) {
                            btnSave.removeAttribute("disabled"); 
                            btnSave.classList.remove("disabled");
                            
                            window.cliquerPur(btnSave);
                            btnSave.click();
                            await window.attendreFinSauvegarde(docIframe);
                        } else {
                            console.warn("⚠️ Bouton Save introuvable dans l'interface !");
                        }
                    } else {
                        console.error("❌ ERREUR : La case #admin_true est introuvable.");
                    }
                }
            }
        }
        await window.retournerAccueil();
    }
};