param([string]$Node='C:\Users\24725\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe',[string]$NodeModules='C:\Users\24725\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules')
$ErrorActionPreference='Stop'
& $Node (Join-Path $PSScriptRoot 'render-prototypes.js') $NodeModules
if($LASTEXITCODE -ne 0){throw 'PNG rendering failed.'}
