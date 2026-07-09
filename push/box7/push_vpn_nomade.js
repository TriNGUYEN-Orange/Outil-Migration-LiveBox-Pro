/* --- /push/box7/push_vpn_nomade.js --- */

window.executerVpnNomade = async function() {
    console.log("⏳ Application des paramètres VPN Nomade (Box 7)...");

    let configurationActuelle = window.configLivebox;

    if (!configurationActuelle && typeof window.chargerConfiguration === "function") {
        try {
            configurationActuelle = await window.chargerConfiguration();
            window.configLivebox = configurationActuelle;
        } catch (e) {
            throw new Error("Configuration non décodable (VPN Nomade).");
        }
    }

    if (!configurationActuelle) {
        throw new Error("Configuration absente (VPN Nomade).");
    }


    if (!configurationActuelle || !configurationActuelle.vpn || !configurationActuelle.vpn.nomade) {
        console.warn("⚠️ Pas de données VPN Nomade trouvées à appliquer.");
        return;
    }

    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
        await window.attendrePause(500);
    }

    let btnAvance = await window.attendreElement("#sah_footer .icon-advanced", 10000);
    if (!btnAvance) throw new Error("Bouton Avancé introuvable (#sah_footer .icon-advanced).");

    let clicAvanceOk = window.cliquerBouton("#sah_footer .icon-advanced");
    if (!clicAvanceOk) throw new Error("Impossible de cliquer sur Avancé.");
    await window.attendrePause(800);

    let tuileVpn = await window.attendreElement("#internetVPNAnkaa, #internetVPN", 10000);
    if (!tuileVpn) throw new Error("Tuile VPN introuvable (#internetVPNAnkaa, #internetVPN).");

    tuileVpn.scrollIntoView({ behavior: "smooth", block: "center" });
    await window.attendrePause(300);

    let widget = tuileVpn.querySelector(".widget") || tuileVpn;
    if (typeof window.cliquerPur === "function") window.cliquerPur(widget);
    else widget.click();

    let titre = await window.attendreElement("#internetVPNAnkaaTitle, #internetVPNTitle", 10000);
    if (titre) {
        await window.attendrePause(300);
        let clicTitreOk = window.cliquerBouton(titre);
        if (!clicTitreOk) throw new Error("Impossible de cliquer sur le titre VPN.");
    }

    await window.attendreFinSauvegarde();
    await window.attendreDisparitionPopup();

    let vpnNomade = configurationActuelle.vpn.nomade;
    let comptes = vpnNomade.comptes || [];
    let maxComptes = Math.min(comptes.length, 4);

    console.log("📝 " + maxComptes + " compte(s) VPN à configurer.");

    const remplirEtValider = async (selecteur, valeur, labelErreur, rootDoc = document) => {
        let champ = rootDoc.querySelector(selecteur);
        if (!champ || champ.offsetParent === null) {
            throw new Error(`Champ introuvable: ${labelErreur} (${selecteur})`);
        }

        champ.focus();
        champ.value = valeur;
        champ.dispatchEvent(new Event("input", { bubbles: true }));
        champ.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "a" }));
        champ.dispatchEvent(new Event("change", { bubbles: true }));
        champ.blur();
        await window.attendrePause(200);
    };

    for (let i = 0; i < maxComptes; i++) {
        let compte = comptes[i];
        console.log(`⏳ Vérification du compte (${i + 1}/${maxComptes}) : ${compte["nom de l'utilisateur"]}`);

        let nomConforme = await window.PushUI.validerNom(compte["nom de l'utilisateur"], "Utilisateur", "VPN Nomade");
        if (nomConforme === null) { console.log("⏭️ Compte ignoré."); continue; }

        let mdpConforme = await window.PushUI.validerMotDePasse(
            compte["mot de passe de l'utilisateur"],
            nomConforme,
            "VPN Nomade",
            "User"
        );
        if (mdpConforme === null) { console.log("⏭️ Compte ignoré."); continue; }

        compte["nom de l'utilisateur"] = nomConforme;
        compte["mot de passe de l'utilisateur"] = mdpConforme;

        let btnAjout = await window.attendreElement(
            "a[data-translation='internetVPNAnkaa.label.addAnkaa'], a[data-translation='internetVPNAnkaa.label.add']",
            10000
        );
        if (!btnAjout) throw new Error("Bouton 'Ajouter' introuvable (VPN Nomade).");

        btnAjout.scrollIntoView({ behavior: "smooth", block: "center" });
        await window.attendrePause(200);

        if (typeof window.cliquerPur === "function") window.cliquerPur(btnAjout);
        else btnAjout.click();

        let popup = await window.attendreElement("#user_popup", 10000);
        if (!popup) throw new Error("Popup utilisateur non ouverte (#user_popup).");

        await window.attendrePause(400);

        // Box7 : forcer type L2TP/IPsec (L2TYPE)
        let selectType = popup.querySelector("select.select, select");
        if (selectType && selectType.value !== "L2TYPE") {
            selectType.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            selectType.focus();
            selectType.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            await window.attendrePause(150);

            selectType.value = "L2TYPE";
            Array.from(selectType.options).forEach(opt => { opt.selected = (opt.value === "L2TYPE"); });

            selectType.dispatchEvent(new Event("input", { bubbles: true }));
            selectType.dispatchEvent(new Event("change", { bubbles: true }));
            selectType.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
            selectType.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            selectType.blur();

            await window.attendrePause(400);
        }

        if (compte["nom de l'utilisateur"]) {
            await remplirEtValider("#user_name", compte["nom de l'utilisateur"], "Utilisateur", document);
        }

        if (compte["mot de passe de l'utilisateur"]) {
            await remplirEtValider("#password", compte["mot de passe de l'utilisateur"], "Mot de passe", document);

            let confirmInput = document.querySelector("#password_confirm");
            if (confirmInput && confirmInput.offsetParent !== null) {
                await remplirEtValider("#password_confirm", compte["mot de passe de l'utilisateur"], "Confirmation mot de passe", document);
            }
        }

        await window.attendrePause(300);

        let btnSave = popup.querySelector("#changepwd_save");
        if (!btnSave || btnSave.offsetParent === null) {
            throw new Error("Bouton Enregistrer popup introuvable (#changepwd_save).");
        }

        await new Promise((resolve) => {
            let checks = 0;
            let intv = setInterval(() => {
                if (btnSave.getAttribute("aria-disabled") !== "true" || checks > 25) {
                    clearInterval(intv);
                    resolve();
                }
                checks++;
            }, 100);
        });

        if (typeof window.cliquerPur === "function") window.cliquerPur(btnSave);
        else btnSave.click();

        await window.attendrePause(500);
        await window.attendreFinSauvegarde();
        await window.attendreDisparitionPopup();

        let etatVoulu = compte["état de l'utilisateur"] ? String(compte["état de l'utilisateur"]).toLowerCase() : "activé";
        let veutEtreActive = (etatVoulu === "activé" || etatVoulu === "true" || etatVoulu === "active");

        await window.attendrePause(300);

        let lignesTableau = document.querySelectorAll("tr.conf-table-ractive-row, table tbody tr, .conf-table-ractive-row");
        let nomCompteRecherche = String(compte["nom de l'utilisateur"]).toLowerCase().trim();
        let ligneTrouvee = null;

        for (let ligne of lignesTableau) {
            if ((ligne.innerText || "").toLowerCase().includes(nomCompteRecherche)) {
                ligneTrouvee = ligne;
                break;
            }
        }

        if (!ligneTrouvee) throw new Error("Impossible de retrouver la ligne du compte dans le tableau.");

        let btnToggle = ligneTrouvee.querySelector(".conf-table-ractive-checkbox-image, td:nth-child(1) div, input[type='checkbox']");
        if (!btnToggle) throw new Error("Toggle état introuvable dans la ligne utilisateur.");

        let estActuellementActive = false;
        let inpCheck = ligneTrouvee.querySelector("input[type='checkbox']");
        if (inpCheck) estActuellementActive = inpCheck.checked;
        else {
            let htmlLigne = (ligneTrouvee.innerHTML || "").toLowerCase();
            estActuellementActive = htmlLigne.includes("checked") || htmlLigne.includes("switch_on");
        }

        if (estActuellementActive !== veutEtreActive) {
            btnToggle.scrollIntoView({ behavior: "smooth", block: "center" });
            await window.attendrePause(200);

            if (typeof window.cliquerPur === "function") window.cliquerPur(btnToggle);
            else btnToggle.click();

            await window.attendreFinSauvegarde();
            await window.attendrePause(300);
        }

        await window.attendrePause(500);
    }

    console.log("🎉 Tous les comptes VPN Nomade ont été traités.");
    // Pas de retour accueil ici : enchaînement possible vers VPN Nomade avancé
};
