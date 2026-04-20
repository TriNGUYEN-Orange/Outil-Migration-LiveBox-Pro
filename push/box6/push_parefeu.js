/* --- /push/box6/push_parefeu.js --- */

window.executerParefeu = async function() {
    console.log("⏳ Application des paramètres du Pare-feu (Box 6)...");

    /* 1. Lecture de la configuration */
    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    try { configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox; } 
    catch(e) { return; }

    if (!configurationActuelle || !configurationActuelle.parefeu) {
        console.warn("⚠️ Pas de données Pare-feu trouvées à appliquer."); return;
    }

    /* 2. Navigation vers les Paramètres Avancés */
    let btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 10000);
    
    if (btnAvance) {
        window.cliquerBouton("#sah_footer .icon-advanced");
        await window.attendrePause(1500); 
        
        /* 3. Recherche et clic sur la tuile Pare-feu */
        let tuilePareFeu = await window.attendreElement("#networkFirewall", 10000);
        if (tuilePareFeu) {
            tuilePareFeu.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await window.attendrePause(500);
            
            console.log("👉 Clic sur la tuile Pare-feu...");
            let widget = tuilePareFeu.querySelector(".widget");
            window.cliquerBouton(widget ? widget : tuilePareFeu);
            
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
                
                /* 5. Configuration du niveau de sécurité */
                let conteneurSecurity = await window.attendreElementDansDoc(docIframe, "div#security", 10000);
                
                if (conteneurSecurity) {
                    await window.attendrePause(500); 
                    
                    let niveauVoulu = (configurationActuelle.parefeu["niveau de protection"] || "moyen").toLowerCase();
                    let idCible = "#security_Medium"; 
                    
                    if (niveauVoulu.includes("faible")) idCible = "#security_Low";
                    else if (niveauVoulu.includes("élevé") || niveauVoulu.includes("eleve")) idCible = "#security_High";
                    else if (niveauVoulu.includes("personnalisé") || niveauVoulu.includes("personnalise")) idCible = "#security_Custom";
                    else if (niveauVoulu.includes("intermédiaire") || niveauVoulu.includes("intermediaire")) idCible = "#security_IntermediateP";
                    
                    let radioCible = docIframe.querySelector(idCible);
                    
                    if (radioCible && !radioCible.checked) {
                        console.log("👉 Application du niveau de pare-feu : " + niveauVoulu);
                        
                        let nomId = idCible.replace('#', '');
                        let labelCible = docIframe.querySelector('label[for="' + nomId + '"]');
                        
                        /* Clic de précision (Label prioritaire) */
                        if (labelCible) {
                            if (typeof window.cliquerPur === "function") window.cliquerPur(labelCible);
                            else labelCible.click();
                        } else {
                            if (typeof window.cliquerPur === "function") window.cliquerPur(radioCible);
                            else radioCible.click();
                        }
                        
                        await window.attendrePause(800); 
                        
                        /* 6. Sauvegarde robuste */
                        let btnSave = docIframe.querySelector("#submit");
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
                        console.log("✅ Le niveau de pare-feu est déjà sur : " + niveauVoulu);
                    }
                } else {
                    console.warn("⚠️ Le conteneur div#security n'est pas apparu.");
                }
            } else {
                console.warn("⚠️ L'iframe du Pare-feu n'a pas chargé.");
            }
        } else {
            console.warn("⚠️ La tuile #networkFirewall est introuvable.");
        }
    }
    
    console.log("🔄 Retour à l'accueil...");
    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
        await window.attendrePause(2000); /* Attente pour l'animation de retour */
    }
};