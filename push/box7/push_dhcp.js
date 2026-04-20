const CODE_PUSH_DHCP = `
    /* --- ÉTAPE : CONFIGURATION DHCP & DNS --- */
    console.log("⏳ Application des paramètres DHCP...");

    if (configLivebox && configLivebox.dhcp_dns) {
        
        let btnAvance = await attendreElement("#sah_footer .icon-advanced", 10000);
        
        if (btnAvance) {
            cliquerBouton("#sah_footer .icon-advanced");
            await attendrePause(800); 
            
            let tuileDhcp = await attendreElement("#networkAdvanced", 10000);
            if (tuileDhcp) {
                tuileDhcp.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await attendrePause(300);
                cliquerBouton("#networkAdvanced .widget");
                
                let iframe = await attendreElement("#iframeapp", 10000);
                if (iframe) {
                    let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                    await attendreFinSauvegarde(docIframe); /* ⚡ Remplace l'attente manuelle */
                    
                    let configDhcp = configLivebox.dhcp_dns;

                    if (typeof configDhcp["état du serveur DHCP"] !== "undefined") {
                        let cbDhcp = docIframe.querySelector("#dhcpServ_true");
                        if (cbDhcp && cbDhcp.checked !== configDhcp["état du serveur DHCP"]) {
                            cbDhcp.click();
                            await attendrePause(500);
                        }
                    }

                    if (configDhcp["adresse IP du LAN"]) ecrireTexteDansDoc(docIframe, "#dhcpIP", configDhcp["adresse IP du LAN"]);
                    if (configDhcp["masque de sous-réseau du LAN"]) ecrireTexteDansDoc(docIframe, "#dhcpMask", configDhcp["masque de sous-réseau du LAN"]);
                    if (configDhcp["adresse IP de début"]) ecrireTexteDansDoc(docIframe, "#ipBegin", configDhcp["adresse IP de début"]);
                    if (configDhcp["adresse IP de fin"]) ecrireTexteDansDoc(docIframe, "#ipEnd", configDhcp["adresse IP de fin"]);

                    if (configDhcp["mode DNS"]) {
                        let selectDns = docIframe.querySelector("#dnsMode");
                        if (selectDns) {
                            let modeVoulu = configDhcp["mode DNS"].toLowerCase();
                            let optionTrouvee = Array.from(selectDns.options).find(opt => opt.value.toLowerCase() === modeVoulu || opt.text.toLowerCase() === modeVoulu);
                            if (optionTrouvee) {
                                selectDns.value = optionTrouvee.value;
                                selectDns.dispatchEvent(new Event("change", { bubbles: true }));
                            }
                        }
                    }

                    let btnSubmit = docIframe.querySelector("#submit");
                    if (btnSubmit) {
                        btnSubmit.click();
                        await attendreFinSauvegarde(docIframe);
                        console.log("✅ Configuration DHCP terminée !");
                    }
                }
            }
        }
        await retournerAccueil();
    }
`;