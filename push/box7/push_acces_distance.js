const CODE_PUSH_ACCES_DISTANCE = `
    /* --- ÉTAPE : CONFIGURATION DE L'ACCÈS À DISTANCE --- */
    console.log("⏳ Application des paramètres d'Accès à distance...");

    if (configLivebox && configLivebox["accès à distance"]) {
        let btnAvance = await attendreElement("#sah_footer .icon-advanced", 10000);
        
        if (btnAvance) {
            cliquerBouton("#sah_footer .icon-advanced");
            await attendrePause(800); 
            
            let tuileAcces = await attendreElement("#internetRemote", 10000);
            if (tuileAcces) {
                tuileAcces.scrollIntoView({ behavior: 'smooth', block: 'center' });
                cliquerBouton("#internetRemote .widget");
                
                let iframe = await attendreElement("#iframeapp", 10000);
                if (iframe) {
                    let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                    let radioTrue = await attendreElementDansDoc(docIframe, "#admin_true", 10000);
                    
                    if (radioTrue) {
                        let configAcces = configLivebox["accès à distance"];
                        let etatVoulu = configAcces["état"] ? configAcces["état"].toLowerCase() : "désactivé";
                        let estActiveVoulu = (etatVoulu === "activé" || etatVoulu === "active");
                        
                        let radioFalse = docIframe.querySelector("#admin_false");

                        if (estActiveVoulu) {
                            /* --- MODE ACTIVÉ --- */
                            if (!radioTrue.checked) {
                                let labelTrue = docIframe.querySelector('label[for="admin_true"]');
                                if (labelTrue) cliquerPur(labelTrue);
                                else cliquerPur(radioTrue);
                                await attendrePause(500);
                            }
                            
                            /* Remplir les champs UNIQUEMENT si l'accès est activé */
                            if (configAcces["identifiant"]) {
                                ecrireTexteDansDoc(docIframe, "#login", configAcces["identifiant"]);
                            }
                            
                            if (configAcces["mot de passe"]) {
                                let mdpValide = await obtenirMotDePasseConforme(configAcces["mot de passe"], "Accès à distance");
                                if (mdpValide) {
                                    ecrireTexteDansDoc(docIframe, "#remote_password", mdpValide);
                                    configAcces["mot de passe"] = mdpValide; 
                                }
                            }
                            
                            if (configAcces["port"]) {
                                let portActuel = parseInt(configAcces["port"], 10);
                                if (!isNaN(portActuel) && portActuel < 10000) portActuel = portActuel + 10000;
                                ecrireTexteDansDoc(docIframe, "#port", portActuel.toString());
                            }

                        } else {
                            /* --- MODE DÉSACTIVÉ --- */
                            if (radioFalse && !radioFalse.checked) {
                                let labelFalse = docIframe.querySelector('label[for="admin_false"]');
                                if (labelFalse) cliquerPur(labelFalse);
                                else cliquerPur(radioFalse);
                                await attendrePause(500);
                            }
                            /* 🚨 On ignore complètement la saisie des identifiants pour ne pas réactiver le bouton par erreur */
                        }
                        
                        /* Sauvegarde */
                        let btnSave = docIframe.querySelector("#submit") || docIframe.querySelector("#save");
                        if (btnSave) {
                            cliquerPur(btnSave);
                            await attendreFinSauvegarde(docIframe);
                        }
                    }
                }
            }
        }
        await retournerAccueil();
    }
`;