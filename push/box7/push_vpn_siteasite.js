/* --- /push/box7/push_vpn_siteasite.js --- */

window.executerVpnSiteASite = async function() {
    console.log("⏳ Application des paramètres VPN Site à Site...");

    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    try {
        configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox;
    } catch (e) {
        throw new Error("Configuration JSON invalide (VPN Site à Site).");
    }

    if (!configurationActuelle || !configurationActuelle.vpn) {
        console.warn("⚠️ Pas de bloc VPN dans la configuration.");
        return;
    }

    let vpnSiteASite = configurationActuelle.vpn["vpn site à site"] || configurationActuelle.vpn["vpn site a site"];
    if (!vpnSiteASite || !Array.isArray(vpnSiteASite) || vpnSiteASite.length === 0) {
        console.warn("⚠️ Aucun VPN Site à Site à configurer.");
        return;
    }

    // Déjà dans la page VPN -> on ne refait pas la navigation footer/tuile
    await attendreFinSauvegarde();
    await attendreDisparitionPopup();

    let tabSite2Site = await attendreElement("#tab_vpnSite2site", 5000);
    if (!tabSite2Site) {
        throw new Error("Onglet VPN Site à Site introuvable (#tab_vpnSite2site).");
    }

    cliquerPur(tabSite2Site);
    await attendreFinSauvegarde();

    for (let i = 0; i < vpnSiteASite.length; i++) {
        let site = vpnSiteASite[i];
        console.log(`⏳ Traitement site VPN (${i + 1}/${vpnSiteASite.length})...`);

        let nomVPNConforme = await window.PushUI.validerNom(
            site["nom VPN"],
            "Nom VPN",
            "VPN Site à site"
        );
        if (nomVPNConforme === null) {
            console.log("⏭️ Site ignoré (nom non validé).");
            continue;
        }

        let cleConforme = await window.PushUI.validerMotDePasse(
            site["clé partagée"],
            nomVPNConforme,
            "VPN Site à site",
            "VPN"
        );
        if (cleConforme === null) {
            console.log("⏭️ Site ignoré (clé non validée).");
            continue;
        }

        let btnAjoutSite = await attendreElement("#content_template_container > div:nth-child(4) > div > a", 3000);
        if (!btnAjoutSite) {
            throw new Error("Bouton Ajouter site introuvable (#content_template_container > div:nth-child(4) > div > a).");
        }

        btnAjoutSite.scrollIntoView({ behavior: "smooth", block: "center" });
        cliquerPur(btnAjoutSite);

        let popupSite = await attendreElement("#site_popup", 3000);
        if (!popupSite) {
            throw new Error("Popup site introuvable après clic ajout (#site_popup).");
        }

        ecrireTexteDansDoc(document, "#site_name", nomVPNConforme);

        if (site["adresse IP du site distant"]) {
            ecrireTexteDansDoc(document, "#ip", site["adresse IP du site distant"]);
        }

        if (site["réseau distant"] && site["réseau distant"]["ip"]) {
            ecrireTexteDansDoc(document, "#distant_ip", site["réseau distant"]["ip"] + "/24");
        }

        let champCle = document.querySelector("#site_popup > div.sah_dialog_body > div.ipsec_groupe_site.input-wrapper.middle > div.row.text-field-row > div.col-xs-5.text-field-input > input");
        if (!champCle) {
            throw new Error("Champ clé partagée introuvable dans popup site.");
        }

        champCle.focus();
        champCle.value = cleConforme;
        champCle.dispatchEvent(new Event("input", { bubbles: true }));
        champCle.dispatchEvent(new Event("change", { bubbles: true }));
        champCle.blur();

        if (site["équipement distant"]) {
            let equipVal = String(site["équipement distant"]).toLowerCase();
            let cibleEquip =
                (equipVal.includes("3") || equipVal.includes("4")) ? "LiveBoxPro v3/v4" :
                (equipVal.includes("5") || equipVal.includes("6") || equipVal.includes("7")) ? "Livebox 5 et supérieur" :
                "Autre";

            let selectEquip = document.querySelector("#distantEquipSelect > div > select");
            if (!selectEquip) {
                throw new Error("Liste équipement distant introuvable (#distantEquipSelect > div > select).");
            }

            let optionTrouvee = false;
            for (let opt of selectEquip.options) {
                if (opt.innerText.toLowerCase().includes(cibleEquip.toLowerCase())) {
                    opt.selected = true;
                    selectEquip.value = opt.value;
                    selectEquip.dispatchEvent(new Event("input", { bubbles: true }));
                    selectEquip.dispatchEvent(new Event("change", { bubbles: true }));
                    optionTrouvee = true;
                    break;
                }
            }

            if (!optionTrouvee) {
                throw new Error(`Option équipement distant non trouvée pour valeur: ${site["équipement distant"]}`);
            }
        }

        let btnSiteSave = document.querySelector("#site_save");
        if (!btnSiteSave) {
            throw new Error("Bouton sauvegarde site introuvable (#site_save).");
        }

        cliquerPur(btnSiteSave);
        await attendreFinSauvegarde();
        await attendreDisparitionPopup();

        if (site["activé"] === false || String(site["activé"]).toLowerCase() === "false") {
            await attendrePause(300);

            let lignesTableau = document.querySelectorAll("#content_template_container > div:nth-child(5) > table > tbody > tr");
            if (!lignesTableau || lignesTableau.length === 0) {
                throw new Error("Tableau des sites VPN vide ou introuvable pour gérer l'état activé/désactivé.");
            }

            let toggleTrouve = false;

            for (let ligne of lignesTableau) {
                if (ligne.innerText.includes(nomVPNConforme)) {
                    let btnToggle = ligne.querySelector("td:nth-child(1) > div > div > div");
                    if (!btnToggle) {
                        throw new Error(`Toggle introuvable pour le site: ${nomVPNConforme}`);
                    }
                    cliquerPur(btnToggle);
                    await attendreFinSauvegarde();
                    toggleTrouve = true;
                    break;
                }
            }

            if (!toggleTrouve) {
                let btnToggleFallback = document.querySelector("#content_template_container > div:nth-child(5) > table > tbody > tr:nth-child(1) > td:nth-child(1) > div > div > div");
                if (!btnToggleFallback) {
                    throw new Error(`Impossible de trouver une ligne/toggle pour désactiver le site: ${nomVPNConforme}`);
                }
                cliquerPur(btnToggleFallback);
                await attendreFinSauvegarde();
            }
        }

        console.log("✅ Site VPN traité:", nomVPNConforme);
    }

    await retournerAccueil();
    console.log("🎉 Configuration VPN Site à Site terminée.");
};
