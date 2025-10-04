Param(
  [switch]$Install,
  [switch]$Seed
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "[ERR ] $msg" -ForegroundColor Red }

# --- Resolve project root ---
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-Path (Join-Path $scriptDir '..')
Set-Location $root

# --- .env / DATABASE_URL ---
$envPath = Join-Path $root '.env'
if (-not (Test-Path $envPath)) {
  Write-Warn ".env not found. Copying from .env.example..."
  $example = Join-Path $root '.env.example'
  if (Test-Path $example) { Copy-Item $example $envPath -Force } else { Write-Err ".env.example not found. Please create .env"; exit 1 }
}

$databaseUrl = (Get-Content $envPath | Where-Object { $_ -match '^DATABASE_URL\s*=\s*' })
if (-not $databaseUrl) { Write-Err "DATABASE_URL not set in .env"; exit 1 }
$databaseUrl = $databaseUrl -replace '^DATABASE_URL\s*=\s*', ''
$databaseUrl = $databaseUrl.Trim('"')

try {
  $uri = [Uri]$databaseUrl
} catch {
  Write-Err "DATABASE_URL is not a valid URI: $databaseUrl"
  exit 1
}

# Extract parts
$userInfo = $uri.UserInfo.Split(':',2)
$dbUser = $userInfo[0]
$dbPass = if ($userInfo.Count -gt 1) { $userInfo[1] } else { '' }
$dbHost = $uri.Host
$dbPort = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
$dbName = $uri.AbsolutePath.Trim('/')
if (-not $dbName) { Write-Err "No database name found in DATABASE_URL"; exit 1 }

Write-Info "Parsed DATABASE_URL → host=$dbHost port=$dbPort user=$dbUser db=$dbName"

# --- Locate psql ---
function Find-Psql {
  $cmd = Get-Command psql -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $default = Get-ChildItem -Path "C:\\Program Files\\PostgreSQL" -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    ForEach-Object { Join-Path $_.FullName 'bin\\psql.exe' } |
    Where-Object { Test-Path $_ } |
    Select-Object -First 1
  return $default
}

$psql = Find-Psql
if (-not $psql) { Write-Err "psql not found. Install PostgreSQL or add psql to PATH."; exit 1 }
Write-Info "Using psql: $psql"

# --- Ensure database exists ---
$env:PGPASSWORD = $dbPass
try {
  $exists = & $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -t -A -c "SELECT 1 FROM pg_database WHERE datname = '$dbName'" 2>$null
} catch {
  Write-Err "Failed to connect to Postgres with provided credentials. $_"
  exit 1
}

if (-not $exists) { $exists = '' }
if ($exists.Trim() -ne '1') {
  Write-Info "Creating database '$dbName'..."
  try {
    & $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE \"$dbName\";" | Out-Null
    Write-Info "Database created."
  } catch {
    Write-Err "Could not create database. Ensure the user '$dbUser' has createdb privileges. $_"
    exit 1
  }
} else {
  Write-Info "Database '$dbName' already exists."
}

# --- Install deps (optional) ---
if ($Install) {
  Write-Info "Installing npm dependencies (this requires internet)..."
  npm install
}

# --- Prisma generate + migrate ---
if (-not (Test-Path (Join-Path $root 'node_modules'))) {
  Write-Warn "node_modules missing. Skipping Prisma steps. Run with -Install or npm install first."
} else {
  Write-Info "Generating Prisma client..."
  npx prisma generate
  Write-Info "Applying migrations (dev)..."
  npx prisma migrate dev --name init
  if ($Seed) {
    Write-Info "Seeding database..."
    npm run db:seed
  }
}

Write-Host "\nDone. You can now run: npm run dev" -ForegroundColor Green

