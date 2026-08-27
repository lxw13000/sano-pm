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
$FontCacheDir = Join-Path ([System.IO.Path]::GetTempPath()) 'codex-sano-score-font-cache'
if (-not (Test-Path -LiteralPath $FontCacheDir -PathType Container)) {
    New-Item -ItemType Directory -Path $FontCacheDir | Out-Null
}
$env:XDG_CACHE_HOME = $FontCacheDir
$EdgeCandidates = @(
    'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
)
$Edge = $EdgeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

$ExpectedNames = @(
    '01-管理端-评分类型.svg',
    '02-管理端-评分类型-关联参数.svg',
    '03-管理端-评分类型-删除确认.svg',
    '04-管理端-评分参数.svg',
    '05-管理端-评分参数-新增参数.svg',
    '06-管理端-评分参数-删除确认.svg',
    '07-管理端-用户评分结果.svg',
    '08-管理端-用户评分结果详情.svg'
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

if ($Names.Count -eq 0 -and $Files.Count -ne 8) {
    throw "Expected 8 SVG files, found $($Files.Count)."
}

$Rendered = @()
foreach ($File in $Files) {
    $PngPath = Join-Path $OutputDir ([System.IO.Path]::ChangeExtension($File.Name, '.png'))
    if ((Test-Path -LiteralPath $Node -PathType Leaf) -and (Test-Path -LiteralPath (Join-Path $NodeModules 'sharp') -PathType Container)) {
        & $Node $SharpRenderer $File.FullName $PngPath $NodeModules
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $PngPath -PathType Leaf)) {
            throw "PNG render failed: $PngPath"
        }
        $Rendered += Get-Item -LiteralPath $PngPath
        continue
    }

    if (-not $Edge) { throw 'Neither bundled Sharp runtime nor Microsoft Edge is available.' }
    $ProfileDir = Join-Path ([System.IO.Path]::GetTempPath()) ('codex-sano-score-' + [guid]::NewGuid().ToString('N'))
    try {
        New-Item -ItemType Directory -Path $ProfileDir | Out-Null
        $Uri = [System.Uri]::new($File.FullName).AbsoluteUri
        & $Edge '--headless=new' '--disable-gpu' '--hide-scrollbars' '--no-first-run' "--user-data-dir=$ProfileDir" '--window-size=1672,941' "--screenshot=$PngPath" $Uri | Out-Null
        if (-not (Test-Path -LiteralPath $PngPath -PathType Leaf)) { throw "PNG render failed: $PngPath" }
        $Rendered += Get-Item -LiteralPath $PngPath
    } finally {
        if (Test-Path -LiteralPath $ProfileDir) {
            Start-Sleep -Milliseconds 300
            $TempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
            $ResolvedProfile = [System.IO.Path]::GetFullPath($ProfileDir)
            if ($ResolvedProfile.StartsWith($TempRoot) -and ([System.IO.Path]::GetFileName($ResolvedProfile) -like 'codex-sano-score-*')) {
                Remove-Item -LiteralPath $ResolvedProfile -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

$Rendered | Select-Object Name,Length,LastWriteTime
