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
$EdgeCandidates = @(
    'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
)
$Edge = $EdgeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $Edge) { throw 'Microsoft Edge not found.' }

$ExpectedNames = @(
    '01-管理端-用户身份列表.svg',
    '02-管理端-用户身份-任务模块.svg',
    '03-管理端-任务库-任务模块.svg',
    '04-管理端-新增任务模块.svg',
    '05-管理端-任务项管理.svg',
    '06-管理端-用户身份-App规则说明.svg',
    '07-管理端-用户身份成员.svg',
    '08-管理端-用户身份审核弹窗.svg',
    '09-管理端-周期任务审核列表.svg',
    '10-管理端-周期任务结果审核.svg',
    '11-管理端-奖励领取记录.svg',
    '12-H5-用户身份申请状态.svg',
    '13-H5-本周任务.svg',
    '14-H5-高峰时段任务结果详情.svg',
    '15-H5-外部内容截图上传.svg',
    '16-H5-上周奖励待领取.svg',
    '17-H5-奖励记录.svg',
    '18-H5-用户身份规则说明.svg',
    '19-H5-模块未完成无奖励.svg'
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
if ($Names.Count -eq 0 -and $Files.Count -ne 19) { throw "Expected 19 SVG files, found $($Files.Count)." }

$Rendered = @()
foreach ($File in $Files) {
    $IsMobile = $File.Name -match '-H5-'
    $WindowSize = if ($IsMobile) { '941,1672' } else { '1672,941' }
    $PngPath = Join-Path $OutputDir ([System.IO.Path]::ChangeExtension($File.Name, '.png'))
    if ((Test-Path -LiteralPath $Node -PathType Leaf) -and (Test-Path -LiteralPath (Join-Path $NodeModules 'sharp') -PathType Container)) {
        & $Node $SharpRenderer $File.FullName $PngPath $NodeModules
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $PngPath -PathType Leaf)) {
            throw "PNG render failed: $PngPath"
        }
        $Rendered += Get-Item -LiteralPath $PngPath
        continue
    }
    $ProfileDir = Join-Path ([System.IO.Path]::GetTempPath()) ('codex-sano-host-' + [guid]::NewGuid().ToString('N'))
    try {
        New-Item -ItemType Directory -Path $ProfileDir | Out-Null
        $Uri = [System.Uri]::new($File.FullName).AbsoluteUri
        & $Edge '--headless=new' '--disable-gpu' '--hide-scrollbars' '--no-first-run' "--user-data-dir=$ProfileDir" "--window-size=$WindowSize" "--screenshot=$PngPath" $Uri | Out-Null
        if (-not (Test-Path -LiteralPath $PngPath -PathType Leaf)) { throw "PNG render failed: $PngPath" }
        $Rendered += Get-Item -LiteralPath $PngPath
    } finally {
        if (Test-Path -LiteralPath $ProfileDir) {
            Start-Sleep -Milliseconds 300
            $TempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
            $ResolvedProfile = [System.IO.Path]::GetFullPath($ProfileDir)
            if ($ResolvedProfile.StartsWith($TempRoot) -and ([System.IO.Path]::GetFileName($ResolvedProfile) -like 'codex-sano-host-*')) {
                Remove-Item -LiteralPath $ResolvedProfile -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

$Rendered | Select-Object Name,Length,LastWriteTime
