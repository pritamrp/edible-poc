$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

$python = "..\.venv\Scripts\python.exe"

$env:PYTHONDONTWRITEBYTECODE = "1"
$env:PYTHONPATH = $PSScriptRoot

Write-Host "Running backend smoke tests..."
& $python -c "import sys; print('Python:', sys.executable); print('Version:', sys.version.split()[0])"
& $python -c "import fastapi, httpx, sqlalchemy, nanoid; print('Deps: ok')"
& $python -m unittest discover -s tests -p "test_*.py" -v
