/* --- /extraction/box3/extract_routage.js --- */

window.extraireRoutageBox3 = async function(estRattrapage = false) {
    const { configLivebox, simulerClic, attendreElement, attendrePause, attendreFinChargementGWT, CLE_STORAGE } = window;

    console.warn("=================================================");
    console.warn("[4/x] Extraction sur la page Routage (Box 3)...");
    console.warn("=================================================");

    if (estRattrapage) {
        simulerClic("#menu_home_hyperlink");
        await attendrePause(1500);
        await attendreFinChargementGWT();
    }

    /* ========================================================================= */
    /* 1. NAVIGATION NATURELLE VIA LE MENU GAUCHE                                */
    /* ========================================================================= */
    console.warn("Recherche du menu 'Routage' dans la barre laterale...");
    
    let menuTrouve = false;
    let elementsMenu = document.querySelectorAll("#gwtLeftMenuBar a, #gwtLeftMenuBar .gwt-Hyperlink, #gwtLeftMenuBar div.itemLink");
    
    for (let el of elementsMenu) {
        let texteMenu = (el.innerText || el.textContent || "").trim().toLowerCase();
        
        if (texteMenu === "routage") {
            console.warn("Menu 'Routage' trouve ! Simulation du clic...");
            el.scrollIntoView({ block: "center" });
            el.focus();
            
            ['mouseenter', 'mousedown', 'mouseup', 'click'].forEach(function(type) {
                el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
            });
            
            menuTrouve = true;
            break;
        }
    }

    if (!menuTrouve) {
        console.warn("Menu introuvable par texte. Tentative via le hash de secours...");
        window.location.hash = "#ROUTINGPlace:"; 
    }

    await attendrePause(1500); 

    /* ========================================================================= */
    /* 2. GESTION DU POP-UP DE CONFIRMATION DE SORTIE                            */
    /* ========================================================================= */
    let popupFerme = false;
    for (let i = 0; i < 15; i++) {
        let popup = document.querySelector(".PopinCss-popinPanel, .popupContent");
        
        if (popup && window.getComputedStyle(popup).display !== "none") {
            let boutons = popup.querySelectorAll(".gwt-Anchor, .gwt-Button, div[role='button'], a[title]");
            
            for (let btn of boutons) {
                let texteBtn = (btn.innerText || btn.textContent || "").trim().toLowerCase();
                let titreBtn = (btn.getAttribute("title") || "").trim().toLowerCase();
                
                if (texteBtn === "oui" || titreBtn.startsWith("oui")) {
                    console.warn("Pop-up detecte. Validation de la sortie (Oui)...");
                    btn.scrollIntoView({ block: "center" });
                    btn.focus();
                    
                    ['mouseover', 'mouseenter', 'mousedown', 'mouseup', 'click'].forEach(function(type) {
                        btn.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
                    });
                    
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

    let conteneurRoutage = await attendreElement("#gwtActivityPanel form, #gwtActivityPanel table", 5000);
    if (!conteneurRoutage) {
        console.error("Echec: Page de routage introuvable.");
        return;
    }

    configLivebox.routage = configLivebox.routage || {};

    /* ========================================================================= */
    /* 3. EXTRACTION DE LA TABLE DE ROUTAGE (PAR REGEX AMELIORE)                 */
    /* ========================================================================= */
    console.warn("Extraction de la table de routage en cours...");
    
    let tableDeRoutage = [];
    let lignes = document.querySelectorAll("#gwtActivityPanel table tbody tr");
    
    for (let i = 0; i < lignes.length; i++) {
        let cellules = lignes[i].querySelectorAll("td");
        
        if (cellules.length >= 4) {
            let reseau = "", masque = "", passerelle = "", interfaceReseau = "", metrique = "", active = false;
            let ips = [];
            
            for (let j = 0; j < cellules.length; j++) {
                let txt = (cellules[j].innerText || cellules[j].textContent).trim();
                let checkbox = cellules[j].querySelector("input[type='checkbox']");
                
                if (checkbox) {
                    active = checkbox.checked;
                }
                
                let txtLower = txt.toLowerCase();
                
                /* Analyse du contenu par Regex (Inclus 'default', 'par defaut' et format CIDR) */
                if (/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(txt) || txtLower === "default" || txtLower === "par défaut" || txtLower === "par defaut") {
                    ips.push(txt);
                } else if (/^\d+$/.test(txt)) {
                    metrique = txt;
                } else if (txt !== "" && txtLower !== "supprimer" && txtLower !== "modifier" && !/^\d+$/.test(txt)) {
                    if (txtLower !== "oui" && txtLower !== "non") {
                        interfaceReseau = txt;
                    }
                }
            }
            
            /* Une route valide possede au moins 3 elements (Reseau/Default, Masque, Passerelle) */
            if (ips.length >= 3) {
                reseau = ips[0];
                masque = ips[1];
                passerelle = ips[2];
                
                tableDeRoutage.push({
                    "Réseau de destination": reseau,
                    "Masque du sous-réseau de destination": masque,
                    "Passerelle": passerelle,
                    "Interface": interfaceReseau || "LAN",
                    "Métrique": metrique || "1",
                    "Activé": active
                });
            }
        }
    }

    configLivebox.routage["table de routage"] = tableDeRoutage;
    console.warn("Routage extrait avec succes. Nombre de routes :", tableDeRoutage.length);

    /* ========================================================================= */
    /* 4. SAUVEGARDE                                                             */
    /* ========================================================================= */
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
    console.warn("Fin du module Routage.");
};