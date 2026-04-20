/* --- /push/box6/push_wakeup.js --- */

window.executerWakeUp = async function() {
    console.log("⏳ [PARCOURS WAKE-UP] Réveil complet de la Livebox 6 (Exploration totale)...");

    /* 1. Clic sur le footer réseau pour forcer l'animation */
    let btnReseau = await window.attendreElement("#sah_footer .icon-network", 5000);
    if (btnReseau) {
        window.cliquerBouton("#sah_footer .icon-network");
        await window.attendrePause(1500); 

        /* 2. Clic sur la tuile Wi-Fi (Boucle de réveil) */
        let selecteurVraiWidget = ".swiper-slide-active #wifiAdvanced_Fav, .swiper-slide-active .wifiAdvanced.selectable";
        let tuileActive = document.querySelector(selecteurVraiWidget);
        if (!tuileActive) tuileActive = document.querySelector("#wifiAdvanced_Fav, .wifiAdvanced.selectable");

        let iframe = null;
        if (tuileActive) {
            console.log("👉 [WAKE-UP] Clic sur la tuile Wi-Fi...");
            /* Boucle anti-freeze pour être sûr d'entrer */
            for (let i = 1; i <= 3; i++) {
                window.cliquerBouton(tuileActive);
                iframe = await window.attendreElement("#iframeapp", 4000);
                if (iframe) break;
                console.warn("⚠️ [WAKE-UP] Box figée, nouvel essai (" + i + "/3)...");
            }
        }

        /* 3. Parcours complet dans l'Iframe (Sans rien modifier) */
        if (iframe) {
            console.log("⏳ [WAKE-UP] Chargement de l'Iframe...");
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
            
            /* Vérifier si la page principale est chargée */
            let btnActivation24 = await window.attendreElementDansDoc(docIframe, "#wifi_accesspoint24, #wifi_accesspointboth", 5000);
            if (btnActivation24) {
                
                /* --- A. Visite de l'onglet 2.4 GHz --- */
                let lien24 = await window.attendreElementDansDoc(docIframe, "#wifi_accesspoint24_link, #wifi_accesspointboth", 3000);
                if (lien24) {
                    console.log("🚶 [WAKE-UP] Visite de l'onglet 2.4 GHz...");
                    if (typeof window.cliquerPur === "function") window.cliquerPur(lien24);
                    else lien24.click();
                    
                    /* Attendre que le champ SSID apparaisse pour confirmer le chargement */
                    await window.attendreElementDansDoc(docIframe, "#wifi_private_ssid", 3000);
                    await window.attendrePause(500);

                    /* Ouvrir les paramètres avancés pour tout mettre en cache */
                    let lienAvance = docIframe.querySelector("#advanced_parameters_link");
                    if (lienAvance) {
                        console.log("🚶 [WAKE-UP] Dépliage des paramètres avancés (2.4 GHz)...");
                        if (typeof window.cliquerPur === "function") window.cliquerPur(lienAvance);
                        else lienAvance.click();
                        await window.attendrePause(500);
                    }
                }

                /* --- B. Visite de l'onglet 5 GHz --- */
                docIframe = iframe.contentDocument || iframe.contentWindow.document; // Rafraîchir le contexte
                let lien5 = await window.attendreElementDansDoc(docIframe, "#wifi_accesspoint5_link_txt, #wifi_accesspoint5_link", 3000);
                if (lien5) {
                    console.log("🚶 [WAKE-UP] Visite de l'onglet 5 GHz...");
                    if (typeof window.cliquerPur === "function") window.cliquerPur(lien5);
                    else lien5.click();
                    
                    /* Attendre que le champ SSID 5G apparaisse */
                    await window.attendreElementDansDoc(docIframe, "#wifi_private_ssid", 3000);
                    await window.attendrePause(500);
                    
                    let lienAvance5 = docIframe.querySelector("#advanced_parameters_link");
                    if (lienAvance5) {
                        console.log("🚶 [WAKE-UP] Dépliage des paramètres avancés (5 GHz)...");
                        if (typeof window.cliquerPur === "function") window.cliquerPur(lienAvance5);
                        else lienAvance5.click();
                        await window.attendrePause(500);
                    }
                }

                console.log("✅ [WAKE-UP] Parcours de mise en cache terminé (Aucune modification effectuée) !");
            }
        }
    }

    /* 4. Retour à l'accueil pour laisser le terrain propre */
    console.log("🔄 [WAKE-UP] Retour à l'accueil...");
    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
        /* Pause vitale pour laisser l'animation de retour se terminer */
        await window.attendrePause(2000); 
    }
};