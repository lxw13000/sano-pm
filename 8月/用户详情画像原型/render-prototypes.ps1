$ErrorActionPreference = 'Stop'

$PrototypeDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

if (-not (Test-Path -LiteralPath $Edge)) {
    throw "Microsoft Edge not found: $Edge"
}

$Files = @(
    '01-画像概览',
    '02-用户活跃日历',
    '03-身份与关系',
    '04-资产与交易',
    '05-消费与收益',
    '06-直播分析',
    '07-风控记录'
)

$Index = 0
foreach ($Name in $Files) {
    $Index++
    $SvgPath = Join-Path $PrototypeDir ($Name + '.svg')
    $PngPath = Join-Path $PrototypeDir ($Name + '.png')
    $ProfileDir = Join-Path ([System.IO.Path]::GetTempPath()) ("codex-user-profile-prototype-edge-$Index")
    if (-not (Test-Path -LiteralPath $SvgPath)) {
        throw "Missing SVG prototype: $SvgPath"
    }
    $Uri = [System.Uri]::new($SvgPath).AbsoluteUri
    $WindowSize = if ($Name -eq '01-画像概览') {
        '1600,1390'
    } elseif ($Name -eq '03-身份与关系') {
        '1600,1440'
    } elseif ($Name -eq '05-消费与收益') {
        '1600,1700'
    } elseif ($Name -eq '06-直播分析') {
        '1600,2085'
    } elseif ($Name -eq '07-风控记录') {
        '1600,1850'
    } else {
        '1600,1200'
    }
    & $Edge '--headless=new' '--disable-gpu' '--hide-scrollbars' '--no-first-run' '--allow-file-access-from-files' "--user-data-dir=$ProfileDir" "--window-size=$WindowSize" "--screenshot=$PngPath" $Uri | Out-Null
    if (-not (Test-Path -LiteralPath $PngPath)) {
        throw "PNG render failed: $PngPath"
    }
}

Get-ChildItem -LiteralPath $PrototypeDir -Filter '*.png' | Select-Object Name, Length, LastWriteTime
