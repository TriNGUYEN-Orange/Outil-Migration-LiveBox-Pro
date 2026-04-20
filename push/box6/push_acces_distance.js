/* --- /push/box6/push_acces_distance.js --- */

window.executerAccesDistance = async function() {
    console.log("⏳ Application des paramètres d'Accès à distance (Box 6)...");

    /* 1. Lecture de la configuration */
    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    try { configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox; } 
    catch(e) { return; }

    if (!configurationActuelle || !configurationActuelle["accès à distance"]) {
        console.warn("⚠️ Pas de données Accès à distance trouvées à appliquer."); return;
    }

    let configAcces = configurationActuelle["accès à distance"];

    /* 2. Navigation vers les Paramètres Avancés */
    let btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 10000);
    
    if (btnAvance) {
        window.cliquerBouton("#sah_footer .icon-advanced");
        await window.attendrePause(1500); 
        
        /* 3. Recherche de la tuile Accès à distance */
        let tuileAcces = await window.attendreElement("#internetRemote", 10000);
        if (tuileAcces) {
            tuileAcces.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await window.attendrePause(500);
            
            console.log("👉 Clic sur la tuile Accès à distance...");
            let widget = tuileAcces.querySelector(".widget");
            window.cliquerBouton(widget ? widget : tuileAcces);
            
            /* 4. Attente de l'iframe avec anti-freeze */
            let iframe = await window.attendreElement("#iframeapp", 15000);
            if (iframe) {
                console.log("⏳ Attente du chargement complet de l'iframe...");
                await new Promise((resolve) => {
                    let intervalle = setInterval(() => {
                        try {
                            let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                            if (docIframe && docIframe.readyState === "complete") {
                                let loading = docIframe.querySelector("body > div.loading_screen");
                                if (!loading || window.getComputedStyle(loading).display === "none") {
                                    clearInterval(intervalle); resolve();
                                }
                            }
                        } catch(e) {}
                    }, 500);
                    setTimeout(() => { clearInterval(intervalle); resolve(); }, 15000);
                });
                await window.attendrePause(500); 

                let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                let radioTrue = await window.attendreElementDansDoc(docIframe, "#admin_true", 10000);
                
                if (radioTrue) {
                    let etatVoulu = configAcces["état"] ? configAcces["état"].toLowerCase() : "désactivé";
                    let estActiveVoulu = (etatVoulu === "activé" || etatVoulu === "active");
                    
                    let radioFalse = docIframe.querySelector("#admin_false");

                    if (estActiveVoulu) {
                        /* --- MODE ACTIVÉ --- */
                        if (!radioTrue.checked) {
                            let labelTrue = docIframe.querySelector('label[for="admin_true"]');
                            if (labelTrue) window.cliquerPur(labelTrue);
                            else window.cliquerPur(radioTrue);
                            await window.attendrePause(500);
                        }
                        
                        /* Remplir les champs UNIQUEMENT si l'accès est activé */
                        if (configAcces["identifiant"]) {
                            window.ecrireTexteDansDoc(docIframe, "#login", configAcces["identifiant"]);
                        }
                        
                        if (configAcces["mot de passe"]) {
                            let mdpValide = typeof window.obtenirMotDePasseConforme === "function" ? await window.obtenirMotDePasseConforme(configAcces["mot de passe"], "Accès à distance") : configAcces["mot de passe"];
                            if (mdpValide) {
                                window.ecrireTexteDansDoc(docIframe, "#remote_password", mdpValide);
                                configAcces["mot de passe"] = mdpValide; 
                            }
                        }
                        
                        if (configAcces["port"]) {
                            let portActuel = parseInt(configAcces["port"], 10);
                            if (!isNaN(portActuel) && portActuel < 10000) portActuel = portActuel + 10000;
                            window.ecrireTexteDansDoc(docIframe, "#port", portActuel.toString());
                        }

                    } else {
                        /* --- MODE DÉSACTIVÉ --- */
                        if (radioFalse && !radioFalse.checked) {
                            let labelFalse = docIframe.querySelector('label[for="admin_false"]');
                            if (labelFalse) window.cliquerPur(labelFalse);
                            else window.cliquerPur(radioFalse);
                            await window.attendrePause(500);
                        }
                        /* 🚨 On ignore complètement la saisie des identifiants pour ne pas réactiver le bouton par erreur */
                    }
                    
                    /* 5. Sauvegarde robuste */
                    let btnSave = docIframe.querySelector("#submit") || docIframe.querySelector("#save");
                    if (btnSave) {
                        if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave);
                        else btnSave.click();

                        console.log("⏳ Sauvegarde en cours...");
                        await new Promise((resolve) => {
                            let intv = setInterval(() => {
                                try {
                                    let currentDoc = iframe.contentDocument || iframe.contentWindow.document;
                                    if (currentDoc) {
                                        let loading = currentDoc.querySelector("body > div.loading_screen");
                                        if (!loading || window.getComputedStyle(loading).display === "none") {
                                            clearInterval(intv); resolve();
                                        }
                                    }
                                } catch(e) {}
                            }, 1000);
                            setTimeout(() => { clearInterval(intv); resolve(); }, 30000);
                        });
                        await window.attendrePause(1000);
                    }
                } else {
                    console.warn("⚠️ Bouton #admin_true introuvable dans l'iframe.");
                }
            } else {
                console.warn("⚠️ L'iframe de l'Accès à distance n'a pas chargé.");
            }
        } else {
            console.warn("⚠️ La tuile #internetRemote est introuvable.");
        }
    }
    
    console.log("🔄 Retour à l'accueil...");
    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
        await window.attendrePause(2000); /* Attente pour l'animation de retour */
    }
};