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
    'admin-01-01-01-任务项列表与详情.svg',
    'admin-01-01-02-编辑任务项状态.svg',
    'admin-01-01-03-新增任务项状态.svg',
    'admin-01-02-01-任务模块列表与详情.svg',
    'admin-01-02-02-新增编辑模块基础信息弹窗.svg',
    'admin-01-02-03-管理关联任务抽屉.svg',
    'admin-01-02-04-选择任务项弹窗.svg',
    'admin-01-02-05-固定奖励配置抽屉.svg',
    'admin-01-02-06-阶梯奖励配置抽屉.svg',
    'admin-01-02-07-新增编辑固定奖励明细弹窗.svg',
    'admin-01-02-08-新增编辑阶梯档位弹窗.svg',
    'admin-01-02-09-优质邀请奖励模块详情.svg',
    'admin-01-03-01-用户身份列表.svg',
    'admin-01-03-02-新增编辑身份弹窗.svg',
    'admin-01-03-03-管理身份关联模块抽屉.svg',
    'admin-01-03-04-选择任务模块弹窗.svg',
    'admin-01-03-05-用户身份-App规则说明.svg',
    'admin-02-01-01-用户身份成员列表.svg',
    'admin-02-01-02-身份审核弹窗.svg',
    'admin-03-01-01-周期任务审核列表.svg',
    'admin-03-01-02-周期任务查看审核详情.svg',
    'admin-03-01-03-材料审核弹窗.svg',
    'admin-04-01-01-周期奖励结算记录.svg',
    'admin-04-01-02-周期奖励结算详情抽屉.svg',
    'H5-01-01-01-用户身份申请状态.svg',
    'H5-01-02-01-用户身份规则说明.svg',
    'H5-02-01-01-日任务当前日期.svg',
    'H5-02-01-02-日任务日期选择器.svg',
    'H5-02-01-03-日任务历史日期待领取.svg',
    'H5-02-02-01-周任务本周.svg',
    'H5-02-02-02-周任务上周奖励待领取.svg',
    'H5-02-03-01-月任务本月.svg',
    'H5-02-03-02-月任务上月奖励待领取.svg',
    'H5-03-01-01-任务模块详情.svg',
    'H5-03-02-01-高峰时段任务结果详情.svg',
    'H5-03-03-01-上一周期任务模块详情.svg',
    'H5-03-03-02-上一周期高峰直播任务详情.svg',
    'H5-03-04-02-优质邀请任务详情.svg',
    'H5-04-01-01-分享奖励模块详情.svg',
    'H5-04-01-02-分享任务详情.svg',
    'H5-04-01-03-外部内容截图上传.svg',
    'H5-05-01-01-奖励详情弹窗.svg',
    'H5-05-02-01-模块未完成无奖励.svg',
    'H5-05-03-01-整周期审核不通过.svg'
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
if ($Names.Count -eq 0 -and $Files.Count -ne 44) { throw "Expected 44 SVG files, found $($Files.Count)." }

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
