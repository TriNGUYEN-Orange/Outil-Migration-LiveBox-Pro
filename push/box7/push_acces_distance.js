/* --- /push/box7/push_acces_distance.js --- */

window.executerAccesDistance = async function() {
    console.log("⏳ Application des paramètres d'Accès à distance (Box 7)...");

    /* 1) Lecture de la configuration */
    let configurationActuelle = window.configLivebox;

    if (!configurationActuelle && typeof window.chargerConfiguration === "function") {
        try {
            configurationActuelle = await window.chargerConfiguration();
            window.configLivebox = configurationActuelle;
        } catch (e) {
            throw new Error("Configuration non décodable (accès à distance).");
        }
    }

    if (!configurationActuelle) {
        throw new Error("Configuration absente (accès à distance).");
    }


    const configAcces = configurationActuelle["accès à distance"];

    /* =================================================================================== */
    /* 🛡️ BOUCLIER ANTI-SCROLL (Protection pendant la saisie)                             */
    /* =================================================================================== */
    const bloquerScroll = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
    window.addEventListener("wheel", bloquerScroll, { passive: false });
    window.addEventListener("touchmove", bloquerScroll, { passive: false });
    window.addEventListener("DOMMouseScroll", bloquerScroll, { passive: false });
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const libererScroll = () => {
        window.removeEventListener("wheel", bloquerScroll);
        window.removeEventListener("touchmove", bloquerScroll);
        window.removeEventListener("DOMMouseScroll", bloquerScroll);
        document.body.style.overflow = oldOverflow;
    };

    try {
        /* 2) Navigation vers paramètres avancés */
        let btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 5000);
        if (!btnAvance) throw new Error("Timeout: bouton Paramètres avancés introuvable (#sah_footer .icon-advanced).");

        let clicAvanceOk = window.cliquerBouton("#sah_footer .icon-advanced");
        if (!clicAvanceOk) throw new Error("Impossible de cliquer sur Paramètres avancés (#sah_footer .icon-advanced).");

        await window.attendrePause(1500);

        /* 3) Tuile Accès à distance */
        let tuileAcces = await window.attendreElement("#internetRemote", 5000);
        if (!tuileAcces) throw new Error("Timeout: tuile Accès à distance introuvable (#internetRemote).");

        tuileAcces.scrollIntoView({ behavior: "smooth", block: "center" });
        await window.attendrePause(500);

        console.log("👉 Clic sur la tuile Accès à distance...");
        let widget = tuileAcces.querySelector(".widget");
        let clicTuileOk = window.cliquerBouton(widget ? widget : tuileAcces);
        if (!clicTuileOk) throw new Error("Impossible de cliquer sur la tuile Accès à distance.");

        /* 4) Attente iframe + chargement complet */
        let iframe = await window.attendreElement("#iframeapp", 5000);
        if (!iframe) throw new Error("Timeout: iframe Accès à distance introuvable (#iframeapp).");

        console.log("⏳ Attente du chargement complet de l'iframe...");
        await new Promise((resolve, reject) => {
            let done = false;
            let intervalle = setInterval(() => {
                try {
                    let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                    if (docIframe && docIframe.readyState === "complete") {
                        let loading = docIframe.querySelector("body > div.loading_screen");
                        if (!loading || window.getComputedStyle(loading).display === "none") {
                            if (!done) {
                                done = true;
                                clearInterval(intervalle);
                                resolve();
                            }
                        }
                    }
                } catch (e) {}
            }, 500);

            setTimeout(() => {
                if (!done) {
                    clearInterval(intervalle);
                    reject(new Error("Timeout: chargement iframe Accès à distance trop long."));
                }
            }, 15000);
        });

        await window.attendrePause(500);

        let docIframe = iframe.contentDocument || iframe.contentWindow.document;
        if (!docIframe) throw new Error("Document iframe Accès à distance inaccessible.");

        /* Box7: checkbox unique #admin_true */
        let checkboxAdmin = await window.attendreElementDansDoc(docIframe, "#admin_true", 5000);
        if (!checkboxAdmin) throw new Error("Option admin_true introuvable (#admin_true).");

        let etatVoulu = configAcces["état"] ? String(configAcces["état"]).toLowerCase() : "désactivé";
        let estActiveVoulu = (etatVoulu === "activé" || etatVoulu === "active" || etatVoulu === "true");

        const forcerCheckbox = async (cocheVoulue) => {
            if (checkboxAdmin.checked === cocheVoulue) return;

            let label = docIframe.querySelector('label[for="admin_true"]');
            if (label) {
                window.cliquerPur(label);
            } else {
                window.cliquerPur(checkboxAdmin);
            }

            await window.attendrePause(300);

            if (checkboxAdmin.checked !== cocheVoulue) {
                checkboxAdmin.checked = cocheVoulue;
                checkboxAdmin.dispatchEvent(new Event("input", { bubbles: true }));
                checkboxAdmin.dispatchEvent(new Event("change", { bubbles: true }));
                checkboxAdmin.dispatchEvent(new Event("click", { bubbles: true }));
            }

            await window.attendrePause(400);

            if (checkboxAdmin.checked !== cocheVoulue) {
                throw new Error("Échec basculement Accès à distance (#admin_true).");
            }
        };

        if (estActiveVoulu) {
            /* --- MODE ACTIVÉ --- */
            await forcerCheckbox(true);

            /* Validation + saisie Identifiant */
            if (configAcces["identifiant"]) {
                let idValide = await window.PushUI.validerNom(configAcces["identifiant"], "Identifiant", "Accès à distance");
                if (idValide !== null) {
                    window.ecrireTexteDansDoc(docIframe, "#login", idValide);
                    configAcces["identifiant"] = idValide;
                } else {
                    console.log("⏭️ Saisie identifiant ignorée par l'utilisateur.");
                }
            }

            /* Validation + saisie Mot de passe */
            if (configAcces["mot de passe"]) {
                let mdpValide = await window.PushUI.validerMotDePasse(
                    configAcces["mot de passe"],
                    configAcces["identifiant"] || "Inconnu",
                    "Accès à distance",
                    "Service"
                );

                if (mdpValide !== null) {
                    window.ecrireTexteDansDoc(docIframe, "#remote_password", mdpValide);
                    configAcces["mot de passe"] = mdpValide;
                } else {
                    console.log("⏭️ Saisie du mot de passe ignorée par l'utilisateur.");
                }
            }

            /* Port */
            if (configAcces["port"]) {
                let portActuel = parseInt(configAcces["port"], 10);
                if (!isNaN(portActuel) && portActuel < 10000) portActuel = portActuel + 10000;
                window.ecrireTexteDansDoc(docIframe, "#port", String(portActuel));
            }

        } else {
            /* --- MODE DÉSACTIVÉ --- */
            await forcerCheckbox(false);
            /* En mode désactivé: pas de saisie login/pass/port */
        }

        /* 5) Sauvegarde robuste */
        let btnSave = docIframe.querySelector("#submit")
            || docIframe.querySelector("#save")
            || docIframe.querySelector("#bt_save")
            || docIframe.querySelector(".btn-save");

        if (!btnSave) throw new Error("Bouton sauvegarde introuvable (#submit / #save / #bt_save / .btn-save).");

        btnSave.removeAttribute("disabled");
        btnSave.classList.remove("disabled");

        if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave);
        else btnSave.click();

        console.log("⏳ Sauvegarde en cours...");
        await new Promise((resolve, reject) => {
            let done = false;
            let intv = setInterval(() => {
                try {
                    let currentDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (currentDoc) {
                        let loading = currentDoc.querySelector("body > div.loading_screen");
                        if (!loading || window.getComputedStyle(loading).display === "none") {
                            if (!done) {
                                done = true;
                                clearInterval(intv);
                                resolve();
                            }
                        }
                    }
                } catch (e) {}
            }, 1000);

            setTimeout(() => {
                if (!done) {
                    clearInterval(intv);
                    reject(new Error("Timeout: sauvegarde Accès à distance non confirmée."));
                }
            }, 30000);
        });

        await window.attendrePause(1000);

    } finally {
        /* Libération du scroll quoi qu'il arrive */
        libererScroll();
    }

    console.log("🔄 Retour à l'accueil...");
    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
        await window.attendrePause(2000);
    }
};
