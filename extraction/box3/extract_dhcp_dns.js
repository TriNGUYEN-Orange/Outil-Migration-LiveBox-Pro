/* --- /extraction/box3/extract_dhcp_dns.js --- */

window.extraireDhcpDnsBox3 = async function(estRattrapage = false) {
    const { configLivebox, simulerClic, attendreElement, attendrePause, attendreFinChargementGWT, CLE_STORAGE } = window;

    console.warn("=================================================");
    console.warn("[3/x] Extraction sur la page DHCP/DNS (Box 3)...");
    console.warn("=================================================");

    if (estRattrapage) {
        simulerClic("#menu_home_hyperlink");
        await attendrePause(1500);
        await attendreFinChargementGWT();
    }

    /* ========================================================================= */
    /* 1. NAVIGATION ET DESTRUCTION DU POP-UP GWT                                */
    /* ========================================================================= */
    for (let tentative = 0; tentative < 3; tentative++) {
        window.location.hash = "#DHCPLANPlace:";
        await attendrePause(800);
        if (window.location.hash.includes("DHCPLAN")) break;
    }

    let popupFerme = false;
    for (let i = 0; i < 15; i++) {
        let popup = document.querySelector(".PopinCss-popinPanel, .popupContent");
        
        if (popup && window.getComputedStyle(popup).display !== "none") {
            let boutons = popup.querySelectorAll(".gwt-Anchor, .gwt-Button, div[role='button'], a[title]");
            
            for (let btn of boutons) {
                let texteBtn = (btn.innerText || btn.textContent || "").trim().toLowerCase();
                let titreBtn = (btn.getAttribute("title") || "").trim().toLowerCase();
                
                if (texteBtn === "oui" || titreBtn.startsWith("oui")) {
                    btn.scrollIntoView({ block: "center" });
                    btn.focus();
                    
                    ['mouseover', 'mouseenter', 'mousedown', 'mouseup', 'click'].forEach(function(type) {
                        btn.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
                    });
                    
                    btn.click();
                    popupFerme = true;
                    await attendrePause(1500);
                    break;
                }
            }
        }
        if (popupFerme) break;
        await attendrePause(400); 
    }
    
    await attendreFinChargementGWT();

    let formDhcp = await attendreElement("#gwtActivityPanel form", 5000);
    if (!formDhcp) {
        console.error("Echec: Formulaire DHCP/DNS introuvable.");
        return;
    }

    configLivebox.dhcp_dns = configLivebox.dhcp_dns || {};

    /* ========================================================================= */
    /* 2. EXTRACTION ROBUSTE AVEC MOTS-CLES ET REGEX                             */
    /* ========================================================================= */
    console.warn("Extraction des donnees DHCP/DNS en cours...");

    /* Fonction utilitaire pour trouver un champ via une liste de mots-cles */
    const trouverChamp = function(motsCles, balise = "input") {
        let elements = document.querySelectorAll("#gwtActivityPanel " + balise);
        for (let el of elements) {
            let attributs = ((el.title || "") + " " + (el.name || "") + " " + (el.className || "")).toLowerCase();
            for (let mot of motsCles) {
                if (attributs.includes(mot)) return el;
            }
        }
        return null;
    };

    /* -- Etat DHCP -- */
    let radioDhcpStateOn = document.querySelector("input[name='serverStateRadio'][value='on']") || trouverChamp(["dhcp"], "input[type='radio'][value='on']");
    configLivebox.dhcp_dns["état du serveur DHCP"] = radioDhcpStateOn ? radioDhcpStateOn.checked : false;

    /* -- IP LAN -- */
    let inputIpLan = trouverChamp(["adresse ip du lan", "adresse ip locale", "réseau local", "reseau local"]);
    configLivebox.dhcp_dns["adresse IP du LAN"] = inputIpLan ? inputIpLan.value.trim() : "Introuvable";

    /* -- Masque -- */
    let inputMasque = trouverChamp(["masque", "mask"]);
    configLivebox.dhcp_dns["masque de sous-réseau du LAN"] = inputMasque ? inputMasque.value.trim() : "Introuvable";

    /* -- Plage IP debut -- */
    let inputIpDebut = trouverChamp(["début", "debut", "start"]);
    configLivebox.dhcp_dns["adresse IP de début"] = inputIpDebut ? inputIpDebut.value.trim() : "Introuvable";

    /* -- Plage IP fin -- */
    let inputIpFin = trouverChamp(["fin", "end", "max"]);
    configLivebox.dhcp_dns["adresse IP de fin"] = inputIpFin ? inputIpFin.value.trim() : "Introuvable";

    /* -- Mode DNS -- */
    let selectModeDns = trouverChamp(["dns", "résolution", "resolution"], "select");
    if (!selectModeDns) {
        let allSelects = document.querySelectorAll("#gwtActivityPanel select");
        if (allSelects.length > 0) {
            selectModeDns = allSelects[allSelects.length - 1]; 
        }
    }
    configLivebox.dhcp_dns["mode DNS"] = selectModeDns && selectModeDns.selectedIndex >= 0 ? selectModeDns.options[selectModeDns.selectedIndex].text : "Introuvable";

    /* -- Baux DHCP statiques (Extraction intelligente sans index de colonne) -- */
    configLivebox.dhcp_dns["Baux DHCP statiques"] = [];
    let lignes = document.querySelectorAll("#gwtActivityPanel table tbody tr");
    
    for (let i = 0; i < lignes.length; i++) {
        let cellules = lignes[i].querySelectorAll("td");
        
        if (cellules.length >= 2) {
            let nom = "", ip = "", mac = "";
            
            for (let j = 0; j < cellules.length; j++) {
                let txt = (cellules[j].innerText || cellules[j].textContent).trim();
                
                /* Analyse du contenu par expressions regulieres (Regex) */
                if (/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(txt)) {
                    mac = txt;
                } else if (/^(\d{1,3}\.){3}\d{1,3}$/.test(txt)) {
                    ip = txt;
                } else if (txt !== "" && txt.toLowerCase() !== "supprimer" && txt.toLowerCase() !== "modifier") {
                    if (!nom) nom = txt;
                }
            }
            
            /* Si on a au moins une IP et une adresse MAC, on enregistre l'equipement */
            if (ip !== "" && mac !== "") {
                configLivebox.dhcp_dns["Baux DHCP statiques"].push({
                    "Équipement": nom || "Inconnu",
                    "Adresse IP statique": ip,
                    "Adresse MAC": mac
                });
            }
        }
    }

    console.warn("Donnees DHCP extraites avec succes.");

    /* ========================================================================= */
    /* 3. SAUVEGARDE                                                             */
    /* ========================================================================= */
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
    console.warn("Fin du module DHCP/DNS.");
};