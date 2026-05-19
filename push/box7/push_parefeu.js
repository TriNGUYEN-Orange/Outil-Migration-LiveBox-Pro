/* --- /push/box7/push_parefeu.js --- */

window.executerParefeu = async function() {
    console.log("⏳ Application des paramètres du Pare-feu...");

    /* Récupération des données globales de migration */
    let configJSON = localStorage.getItem("livebox_migration_config");
    if (!configJSON) return;
    let configLivebox = JSON.parse(configJSON);

    if (configLivebox && configLivebox.parefeu) {
        
        let btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 10000);
        
        if (btnAvance) {
            window.cliquerBouton("#sah_footer .icon-advanced");
            await window.attendrePause(800); 
            
            let btnPareFeu = await window.attendreElement("#networkFirewall", 10000);
            if (btnPareFeu) {
                btnPareFeu.scrollIntoView({ behavior: 'smooth', block: 'center' });
                window.cliquerBouton("#networkFirewall");
                
                let iframe = await window.attendreElement("#iframeapp", 10000);
                if (iframe) {
                    let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                    
                    /* IDÉE : Attendre que le conteneur des boutons radio (div#security) soit complètement chargé[cite: 19] */
                    console.log("⏳ Attente du chargement complet du bloc Pare-feu...");
                    let conteneurSecurity = await window.attendreElementDansDoc(docIframe, "div#security", 10000);
                    
                    if (conteneurSecurity) {
                        /* Pause de 0.5s pour s'assurer que Ractive.js est prêt à intercepter le clic[cite: 19] */
                        await window.attendrePause(500); 
                        
                        let niveauVoulu = (configLivebox.parefeu["niveau de protection"] || "moyen").toLowerCase();
                        let idCible = "#security_Medium"; 
                        
                        if (niveauVoulu.includes("faible")) idCible = "#security_Low";
                        else if (niveauVoulu.includes("élevé") || niveauVoulu.includes("eleve")) idCible = "#security_High";
                        else if (niveauVoulu.includes("personnalisé") || niveauVoulu.includes("personnalise")) idCible = "#security_Custom";
                        else if (niveauVoulu.includes("intermédiaire") || niveauVoulu.includes("intermediaire")) idCible = "#security_IntermediateP";
                        
                        let radioCible = docIframe.querySelector(idCible);
                        
                        if (radioCible && !radioCible.checked) {
                            console.log("👉 Application du niveau de pare-feu : " + niveauVoulu);
                            
                            /* 🚨 ASTUCE : Cliquer sur la balise LABEL au lieu du bouton radio lui-même[cite: 19] */
                            let nomId = idCible.replace('#', '');
                            let labelCible = docIframe.querySelector('label[for="' + nomId + '"]');
                            
                            if (labelCible) {
                                window.cliquerPur(labelCible);
                            } else {
                                window.cliquerPur(radioCible); /* Solution de repli[cite: 19] */
                            }
                            
                            await window.attendrePause(800); /* Attendre que l'interface enregistre le clic[cite: 19] */
                            
                            let btnSave = docIframe.querySelector("#submit");
                            if (btnSave) {
                                window.cliquerPur(btnSave);
                                await window.attendreFinSauvegarde(docIframe);
                                
                                /* Enregistrement de l'action pour le Bilan UI (Optionnel) */
                                if (window.PushUI && typeof window.PushUI.enregistrerModification === "function") {
                                    window.PushUI.enregistrerModification("Pare-feu", "Niveau de protection", "Ancien Niveau", niveauVoulu);
                                }
                            }
                        } else {
                            console.log("✅ Le niveau de pare-feu est déjà sur : " + niveauVoulu);
                        }
                    } else {
                        console.warn("⚠️ Le conteneur div#security n'est pas apparu.");
                    }
                }
            }
        }
        await window.retournerAccueil();
    }
};