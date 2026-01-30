# Download Jakarta Persistence API JAR for JasperReports compilation
# This script downloads jakarta.persistence-api-3.1.0.jar to jasper/lib if not present

$libDir = "d:/event_management_system/jasper/lib"
$jarName = "jakarta.persistence-api-3.1.0.jar"
$jarPath = Join-Path $libDir $jarName
$url = "https://repo1.maven.org/maven2/jakarta/persistence/jakarta.persistence-api/3.1.0/jakarta.persistence-api-3.1.0.jar"

if (!(Test-Path $jarPath)) {
    Write-Host "Downloading $jarName..."
    Invoke-WebRequest -Uri $url -OutFile $jarPath
} else {
    Write-Host "$jarName already exists."
}
