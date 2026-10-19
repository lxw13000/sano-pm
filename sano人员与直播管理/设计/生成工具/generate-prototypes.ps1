param([string]$Node='C:\Users\24725\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe')
$ErrorActionPreference='Stop'
& $Node (Join-Path $PSScriptRoot 'generate-prototypes.js')
if($LASTEXITCODE -ne 0){throw 'SVG generation failed.'}
