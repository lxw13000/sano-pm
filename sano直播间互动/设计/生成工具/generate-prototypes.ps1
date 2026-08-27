$ErrorActionPreference = 'Stop'

$ToolDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RuntimeRoot = 'C:\Users\24725\.cache\codex-runtimes\codex-primary-runtime\dependencies'
$Node = Join-Path $RuntimeRoot 'node\bin\node.exe'
$Generator = Join-Path $ToolDir 'generate-prototypes.js'

if (-not (Test-Path -LiteralPath $Node -PathType Leaf)) {
    throw "Node runtime not found: $Node"
}

& $Node $Generator
if ($LASTEXITCODE -ne 0) {
    throw 'SVG prototype generation failed.'
}
