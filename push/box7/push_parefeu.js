const CODE_PUSH_PAREFEU = `
    /* --- ÉTAPE : CONFIGURATION DU PARE-FEU --- */
    console.log("⏳ Application des paramètres du Pare-feu...");

    if (configLivebox && configLivebox.parefeu) {
        
        let btnAvance = await attendreElement("#sah_footer .icon-advanced", 10000);
        
        if (btnAvance) {
            cliquerBouton("#sah_footer .icon-advanced");
            await attendrePause(800); 
            
            let btnPareFeu = await attendreElement("#networkFirewall", 10000);
            if (btnPareFeu) {
                btnPareFeu.scrollIntoView({ behavior: 'smooth', block: 'center' });
                cliquerBouton("#networkFirewall");
                
                let iframe = await attendreElement("#iframeapp", 10000);
                if (iframe) {
                    let docIframe = iframe.contentDocument || iframe.contentWindow.document;
                    
                    /* 🚨 Ý TƯỞNG CỦA BẠN: Chờ cái hộp chứa tất cả các nút Radio (div#security) tải xong hoàn toàn */
                    console.log("⏳ Attente du chargement complet du bloc Pare-feu...");
                    let conteneurSecurity = await attendreElementDansDoc(docIframe, "div#security", 10000);
                    
                    if (conteneurSecurity) {
                        /* Nghỉ thêm 0.5s để chắc chắn Ractive.js đã sẵn sàng nhận lệnh click */
                        await attendrePause(500); 
                        
                        let niveauVoulu = (configLivebox.parefeu["niveau de protection"] || "moyen").toLowerCase();
                        let idCible = "#security_Medium"; 
                        
                        if (niveauVoulu.includes("faible")) idCible = "#security_Low";
                        else if (niveauVoulu.includes("élevé") || niveauVoulu.includes("eleve")) idCible = "#security_High";
                        else if (niveauVoulu.includes("personnalisé") || niveauVoulu.includes("personnalise")) idCible = "#security_Custom";
                        else if (niveauVoulu.includes("intermédiaire") || niveauVoulu.includes("intermediaire")) idCible = "#security_IntermediateP";
                        
                        let radioCible = docIframe.querySelector(idCible);
                        
                        if (radioCible && !radioCible.checked) {
                            console.log("👉 Application du niveau de pare-feu : " + niveauVoulu);
                            
                            /* 🚨 BÍ QUYẾT: Click vào cái thẻ LABEL (chữ) thay vì ép click vào cái nút tròn Radio */
                            let nomId = idCible.replace('#', '');
                            let labelCible = docIframe.querySelector('label[for="' + nomId + '"]');
                            
                            if (labelCible) {
                                cliquerPur(labelCible);
                            } else {
                                cliquerPur(radioCible); /* Phương án dự phòng */
                            }
                            
                            await attendrePause(800); /* Đợi giao diện ghi nhận thao tác bấm */
                            
                            let btnSave = docIframe.querySelector("#submit");
                            if (btnSave) {
                                cliquerPur(btnSave);
                                await attendreFinSauvegarde(docIframe);
                            }
                        } else {
                            console.log("✅ Le niveau de pare-feu est déjà sur : " + niveauVoulu);
                        }
                    } else {
                        console.warn("⚠️ Le conteneur div#security n'est pas apparu.");
                    }
                }
            }
        }
        await retournerAccueil();
    }
`;