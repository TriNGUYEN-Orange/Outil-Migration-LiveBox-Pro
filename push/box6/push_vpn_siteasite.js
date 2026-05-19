/* --- /push/box6/push_vpn_siteasite.js --- */

window.executerVpnSiteASite = async function() {
    console.log("⏳ Application des paramètres VPN Site à Site...");

    let configStr = localStorage.getItem("livebox_migration_config");
    let configurationActuelle = null;
    try {
        configurationActuelle = configStr ? JSON.parse(configStr) : window.configLivebox;
    } catch (e) {
        throw new Error("Configuration JSON invalide (VPN Site à Site).");
    }

    if (!configurationActuelle || !configurationActuelle.vpn) return;

    let vpnSiteASite = configurationActuelle.vpn["vpn site à site"] || configurationActuelle.vpn["vpn site a site"];
    if (!vpnSiteASite || !Array.isArray(vpnSiteASite) || vpnSiteASite.length === 0) {
        console.warn("⚠️ Pas de données VPN Site à Site trouvées.");
        return;
    }

    const bloquerScroll = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
    window.addEventListener("wheel", bloquerScroll, { passive: false });
    window.addEventListener("touchmove", bloquerScroll, { passive: false });
    window.addEventListener("DOMMouseScroll", bloquerScroll, { passive: false });

    let oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const libererScroll = () => {
        window.removeEventListener("wheel", bloquerScroll);
        window.removeEventListener("touchmove", bloquerScroll);
        window.removeEventListener("DOMMouseScroll", bloquerScroll);
        document.body.style.overflow = oldOverflow;
    };

    const attendreFinLoadingEtPopup = async (timeoutMs = 20000) => {
        return new Promise((resolve, reject) => {
            let done = false;
            let intv = setInterval(() => {
                let loading = document.querySelector("body > div.loading_screen");
                let popup = document.querySelector("#site_popup");
                let loadingCache = (!loading || window.getComputedStyle(loading).display === "none");
                let popupFermee = (!popup || popup.offsetParent === null);

                if (loadingCache && popupFermee) {
                    if (!done) {
                        done = true;
                        clearInterval(intv);
                        resolve();
                    }
                }
            }, 450);

            setTimeout(() => {
                if (!done) {
                    clearInterval(intv);
                    reject(new Error("Timeout: sauvegarde Site à Site non confirmée (loading/popup)."));
                }
            }, timeoutMs);
        });
    };

    try {
        console.log("🔄 Reprise directe sur l'interface VPN...");

        let tabSite2Site = await window.attendreElement("#tab_vpnSite2site", 7000);
        if (!tabSite2Site) {
            throw new Error("Onglet Site à Site introuvable (#tab_vpnSite2site).");
        }

        if (typeof window.cliquerPur === "function") window.cliquerPur(tabSite2Site);
        else tabSite2Site.click();

        await window.attendrePause(1600);

        for (let i = 0; i < vpnSiteASite.length; i++) {
            let site = vpnSiteASite[i];
            console.log("⏳ Configuration de : " + site["nom VPN"]);

            let nomVPNConforme = await window.PushUI.validerNom(site["nom VPN"], "Nom VPN", "VPN Site à site");
            if (nomVPNConforme === null) { console.log("⏭️ Connexion ignorée."); continue; }

            let cleConforme = await window.PushUI.validerMotDePasse(site["clé partagée"], nomVPNConforme, "VPN Site à site", "VPN");
            if (cleConforme === null) { console.log("⏭️ Connexion ignorée."); continue; }

            let btnAjoutSite =
                document.querySelector("a[data-translation='internetVPNAnkaa.site2site.add']") ||
                document.querySelector("#content_template_container > div:nth-child(4) > div > a");

            if (!btnAjoutSite) {
                throw new Error("Bouton ajout Site à Site introuvable.");
            }

            btnAjoutSite.scrollIntoView({ behavior: "instant", block: "center" });
            await window.attendrePause(300);

            if (typeof window.cliquerPur === "function") window.cliquerPur(btnAjoutSite);
            else btnAjoutSite.click();

            let popupSite = await window.attendreElement("#site_popup", 7000);
            if (!popupSite) {
                throw new Error("Popup Site à Site non ouverte (#site_popup).");
            }

            await window.attendrePause(1000);

            const remplirChamp = async (sel, val, nomChamp) => {
                let el = popupSite.querySelector(sel);
                if (!el || el.offsetParent === null) {
                    throw new Error(`Champ introuvable: ${nomChamp} (${sel})`);
                }

                el.focus();
                el.value = "";
                el.dispatchEvent(new Event("input", { bubbles: true }));
                el.value = val;
                el.dispatchEvent(new Event("input", { bubbles: true }));
                el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "a" }));
                el.dispatchEvent(new Event("change", { bubbles: true }));
                el.blur();
                await window.attendrePause(300);
            };

            await remplirChamp("#site_name", nomVPNConforme, "Nom VPN");

            if (site["adresse IP du site distant"]) {
                await remplirChamp("#ip", site["adresse IP du site distant"], "IP site distant");
            }

            if (site["réseau distant"] && site["réseau distant"]["ip"]) {
                await remplirChamp("#distant_ip", site["réseau distant"]["ip"] + "/24", "Réseau distant");
            }

            let champCle =
                popupSite.querySelector(".ipsec_groupe_site input.text-field") ||
                popupSite.querySelector("#site_popup div.ipsec_groupe_site.input-wrapper.middle input");

            if (!champCle || champCle.offsetParent === null) {
                throw new Error("Champ clé partagée introuvable (Site à Site).");
            }

            champCle.focus();
            champCle.value = "";
            champCle.dispatchEvent(new Event("input", { bubbles: true }));
            champCle.value = cleConforme;
            champCle.dispatchEvent(new Event("input", { bubbles: true }));
            champCle.dispatchEvent(new Event("change", { bubbles: true }));
            champCle.blur();
            await window.attendrePause(300);

            if (site["équipement distant"]) {
                let equipVal = String(site["équipement distant"]).toLowerCase();
                let cibleEquip =
                    (equipVal.includes("3") || equipVal.includes("4")) ? "LiveBoxPro v3/v4" :
                    ((equipVal.includes("5") || equipVal.includes("6") || equipVal.includes("7")) ? "Livebox 5 et supérieur" : "Autre");

                let selectEquip = popupSite.querySelector("#distantEquipSelect select") || popupSite.querySelector("select");
                if (!selectEquip) throw new Error("Select équipement distant introuvable.");

                selectEquip.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
                selectEquip.focus();

                let optionTrouvee = false;
                for (let opt of selectEquip.options) {
                    if ((opt.innerText || "").toLowerCase().includes(cibleEquip.toLowerCase())) {
                        selectEquip.value = opt.value;
                        opt.selected = true;
                        selectEquip.dispatchEvent(new Event("input", { bubbles: true }));
                        selectEquip.dispatchEvent(new Event("change", { bubbles: true }));
                        optionTrouvee = true;
                        break;
                    }
                }

                selectEquip.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
                selectEquip.blur();
                await window.attendrePause(300);

                if (!optionTrouvee) {
                    console.warn("⚠️ Option équipement distant non trouvée, valeur laissée par défaut.");
                }
            }

            let btnSiteSave = popupSite.querySelector("#site_save");
            if (!btnSiteSave || btnSiteSave.offsetParent === null) {
                throw new Error("Bouton Enregistrer Site à Site introuvable (#site_save).");
            }

            if (typeof window.cliquerPur === "function") window.cliquerPur(btnSiteSave);
            else btnSiteSave.click();

            await attendreFinLoadingEtPopup(22000);

            let veutEtreActif = !(site["activé"] === false || String(site["activé"]).toLowerCase() === "false");
            if (!veutEtreActif) {
                await window.attendrePause(1000);

                let lignesTableau = document.querySelectorAll("#content_template_container table tbody tr, .conf-table-ractive-row");
                let toggleTrouve = false;

                for (let ligne of lignesTableau) {
                    if ((ligne.innerText || "").toLowerCase().includes(nomVPNConforme.toLowerCase())) {
                        let btnToggle = ligne.querySelector(".conf-table-ractive-checkbox-image, td:nth-child(1) div");
                        if (btnToggle) {
                            if (typeof window.cliquerPur === "function") window.cliquerPur(btnToggle);
                            else btnToggle.click();

                            await window.attendrePause(4000);
                            toggleTrouve = true;
                            break;
                        }
                    }
                }

                if (!toggleTrouve) {
                    throw new Error(`Impossible de désactiver le VPN créé: ${nomVPNConforme}`);
                }
            }
        }

    } finally {
        libererScroll();
    }

    console.log("🏁 Fin de la configuration du VPN Site à Site.");

    if (typeof window.retournerAccueil === "function") {
        await window.retournerAccueil();
        await window.attendrePause(2000);
    }
};
