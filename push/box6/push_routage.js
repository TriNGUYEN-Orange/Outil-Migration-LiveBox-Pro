/* --- /push/box7/push_routage.js --- */

window.executerRoutage = async function() {
    console.log("⏳ Application des paramètres de Routage...");

    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    
    try { configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox; } 
    catch(e) { return; }

    if (!configurationActuelle || !configurationActuelle.routage || !configurationActuelle.routage["table de routage"]) {
        console.warn("⚠️ Pas de données de Routage trouvées à appliquer."); return;
    }

    let tableRoutage = configurationActuelle.routage["table de routage"];
    if (!Array.isArray(tableRoutage) || tableRoutage.length === 0) return;

    /* =================================================================================== */
    /* 🛡️ BOUCLIER ANTI-SCROLL (Protection pendant la saisie)                              */
    /* =================================================================================== */
    const bloquerScroll = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
    window.addEventListener('wheel', bloquerScroll, { passive: false });
    window.addEventListener('touchmove', bloquerScroll, { passive: false });
    window.addEventListener('DOMMouseScroll', bloquerScroll, { passive: false });
    let oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const libererScroll = () => {
        window.removeEventListener('wheel', bloquerScroll);
        window.removeEventListener('touchmove', bloquerScroll);
        window.removeEventListener('DOMMouseScroll', bloquerScroll);
        document.body.style.overflow = oldOverflow;
    };

    try {
        if (typeof window.retournerAccueil === "function") {
            await window.retournerAccueil();
            await window.attendrePause(1000); 
        }

        /* 1. Navigation vers le menu avancé */
        let btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 10000);
        if (!btnAvance) throw new Error("Bouton Avancé introuvable");
        
        window.cliquerBouton("#sah_footer .icon-advanced");
        await window.attendrePause(1000); 
        
        /* 2. Navigation vers la tuile Réseau Avancé */
        let tuileReseauAvance = await window.attendreElement("#networkAdvanced", 10000);
        if (!tuileReseauAvance) throw new Error("Tuile Réseau Avancé introuvable");
        
        tuileReseauAvance.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await window.attendrePause(300);
        window.cliquerBouton("#networkAdvanced .widget");
        await window.attendrePause(1500);
        
        /* 3. Entrée dans l'Iframe */
        let iframe = await window.attendreElement("#iframeapp", 10000);
        if (!iframe) throw new Error("Iframe réseau introuvable");

        console.log("⏳ Attente de l'écran de chargement de l'iframe...");
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
        await window.attendrePause(500);

        let docIframe = iframe.contentDocument || iframe.contentWindow.document;
        
        /* 4. Onglet Routage */
        let ongletRoutage = await window.attendreElementDansDoc(docIframe, "#tab_information_routing", 5000);
        if (!ongletRoutage) {
            console.error("❌ Onglet Routage introuvable dans l'iframe.");
            return;
        }

        if (typeof window.cliquerPur === "function") window.cliquerPur(ongletRoutage);
        else ongletRoutage.click();
        await window.attendrePause(1500); 

        /* =================================================================================== */
        /* FONCTIONS DE VALIDATION IP ET SAISIE IFRAME                                         */
        /* =================================================================================== */
        
        /* Regex stricte pour une adresse IPv4 valide (0-255.0-255.0-255.0-255) */
        const regleIP = (v) => v && /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v);
        
        const validerIP = async (ipActuelle, nomChamp) => {
            let val = ipActuelle;
            let titre = `⚠️ ${nomChamp} Invalide`;
            while (!regleIP(val)) {
                /* Appel direct à la merveilleuse interface UI que nous avons créée */
                val = await window.PushUI.afficherPopupValidation(titre, "Format attendu : IPv4 (ex: 192.168.1.x ou 255.255.255.x)", val, regleIP);
                if (val === null) return null;
            }
            return val;
        };

        const remplirChampIframe = async (doc, selecteur, valeur) => {
            let champ = doc.querySelector(selecteur);
            if (champ) {
                champ.scrollIntoView({ behavior: 'instant', block: 'center' });
                champ.focus();
                champ.value = "";
                champ.dispatchEvent(new Event('input', { bubbles: true }));
                champ.value = valeur;
                champ.dispatchEvent(new Event('input', { bubbles: true }));
                champ.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: '0' }));
                champ.dispatchEvent(new Event('change', { bubbles: true }));
                champ.blur();
                await window.attendrePause(300);
            }
        };

        /* =================================================================================== */
        /* BOUCLE D'APPLICATION DES ROUTES                                                     */
        /* =================================================================================== */
        for (let i = 0; i < tableRoutage.length; i++) {
            let route = tableRoutage[i];
            console.log(`⏳ Configuration de la route : ${route["Réseau de destination"]}`);

            /* --- Validation des IP par l'utilisateur si nécessaire --- */
            let reseauConf = await validerIP(route["Réseau de destination"], "Réseau Destination");
            if (reseauConf === null) { console.log("⏭️ Route ignorée."); continue; }

            let masqueConf = await validerIP(route["Masque du sous-réseau de destination"], "Masque Sous-Réseau");
            if (masqueConf === null) { console.log("⏭️ Route ignorée."); continue; }

            let gwConf = await validerIP(route["Passerelle"], "Passerelle (Gateway)");
            if (gwConf === null) { console.log("⏭️ Route ignorée."); continue; }

            /* --- Ajout de la règle --- */
            let btnAddRule = await window.attendreElementDansDoc(docIframe, "#addRule", 5000);
            if (btnAddRule) {
                btnAddRule.scrollIntoView({ behavior: 'instant', block: 'center' });
                if (typeof window.cliquerPur === "function") window.cliquerPur(btnAddRule);
                else btnAddRule.click();
                await window.attendrePause(1000); 

                /* Remplissage sécurisé GWT */
                await remplirChampIframe(docIframe, "#destinationIP", reseauConf);
                await remplirChampIframe(docIframe, "#subnetDestinationIP", masqueConf);
                await remplirChampIframe(docIframe, "#gateway", gwConf);
                
                if (route["Métrique"] !== undefined) {
                    await remplirChampIframe(docIframe, "#metric", route["Métrique"].toString());
                }
                
                /* Activer / Désactiver la règle */
                let veutEtreActif = !(route["Activé"] === false || String(route["Activé"]).toLowerCase() === "false");
                let cbActive = docIframe.querySelector("#routingAcitvate_true, input[type='radio'][value='true'], input[type='checkbox']");
                if (cbActive && cbActive.checked !== veutEtreActif) {
                    cbActive.click();
                    await window.attendrePause(300);
                }
                
                /* Enregistrer */
                let btnSubmitRule = docIframe.querySelector("#popup_addRule_submit");
                if (btnSubmitRule) {
                    if (typeof window.cliquerPur === "function") window.cliquerPur(btnSubmitRule);
                    else btnSubmitRule.click();
                    
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

    } finally {
        /* On rend toujours la molette à l'utilisateur ! */
        libererScroll();
    }
    
    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
        await window.attendrePause(2000);
    }
};