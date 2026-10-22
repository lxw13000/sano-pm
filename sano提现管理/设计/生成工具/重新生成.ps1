param(
  [string]$Node = 'node',
  [string]$NodeModules = 'C:\Users\24725\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules',
  [string]$Chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
)
$ErrorActionPreference = 'Stop'
$env:SANO_NODE_MODULES = $NodeModules
$env:SANO_CHROME = $Chrome
& $Node (Join-Path $PSScriptRoot 'validate-prototypes.js')
if ($LASTEXITCODE -ne 0) { throw 'Prototype validation failed.' }
& $Node (Join-Path $PSScriptRoot 'render-prototypes.js')
if ($LASTEXITCODE -ne 0) { throw 'Prototype rendering failed.' }
