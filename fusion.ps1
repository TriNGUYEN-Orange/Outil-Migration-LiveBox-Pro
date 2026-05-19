# Définir le fichier de sortie
$fichier_sortie = "projet_complet.txt"

# Supprimer le fichier s'il existe deja
if (Test-Path $fichier_sortie) {
    Remove-Item $fichier_sortie
}

# Liste des dossiers a ignorer
$dossiers_exclus = @(".git", "node_modules", "venv", "__pycache__", ".angular", "dist")

# Liste des extensions a inclure
$extensions_incluses = @("*.ts", "*.py", "*.html", "*.scss", "*.json", "*.js")

# Obtenir le chemin actuel
$chemin_actuel = (Get-Location).Path

# Parcourir et filtrer les fichiers
Get-ChildItem -Path . -Recurse -Include $extensions_incluses | 
Where-Object {
    $chemin = $_.FullName
    $exclu = $false
    foreach ($dossier in $dossiers_exclus) {
        if ($chemin -match "\\$dossier\\") {
            $exclu = $true
            break
        }
    }
    return (-not $exclu)
} | 
ForEach-Object {
    $chemin_relatif = $_.FullName.Replace("$chemin_actuel\", "")
    
    # Ecrire le separateur et le nom du fichier
    Add-Content -Path $fichier_sortie -Value "`n`n/* =========================================="
    Add-Content -Path $fichier_sortie -Value "   FICHIER : $chemin_relatif"
    Add-Content -Path $fichier_sortie -Value "   ========================================== */`n"
    
    # Lire et ajouter le contenu du fichier
    Get-Content $_.FullName | Add-Content -Path $fichier_sortie
}

Write-Host "Le script a termine. Fichier genere : $fichier_sortie"