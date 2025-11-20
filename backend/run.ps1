# PowerShell script to load .env file and run Spring Boot backend

Write-Host "Loading environment variables from .env file..." -ForegroundColor Green

# Read .env file and set environment variables
Get-Content .env | ForEach-Object {
    # Skip comments and empty lines
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') {
        return
    }
    
    # Parse key=value pairs
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Set environment variable for this process
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
        Write-Host "  ✓ $key" -ForegroundColor Cyan
    }
}

Write-Host "`nStarting Spring Boot application..." -ForegroundColor Green
Write-Host "Backend will be available at: https://graduation-project-ftns.onrender.com" -ForegroundColor Yellow
Write-Host "Swagger UI: https://graduation-project-ftns.onrender.com/swagger-ui/index.html`n" -ForegroundColor Yellow

# Run Maven Spring Boot
./mvnw spring-boot:run
