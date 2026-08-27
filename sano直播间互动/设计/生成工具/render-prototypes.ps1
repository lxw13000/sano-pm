param(
    [string[]]$Names = @()
)

$ErrorActionPreference = 'Stop'

$ToolDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DesignDir = Split-Path -Parent $ToolDir
$SourceDir = Join-Path $DesignDir '源文件'
$OutputDir = Join-Path $DesignDir '原型图'
if (-not (Test-Path -LiteralPath $OutputDir -PathType Container)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$RuntimeRoot = 'C:\Users\24725\.cache\codex-runtimes\codex-primary-runtime\dependencies'
$Node = Join-Path $RuntimeRoot 'node\bin\node.exe'
$NodeModules = Join-Path $RuntimeRoot 'node\node_modules'
$SharpRenderer = Join-Path $ToolDir 'render-svg.js'

$ExpectedNames = @(
    '03-管理端-平台音效库.svg',
    '04-管理端-平台模板管理.svg',
    '04A-管理端-平台模板-新增菜单项弹窗.svg',
    '05-管理端-主播模板审核.svg',
    '06-App主播端-直播准备互动礼物菜单.svg',
    '07-App主播端-直播中互动任务.svg',
    '08-App观众端-直播间互动菜单.svg'
)

$Files = if ($Names.Count -gt 0) {
    @($Names | ForEach-Object {
        $Name = if ($_ -match '\.svg$') { $_ } else { $_ + '.svg' }
        $Path = Join-Path $SourceDir $Name
        if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "Missing SVG: $Path" }
        Get-Item -LiteralPath $Path
    })
} else {
    @($ExpectedNames | ForEach-Object {
        $Path = Join-Path $SourceDir $_
        if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { throw "Missing SVG: $Path" }
        Get-Item -LiteralPath $Path
    })
}

foreach ($File in $Files) {
    $PngPath = Join-Path $OutputDir ([System.IO.Path]::ChangeExtension($File.Name, '.png'))
    & $Node $SharpRenderer $File.FullName $PngPath $NodeModules
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $PngPath -PathType Leaf)) {
        throw "PNG render failed: $PngPath"
    }
}

$Files | ForEach-Object {
    $PngPath = Join-Path $OutputDir ([System.IO.Path]::ChangeExtension($_.Name, '.png'))
    Get-Item -LiteralPath $PngPath
} | Select-Object Name,Length,LastWriteTime
