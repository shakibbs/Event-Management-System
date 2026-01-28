
# Create lib directory
$libDir = "d:\event_management_system\jasper\lib"
if (!(Test-Path $libDir)) { New-Item -ItemType Directory -Path $libDir | Out-Null }

# List of required JARs (core + main dependencies)
$jars = @(
	"jasperreports-6.20.0.jar",
	"commons-logging-1.2.jar",
	"commons-digester-2.1.jar",
	"commons-collections-3.2.2.jar",
	"commons-beanutils-1.9.4.jar",
	"groovy-all-2.4.21.jar",
	"itext-2.1.7.js6.jar",
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
	"groovy-all-2.4.21.jar" = "https://repo1.maven.org/maven2/org/codehaus/groovy/groovy-all/2.4.21/groovy-all-2.4.21.jar"
	"itext-2.1.7.js6.jar" = "https://repo1.maven.org/maven2/com/lowagie/itext/2.1.7.js6/itext-2.1.7.js6.jar"
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

# Build classpath string
$cp = ($jars | ForEach-Object { "d:\event_management_system\jasper\lib\$_" }) -join ";"


# Compile the JRXML to JASPER and output to target/classes/
$jrxml = "d:\event_management_system\src\main\resources\events_list.jrxml"
$jasperOut = "d:\event_management_system\target\classes\events_list.jasper"

Write-Host "Compiling events_list.jrxml to target/classes/events_list.jasper..."

# Remove old .jasper if exists
if (Test-Path $jasperOut) {
	Remove-Item $jasperOut -Force
}

# Compile using JasperCompileManager (with output)
$compileCmd = "-cp `"$cp`" net.sf.jasperreports.engine.JasperCompileManager $jrxml $jasperOut"
Write-Host "Running: java $compileCmd"
$proc = Start-Process java -ArgumentList $compileCmd -NoNewWindow -Wait -PassThru -RedirectStandardOutput jasper_compile.log -RedirectStandardError jasper_compile.err

# Check for errors
if ($proc.ExitCode -ne 0) {
	Write-Host "Jasper compilation failed. See jasper_compile.err for details." -ForegroundColor Red
	Get-Content jasper_compile.err
	exit 1
} else {
	Write-Host "Jasper compilation succeeded. Output: $jasperOut" -ForegroundColor Green
}
