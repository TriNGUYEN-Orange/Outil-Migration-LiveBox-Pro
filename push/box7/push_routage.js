/* --- /push/box7/push_routage.js --- */

window.executerRoutage = async function() {
    console.log("⏳ Application des paramètres de Routage...");

    /* 🚨 Lecture directe et sécurisée depuis le localStorage */
    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    
    try {
        configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox;
    } catch(e) {
        console.error("❌ ERREUR: Le format JSON dans le LocalStorage est invalide.");
        return;
    }

    if (!configurationActuelle || !configurationActuelle.routage || !configurationActuelle.routage["table de routage"]) {
        console.warn("⚠️ Pas de données de Routage trouvées à appliquer. Module ignoré !");
        return;
    }

    let tableRoutage = configurationActuelle.routage["table de routage"];
                
    let btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 10000);
    
    if (btnAvance) {
        window.cliquerBouton("#sah_footer .icon-advanced");
        await window.attendrePause(1000); 
        
        let tuileReseauAvance = await window.attendreElement("#networkAdvanced", 10000);
        
        if (tuileReseauAvance) {
            tuileReseauAvance.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await window.attendrePause(300);
            
            window.cliquerBouton("#networkAdvanced .widget");
            await window.attendrePause(1500);
            
            let iframe = await window.attendreElement("#iframeapp", 10000);
            if (iframe) {
                
                console.log("⏳ Attente de l'écran de chargement...");
                await new Promise((resolve) => {
                    let intervalle = setInterval(() => {
                        try {
                            let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                            if (docIframe && docIframe.readyState === "complete") {
                                let loading = docIframe.querySelector("body > div.loading_screen");
                                if (!loading || window.getComputedStyle(loading).display === "none") {
                                    clearInterval(intervalle);
                                    resolve();
                                }
                            }
                        } catch(e) {}
                    }, 300);
                    setTimeout(() => { clearInterval(intervalle); resolve(); }, 15000);
                });
                await window.attendrePause(500); /* Petit buffer de sécurité */

                let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                
                let ongletRoutage = await window.attendreElementDansDoc(docIframe, "#tab_information_routing", 5000);
                
                if (ongletRoutage) {
                    window.cliquerPur(ongletRoutage);
                    await window.attendrePause(1500); 
                    
                    if (Array.isArray(tableRoutage) && tableRoutage.length > 0) {
                        
                        /* Boucle pour ajouter chaque route */
                        for (let i = 0; i < tableRoutage.length; i++) {
                            let route = tableRoutage[i];
                            
                            let btnAddRule = await window.attendreElementDansDoc(docIframe, "#addRule", 5000);
                            
                            if (btnAddRule) {
                                window.cliquerPur(btnAddRule);
                                await window.attendrePause(1000); 
                                
                                if (route["Réseau de destination"]) {
                                    window.ecrireTexteDansDoc(docIframe, "#destinationIP", route["Réseau de destination"]);
                                }
                                
                                if (route["Masque du sous-réseau de destination"]) {
                                    window.ecrireTexteDansDoc(docIframe, "#subnetDestinationIP", route["Masque du sous-réseau de destination"]);
                                }
                                
                                if (route["Passerelle"]) {
                                    window.ecrireTexteDansDoc(docIframe, "#gateway", route["Passerelle"]);
                                }
                                
                                if (route["Métrique"] !== undefined) {
                                    window.ecrireTexteDansDoc(docIframe, "#metric", route["Métrique"].toString());
                                }
                                
                                if (typeof route["Activé"] !== "undefined") {
                                    let cbActive = docIframe.querySelector("#routingAcitvate_true");
                                    if (cbActive && cbActive.checked !== route["Activé"]) {
                                        cbActive.click();
                                        await window.attendrePause(300);
                                    }
                                }
                                
                                let btnSubmitRule = docIframe.querySelector("#popup_addRule_submit");
                                if (btnSubmitRule) {
                                    window.cliquerPur(btnSubmitRule);
                                    
                                    await new Promise((resolve) => {
                                        let intv = setInterval(() => {
                                            try {
                                                let loading = docIframe.querySelector("body > div.loading_screen");
                                                if (!loading || window.getComputedStyle(loading).display === "none") {
                                                    clearInterval(intv); resolve();
                                                }
                                            } catch(e) {}
                                        }, 300);
                                        setTimeout(() => { clearInterval(intv); resolve(); }, 15000);
                                    });
                                    await window.attendrePause(500);
                                }
                            }
                        }
                        console.log("✅ Configuration du Routage terminée !");
                    }
                } else {
                    console.warn("⚠️ #tab_information_routing introuvable.");
                }
            }
        }
    }
    
    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
    }
};