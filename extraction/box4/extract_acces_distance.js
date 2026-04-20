/* --- /box4/extract_acces_distance.js --- */

window.extraireAccesDistance = async function() {
    const { 
        configLivebox, 
        simulerClic, 
        attendreElement, 
        attendreStabiliteDOM, 
        lireValeurInput, 
        lireEtat, 
        CLE_STORAGE 
    } = window;

    /* --- BLOC 13 : Accès à distance --- */
    console.log("⏳ [13/x] Extraction sur la page Accès à distance...");

    configLivebox["accès à distance"] = {};

    /* 1. Navigation vers "Mon compte" et attente dynamique */
    simulerClic("#menu_myAccount_hyperlink");
    await attendreElement("#menu_myAccount_distantaccess_hyperlink", 10000);

    /* 2. Navigation vers "Accès à distance" */
    simulerClic("#menu_myAccount_distantaccess_hyperlink");
    
    /* 3. Attendre l'apparition du bloc principal et sa stabilité (Plus de pause arbitraire !) */
    let selecteurFormulaire = "#myAccount_remoteAccess_userSettingsSection_login";
    let accesCharge = await attendreElement(selecteurFormulaire, 15000);
    
    if (accesCharge) {
        /* On attend que GWT finisse d'injecter le mot de passe et l'identifiant */
        await attendreStabiliteDOM("#myAccount_remoteAccess_userSettingsSection_mainBlock", 10000, 800);
        
        configLivebox["accès à distance"]["identifiant"] = lireValeurInput(selecteurFormulaire);
        configLivebox["accès à distance"]["mot de passe"] = lireValeurInput("#myAccount_remoteAccess_userSettingsSection_password_passwordTextbox");
        
        let etatActif = lireEtat("#myAccount_remoteAccess_settingsConfiguration_radioPanel");
        configLivebox["accès à distance"]["état"] = (etatActif === true) ? "activé" : (etatActif === false ? "désactivé" : "inconnu");
        
        configLivebox["accès à distance"]["port"] = lireValeurInput("#myAccount_remoteAccess_settingsConfiguration_port_textbox");

        console.log("✅ Accès à distance extrait avec succès !");
    } else {
        console.warn("⚠️ Page Accès à distance introuvable ou non chargée.");
        configLivebox["accès à distance"]["statut"] = "Non disponible";
    }

    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
};