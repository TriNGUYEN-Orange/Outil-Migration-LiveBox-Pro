/* --- /box4/extract_pare-feu.js --- */

window.extraireParefeu = async function(estRattrapage = false) {
    const { 
        configLivebox, 
        simulerClic, 
        attendreElement, 
        lireEtat, 
        CLE_STORAGE 
    } = window;


    console.log("⏳ [10/x] Extraction sur la page Pare-feu...");

    if (estRattrapage) {
        console.log("🔄 Mode tentative activé : Passage par le menu Wi-Fi d'abord...");
        simulerClic("#homepage_wifi_configuration_hyperlink");
        await attendrePause(1000); 
    }

    /* 1. Navigation vers la page Pare-feu */
    simulerClic("#menu_menuNetwork_firewall_hyperlink");

    let selecteurRadiosPareFeu = "#network_firewall_protectionSection_mainBlock input[type='radio']";
    await attendreElement(selecteurRadiosPareFeu, 30000);

    configLivebox.parefeu = configLivebox.parefeu || {};

    /* 3. Extraire le niveau de protection (Gestion spécifique pour les boutons radio) */
    let radioProtectionCoche = document.querySelector("#network_firewall_protectionSection_mainBlock input[type='radio']:checked");
    
    if (radioProtectionCoche) {
        /* Trouver le texte lisible (label) associé au bouton radio sélectionné */
        let labelAssocie = document.querySelector('label[for="' + radioProtectionCoche.id + '"]');
        configLivebox.parefeu["niveau de protection"] = labelAssocie ? (labelAssocie.innerText || labelAssocie.textContent).trim() : radioProtectionCoche.value;
    } else {
        configLivebox.parefeu["niveau de protection"] = "Inconnu";
    }

    /* Extraire la réponse au ping */
    configLivebox.parefeu["répondre au ping"] = lireEtat("#network_firewall_ping_answerPing_radioPanel");

    /* 4. Sauvegarder les nouvelles données dans le localStorage */
    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
    
    console.log("✅ Pare-feu extrait avec succès !");
};