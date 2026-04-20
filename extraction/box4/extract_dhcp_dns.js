/* --- /box4/extract_dhcp_dns.js --- */

window.extraireDhcpDns = async function(estRattrapage = false) {
    const { 
        configLivebox, 
        attendreElement, 
        lireEtat, 
        lireValeurInput, 
        extraireTableau, 
        CLE_STORAGE 
    } = window;


    /* --- BLOC 3 : DHCP & DNS --- */
    console.log("⏳ [3/3] Extraction sur la page DHCP/DNS...");

    if (estRattrapage) {
        console.log("🔄 Mode tentative activé : Passage par le menu Wi-Fi d'abord...");
        simulerClic("#homepage_wifi_configuration_hyperlink");
        await attendrePause(1000); 
    }
    
    await attendreElement("#network_dhcp_configuration_serverState_radioPanel", 10000);

    configLivebox.dhcp_dns["état du serveur DHCP"] = lireEtat("#network_dhcp_configuration_serverState_radioPanel");
    configLivebox.dhcp_dns["adresse IP du LAN"] = lireValeurInput("#network_dhcp_configuration_ipLanAddress_textbox");
    configLivebox.dhcp_dns["masque de sous-réseau du LAN"] = lireValeurInput("#network_dhcp_configuration_subnetMask_textbox");
    configLivebox.dhcp_dns["adresse IP de début"] = lireValeurInput("#network_dhcp_configuration_ipAddress_start_textbox");
    configLivebox.dhcp_dns["adresse IP de fin"] = lireValeurInput("#network_dhcp_configuration_ipAddress_end_textbox");
    configLivebox.dhcp_dns["mode DNS"] = lireValeurInput("#network_dhcp_configuration_modeDNS_combobox");
    
    /* REFACTOR : Sélecteur direct pour le tableau des baux statiques */
    let selecteurTableauDHCP = "#network_dhcp_staticAddressesSection_mainBlock table";
    await attendreElement(selecteurTableauDHCP, 5000);

    configLivebox.dhcp_dns["Baux DHCP statiques"] = extraireTableau(
        selecteurTableauDHCP,
        { 
            "Équipement": 0, 
            "Adresse IP statique": 1, 
            "Adresse MAC": 2 
        }
    );

    localStorage.setItem(CLE_STORAGE, JSON.stringify(configLivebox));
};