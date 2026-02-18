$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$python = Join-Path $repoRoot ".venv\\Scripts\\python.exe"
if (-not (Test-Path $python)) {
  throw "Missing venv python at $python. Run: python -m venv .venv; .\\.venv\\Scripts\\Activate; pip install -r requirements.txt"
}

Write-Host "Starting backend + frontend..."

$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"

if (-not (Test-Path $backendDir)) { throw "Missing backend directory: $backendDir" }
if (-not (Test-Path $frontendDir)) { throw "Missing frontend directory: $frontendDir" }

# Backend: migrate then run FastAPI
$backendArgs = @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-Command",
  "cd `"$backendDir`"; `$env:PYTHONPATH = `"$backendDir`"; & `"$python`" -m alembic upgrade head; & `"$python`" -m uvicorn app.main:app --reload --port 8000"
)

# Frontend: Next.js dev server
$frontendArgs = @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-Command",
  "cd `"$frontendDir`"; npm run dev"
)

$backend = Start-Process -FilePath "powershell" -ArgumentList $backendArgs -PassThru
$frontend = Start-Process -FilePath "powershell" -ArgumentList $frontendArgs -PassThru

Write-Host "Backend PID: $($backend.Id) (http://localhost:8000/docs)"
Write-Host "Frontend PID: $($frontend.Id) (http://localhost:3000)"
Write-Host "Close this window or Ctrl+C to stop. (You may need to stop the two spawned PowerShell processes.)"

Wait-Process -Id $backend.Id, $frontend.Id

