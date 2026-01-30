
# Create lib directory
$libDir = "d:\event_management_system\jasper\lib"
if (!(Test-Path $libDir)) { New-Item -ItemType Directory -Path $libDir | Out-Null }

# List of required JARs (core + main dependencies)
$jars = @(
	"jasperreports-6.20.0.jar",
	"commons-logging-1.2.jar",
	"commons-digester-2.1.jar",
	"commons-collections-3.2.2.jar",
	"commons-collections4-4.4.jar",
	"commons-beanutils-1.9.4.jar",
	"groovy-all-2.4.21.jar",
	"itext-2.1.7.jar",
	"jfreechart-1.5.3.jar",
	"jcommon-1.0.24.jar"
)

# Download JARs if not present
$baseUrls = @{
	"jasperreports-6.20.0.jar" = "https://repo1.maven.org/maven2/net/sf/jasperreports/jasperreports/6.20.0/jasperreports-6.20.0.jar"
	"commons-logging-1.2.jar" = "https://repo1.maven.org/maven2/commons-logging/commons-logging/1.2/commons-logging-1.2.jar"
	"commons-digester-2.1.jar" = "https://repo1.maven.org/maven2/commons-digester/commons-digester/2.1/commons-digester-2.1.jar"
	"commons-collections-3.2.2.jar" = "https://repo1.maven.org/maven2/commons-collections/commons-collections/3.2.2/commons-collections-3.2.2.jar"
	"commons-beanutils-1.9.4.jar" = "https://repo1.maven.org/maven2/commons-beanutils/commons-beanutils/1.9.4/commons-beanutils-1.9.4.jar"
	"commons-collections4-4.4.jar" = "https://repo1.maven.org/maven2/org/apache/commons/commons-collections4/4.4/commons-collections4-4.4.jar"
	"groovy-all-2.4.21.jar" = "https://repo1.maven.org/maven2/org/codehaus/groovy/groovy-all/2.4.21/groovy-all-2.4.21.jar"
	"itext-2.1.7.jar" = "https://repo1.maven.org/maven2/com/lowagie/itext/2.1.7/itext-2.1.7.jar"
	"jfreechart-1.5.3.jar" = "https://repo1.maven.org/maven2/org/jfree/jfreechart/1.5.3/jfreechart-1.5.3.jar"
	"jcommon-1.0.24.jar" = "https://repo1.maven.org/maven2/org/jfree/jcommon/1.0.24/jcommon-1.0.24.jar"
}

foreach ($jar in $jars) {
	$jarPath = Join-Path $libDir $jar
	if (!(Test-Path $jarPath)) {
		Write-Host "Downloading $jar..."
		Invoke-WebRequest -Uri $baseUrls[$jar] -OutFile $jarPath
	}
}


# Build classpath string (include compiled classes and Jakarta Persistence API)
$jakartaJar = "d:\event_management_system\jasper\lib\jakarta.persistence-api-3.1.0.jar"
$jarsCp = ($jars | ForEach-Object { "d:\event_management_system\jasper\lib\$_" }) -join ';'
$cp = "d:\event_management_system\target\classes;${jakartaJar};${jarsCp}"



# Compile the JRXML to JASPER and output to target/classes/
$jrxml = "d:\event_management_system\src\main\resources\dynamic_export.jrxml"
$jasperOut = "d:\event_management_system\target\classes\dynamic_export.jasper"

Write-Host "Compiling dynamic_export.jrxml to target/classes/dynamic_export.jasper..."

# Remove old .jasper if exists
if (Test-Path $jasperOut) {
	try {
		Remove-Item $jasperOut -Force
	} catch {
		Write-Host "Warning: Could not remove $jasperOut. It may be locked by another process. Please close any application using it and try again." -ForegroundColor Yellow
	}
}



# Compile using JasperCompiler Java class (include all JARs and classes)
Write-Host "Compiling JasperCompiler.java..."
$javacCp = '"' + $cp + ';d:\event_management_system\jasper"'
& javac -cp $javacCp "d:\event_management_system\jasper\JasperCompiler.java"





$runCp = '"' + $cp + ';d:\event_management_system\jasper"'
Write-Host "Running: java -cp $runCp JasperCompiler $jrxml $jasperOut"
& java -cp $runCp JasperCompiler $jrxml $jasperOut 1> jasper_compile.log 2> jasper_compile.err
$procExitCode = $LASTEXITCODE

# Check for errors
if ($procExitCode -ne 0) {
	Write-Host "Jasper compilation failed. See jasper_compile.err for details." -ForegroundColor Red
	Get-Content jasper_compile.err
	exit 1
} else {
	Write-Host "Jasper compilation succeeded. Output: $jasperOut" -ForegroundColor Green
}
