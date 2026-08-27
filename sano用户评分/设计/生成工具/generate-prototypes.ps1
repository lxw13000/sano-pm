$ErrorActionPreference = 'Stop'

$ToolDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DesignDir = Split-Path -Parent $ToolDir
$OutputDir = Join-Path $DesignDir '源文件'
if (-not (Test-Path -LiteralPath $OutputDir -PathType Container)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$script:Svg = $null

function Esc([string]$Value) {
    return [System.Security.SecurityElement]::Escape($Value)
}

function Add([string]$Markup) {
    [void]$script:Svg.AppendLine($Markup)
}

function Rect($X, $Y, $W, $H, $Fill = '#FFFFFF', $Radius = 10, $Stroke = 'none', $StrokeWidth = 1) {
    Add ('<rect x="{0}" y="{1}" width="{2}" height="{3}" rx="{4}" fill="{5}" stroke="{6}" stroke-width="{7}"/>' -f $X,$Y,$W,$H,$Radius,$Fill,$Stroke,$StrokeWidth)
}

function Line($X1, $Y1, $X2, $Y2, $Stroke = '#E5E7EB', $StrokeWidth = 1, $Dash = '') {
    $DashAttr = if ($Dash) { ' stroke-dasharray="' + $Dash + '"' } else { '' }
    Add ('<line x1="{0}" y1="{1}" x2="{2}" y2="{3}" stroke="{4}" stroke-width="{5}"{6}/>' -f $X1,$Y1,$X2,$Y2,$Stroke,$StrokeWidth,$DashAttr)
}

function Text($X, $Y, [string]$Value, $Size = 14, $Fill = '#334155', $Weight = 400, $Anchor = 'start') {
    Add ('<text x="{0}" y="{1}" font-size="{2}" fill="{3}" font-weight="{4}" text-anchor="{5}">{6}</text>' -f $X,$Y,$Size,$Fill,$Weight,$Anchor,(Esc $Value))
}

function Circle($CX, $CY, $R, $Fill, $Stroke = 'none', $StrokeWidth = 1) {
    Add ('<circle cx="{0}" cy="{1}" r="{2}" fill="{3}" stroke="{4}" stroke-width="{5}"/>' -f $CX,$CY,$R,$Fill,$Stroke,$StrokeWidth)
}

function Badge($X, $Y, [string]$Value, $Fill = '#EEF2FF', $Color = '#4F46E5') {
    $W = [Math]::Max(62, 24 + $Value.Length * 15)
    Rect $X $Y $W 28 $Fill 14
    Text ($X + $W / 2) ($Y + 19) $Value 12 $Color 600 'middle'
    return $W
}

function Button($X, $Y, $W, [string]$Value, $Style = 'primary') {
    $Fill = '#4F2BEE'; $Color = '#FFFFFF'; $Stroke = '#4F2BEE'
    if ($Style -eq 'secondary') { $Fill = '#FFFFFF'; $Color = '#4F2BEE'; $Stroke = '#B8A9FF' }
    if ($Style -eq 'danger') { $Fill = '#FFFFFF'; $Color = '#DC2626'; $Stroke = '#FCA5A5' }
    if ($Style -eq 'dangerPrimary') { $Fill = '#DC2626'; $Color = '#FFFFFF'; $Stroke = '#DC2626' }
    Rect $X $Y $W 42 $Fill 7 $Stroke 1
    Text ($X + $W / 2) ($Y + 27) $Value 14 $Color 600 'middle'
}

function Field($X, $Y, $W, [string]$Label, [string]$Value = '', [string]$Placeholder = '', $Disabled = $false) {
    Text $X $Y $Label 12 '#475569' 600
    $Fill = if ($Disabled) { '#F8FAFC' } else { '#FFFFFF' }
    Rect $X ($Y + 12) $W 42 $Fill 6 '#DCE3EE' 1
    $Display = if ($Value) { $Value } else { $Placeholder }
    $Color = if ($Value) { if ($Disabled) { '#64748B' } else { '#1E293B' } } else { '#94A3B8' }
    Text ($X + 14) ($Y + 39) $Display 12 $Color 500
}

function Toggle($X, $Y, [string]$Label, $On = $true) {
    Text $X $Y $Label 12 '#475569' 600
    Rect $X ($Y + 14) 50 26 $(if ($On) { '#4F2BEE' } else { '#CBD5E1' }) 13
    Circle $(if ($On) { $X + 37 } else { $X + 13 }) ($Y + 27) 10 '#FFFFFF'
    Text ($X + 66) ($Y + 32) $(if ($On) { '启用' } else { '停用' }) 12 '#334155' 500
}

function Section($X, $Y, $W, $H, [string]$Title = '', [string]$Sub = '') {
    Rect $X $Y $W $H '#FFFFFF' 10 '#E3E8F1' 1
    if ($Title) { Text ($X + 20) ($Y + 34) $Title 17 '#111827' 700 }
    if ($Sub) { Text ($X + 20) ($Y + 57) $Sub 12 '#64748B' 400 }
}

function SimpleTable($X, $Y, $W, [string[]]$Headers, [object[]]$Rows, [int[]]$Widths, $RowHeight = 54) {
    Rect $X $Y $W 44 '#F8FAFC' 6 '#E5E7EB' 1
    $CX = $X
    for ($I = 0; $I -lt $Headers.Count; $I++) {
        Text ($CX + 12) ($Y + 28) $Headers[$I] 12 '#475569' 600
        $CX += $Widths[$I]
    }
    for ($R = 0; $R -lt $Rows.Count; $R++) {
        $RY = $Y + 44 + $R * $RowHeight
        Rect $X $RY $W $RowHeight '#FFFFFF' 0 '#E9EDF3' 1
        $CX = $X
        for ($I = 0; $I -lt $Headers.Count; $I++) {
            $Color = if ($I -eq ($Headers.Count - 1)) { '#4F2BEE' } else { '#334155' }
            $Weight = if ($I -eq ($Headers.Count - 1)) { 600 } else { 400 }
            Text ($CX + 12) ($RY + 33) ([string]$Rows[$R][$I]) 12 $Color $Weight
            $CX += $Widths[$I]
        }
    }
}

function BeginSvg() {
    $script:Svg = New-Object System.Text.StringBuilder
    Add '<svg xmlns="http://www.w3.org/2000/svg" width="1672" height="941" viewBox="0 0 1672 941">'
    Add '<defs><linearGradient id="purpleGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B5CF6"/><stop offset="1" stop-color="#4F2BEE"/></linearGradient><filter id="softShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#4C1D95" flood-opacity="0.12"/></filter></defs>'
    Add '<style>text{font-family:"Microsoft YaHei","PingFang SC","Noto Sans CJK SC",Arial,sans-serif}.shadow{filter:url(#softShadow)}</style>'
    Rect 0 0 1672 941 '#F8FAFD' 0
}

function EndSvg([string]$FileName) {
    Add '</svg>'
    [System.IO.File]::WriteAllText((Join-Path $OutputDir $FileName), $script:Svg.ToString(), $Utf8NoBom)
}

function AdminSidebar([string]$Active) {
    Rect 0 0 250 941 '#061A33' 0
    Text 28 48 '☰' 24 '#FFFFFF' 400
    Text 30 112 '▣  用户评分体系' 16 '#FFFFFF' 600
    Text 220 112 '⌄' 18 '#FFFFFF' 400
    $Children = @(
        @('评分类型','type',158),
        @('评分参数','param',212),
        @('用户评分结果','result',266)
    )
    foreach ($Child in $Children) {
        if ($Active -eq $Child[1]) { Rect 26 ($Child[2]-31) 206 46 '#5632EE' 7 }
        Circle 58 ($Child[2]-7) 4 $(if ($Active -eq $Child[1]) { '#FFFFFF' } else { '#94A3B8' })
        Text 78 $Child[2] $Child[0] 15 $(if ($Active -eq $Child[1]) { '#FFFFFF' } else { '#E2E8F0' }) 500
    }
}

function BeginAdmin([string]$Title, [string]$Subtitle, [string]$Active) {
    BeginSvg
    AdminSidebar $Active
    Text 290 58 $Title 30 '#111827' 700
    if ($Subtitle) { Text 292 92 $Subtitle 14 '#64748B' 400 }
}

function TypePageContent() {
    BeginAdmin '评分类型' '运营维护评分类型及其关联的评分参数' 'type'
    Section 280 122 420 790 '评分类型列表' '选择类型后在右侧查看和编辑'
    Field 302 194 240 '' '' '搜索名称或类型标识'
    Button 558 206 118 '＋ 新增' 'primary'
    $Types = @(
        @('用户综合评分','USER_TOTAL','启用'),
        @('主播质量评分','HOST_QUALITY','启用'),
        @('用户活跃评分','USER_ACTIVE','启用'),
        @('消费能力评分','PAY_ABILITY','启用'),
        @('风险评分','RISK_SCORE','停用')
    )
    for ($I = 0; $I -lt $Types.Count; $I++) {
        $Y = 276 + $I * 104
        $Selected = $I -eq 0
        Rect 302 $Y 374 84 $(if ($Selected) { '#FAF8FF' } else { '#FFFFFF' }) 8 $(if ($Selected) { '#5B36F2' } else { '#E3E8F1' }) 1
        Circle 338 ($Y + 42) 21 $(if ($Selected) { '#5B36F2' } else { '#EEF2FF' })
        Text 338 ($Y + 49) 'S' 14 $(if ($Selected) { '#FFFFFF' } else { '#4F2BEE' }) 700 'middle'
        Text 374 ($Y + 34) $Types[$I][0] 14 '#111827' 600
        Text 374 ($Y + 59) $Types[$I][1] 11 '#64748B' 400
        Badge 570 ($Y + 27) $Types[$I][2] $(if ($Types[$I][2] -eq '启用') { '#DCFCE7' } else { '#F1F5F9' }) $(if ($Types[$I][2] -eq '启用') { '#16A34A' } else { '#64748B' }) | Out-Null
    }
    Rect 302 816 374 60 '#EFF6FF' 7 '#BFDBFE' 1
    Text 320 842 '运营维护类型和关联关系；' 11 '#475569' 500
    Text 320 862 '评分参数内容只读。' 11 '#475569' 500

    Section 720 122 920 790 '用户综合评分' '类型标识 USER_TOTAL'
    Badge 1008 142 '启用' '#DCFCE7' '#16A34A' | Out-Null
    Button 1390 140 92 '删除' 'danger'
    Button 1496 140 118 '保存修改' 'primary'
    Text 744 216 '基础配置' 16 '#111827' 700
    Field 744 250 260 '类型标识' 'USER_TOTAL' '' $true
    Field 1024 250 260 '类型名称' '用户综合评分'
    Field 1304 250 140 '默认分数' '60.00'
    Field 1464 250 150 '最近登录天数' '30'
    Toggle 744 326 '状态' $true
    Text 1024 326 '最近执行时间' 12 '#475569' 600
    Text 1024 360 '2026-08-27 03:00:18' 13 '#334155' 500
    Text 1304 326 '最近执行耗时' 12 '#475569' 600
    Text 1304 360 '18,642 ms' 13 '#334155' 500
    Line 744 392 1614 392 '#E9EDF3'
    Text 744 430 '关联评分参数' 16 '#111827' 700
    Text 744 454 '运营选择参数组合；同一类型不能重复关联同一参数。' 12 '#64748B' 400
    Button 1422 416 192 '＋ 关联评分参数' 'secondary'
    SimpleTable 744 482 870 @('参数名称','参数标识','优先级','默认分','状态','操作') @(
        @('近30日活跃度','ACTIVE_30D','100','20.00','启用','查看  移除'),
        @('付费能力','PAY_LEVEL','80','30.00','启用','查看  移除'),
        @('内容互动质量','INTERACTION','60','10.00','启用','查看  移除'),
        @('账号风险','ACCOUNT_RISK','40','0.00','停用','查看  移除')
    ) @(190,190,110,110,100,170) 56
    Rect 744 784 870 72 '#FFF7ED' 8 '#FED7AA' 1
    Text 764 814 '提示：已停用参数保留关联展示并标记状态，实际计算行为沿用既有架构。' 11 '#9A3412' 500
    Text 764 838 '参数内容由技术维护，运营在本页只能查看、关联或移除。' 11 '#9A3412' 500
}

function ParamPageContent($New = $false) {
    BeginAdmin '评分参数' '技术维护参数定义、JSON配置及执行选项' 'param'
    Section 280 122 470 790 '评分参数列表' '一个参数对应一个具体代码实现'
    Field 302 194 274 '' '' '搜索名称或参数标识'
    Button 592 206 134 '＋ 新增参数' 'primary'
    $Params = @(
        @('近30日活跃度','ACTIVE_30D','启用'),
        @('付费能力','PAY_LEVEL','启用'),
        @('内容互动质量','INTERACTION','启用'),
        @('账号风险','ACCOUNT_RISK','停用'),
        @('直播稳定度','LIVE_STABLE','启用'),
        @('社交关系质量','SOCIAL_QUALITY','启用')
    )
    for ($I = 0; $I -lt $Params.Count; $I++) {
        $Y = 276 + $I * 88
        $Selected = (-not $New) -and $I -eq 0
        Rect 302 $Y 424 68 $(if ($Selected) { '#FAF8FF' } else { '#FFFFFF' }) 8 $(if ($Selected) { '#5B36F2' } else { '#E3E8F1' }) 1
        Text 320 ($Y + 28) $Params[$I][0] 13 '#111827' 600
        Text 320 ($Y + 51) $Params[$I][1] 10 '#64748B' 400
        Badge 620 ($Y + 20) $Params[$I][2] $(if ($Params[$I][2] -eq '启用') { '#DCFCE7' } else { '#F1F5F9' }) $(if ($Params[$I][2] -eq '启用') { '#16A34A' } else { '#64748B' }) | Out-Null
    }
    Rect 302 826 424 50 '#FFF7ED' 7 '#FED7AA' 1
    Text 320 856 '仅技术人员可新增、修改或删除评分参数。' 11 '#9A3412' 500

    $Title = if ($New) { '新增评分参数' } else { '近30日活跃度' }
    $Sub = if ($New) { '保存后参数标识不可修改' } else { '参数标识 ACTIVE_30D · 已被2个评分类型使用' }
    Section 770 122 870 790 $Title $Sub
    if (-not $New) { Button 1390 140 92 '删除' 'danger' }
    Button 1496 140 118 $(if ($New) { '创建参数' } else { '保存修改' }) 'primary'
    Text 794 216 '基础信息' 16 '#111827' 700
    Field 794 250 260 '参数标识' $(if ($New) { '' } else { 'ACTIVE_30D' }) $(if ($New) { '请输入唯一标识' } else { '' }) (-not $New)
    Field 1074 250 260 '参数名称' $(if ($New) { '' } else { '近30日活跃度' }) '请输入参数名称'
    Field 1354 250 120 '默认分数' $(if ($New) { '0.00' } else { '20.00' })
    Field 1494 250 120 '计算优先级' $(if ($New) { '0' } else { '100' })
    Toggle 794 326 '状态' $true
    Field 1074 326 180 '最小执行间隔（小时）' $(if ($New) { '24' } else { '24' })
    Toggle 1284 326 '注册计算' $false
    Toggle 1454 326 '新人执行' $true
    Line 794 402 1614 402 '#E9EDF3'
    Text 794 440 '参数配置 JSON' 16 '#111827' 700
    Text 794 464 '具体字段协议由对应执行代码解析；非空时保存前校验JSON格式。' 12 '#64748B' 400
    Rect 794 484 820 226 '#111827' 8
    if ($New) {
        Text 816 520 '{' 14 '#E2E8F0' 400
        Text 834 550 '"key": "value"' 13 '#C4B5FD' 400
        Text 816 582 '}' 14 '#E2E8F0' 400
    } else {
        Text 816 520 '{' 14 '#E2E8F0' 400
        Text 834 550 '"windowDays": 30,' 13 '#C4B5FD' 400
        Text 834 580 '"loginWeight": 0.4,' 13 '#C4B5FD' 400
        Text 834 610 '"durationWeight": 0.35,' 13 '#C4B5FD' 400
        Text 834 640 '"interactionWeight": 0.25' 13 '#C4B5FD' 400
        Text 816 672 '}' 14 '#E2E8F0' 400
    }
    Button 1434 720 180 '格式化并校验' 'secondary'
    Text 794 760 '运行信息' 16 '#111827' 700
    Rect 794 784 820 74 '#F8FAFC' 8 '#E3E8F1' 1
    Text 816 814 '最近执行时间' 12 '#64748B' 500
    Text 816 840 $(if ($New) { '--' } else { '2026-08-27 03:00:08' }) 13 '#334155' 600
    Text 1100 814 '维护责任' 12 '#64748B' 500
    Text 1100 840 '技术人员' 13 '#334155' 600
    Text 1330 814 '代码实现' 12 '#64748B' 500
    Text 1330 840 '由参数标识选择对应执行器' 13 '#334155' 600
}

function ResultPageContent() {
    BeginAdmin '用户评分结果' '查询用户各评分类型的最终评分，并查看参数得分明细' 'result'
    Section 280 122 1360 150 '查询条件'
    Field 304 182 220 '用户ID' '' '请输入用户ID'
    Field 544 182 220 '评分类型' '全部类型'
    Field 784 182 150 '最低分' '' '0.00'
    Field 954 182 150 '最高分' '' '100.00'
    Field 1124 182 250 '评分更新时间' '2026-08-01 — 2026-08-27'
    Button 1396 194 92 '重置' 'secondary'
    Button 1504 194 110 '查询' 'primary'
    Section 280 294 1360 618 '评分结果' '共 1,286 条 · 默认按评分更新时间倒序'
    SimpleTable 304 364 1312 @('用户ID','评分类型','类型标识','最终评分','评分更新时间','操作') @(
        @('102938475','用户综合评分','USER_TOTAL','86.50','2026-08-27 03:00:18','查看详情'),
        @('882016','主播质量评分','HOST_QUALITY','92.00','2026-08-27 03:00:16','查看详情'),
        @('620418','用户活跃评分','USER_ACTIVE','78.25','2026-08-27 03:00:12','查看详情'),
        @('991205','消费能力评分','PAY_ABILITY','68.00','2026-08-27 03:00:10','查看详情'),
        @('762018','用户综合评分','USER_TOTAL','81.75','2026-08-27 03:00:08','查看详情'),
        @('501829','风险评分','RISK_SCORE','12.50','2026-08-26 03:00:22','查看详情'),
        @('731902','用户活跃评分','USER_ACTIVE','74.00','2026-08-26 03:00:18','查看详情')
    ) @(190,230,220,180,280,212) 58
    Text 304 846 '仅展示用户ID，不关联用户昵称或其他资料；本页不提供导出。' 11 '#64748B' 400
    Text 1220 858 '每页 20 条  ⌄' 12 '#475569' 500
    Button 1360 838 42 '‹' 'secondary'
    Badge 1416 844 '1' '#4F2BEE' '#FFFFFF' | Out-Null
    Button 1494 838 42 '2' 'secondary'
    Button 1548 838 42 '›' 'secondary'
}

# 01 评分类型
TypePageContent
EndSvg '01-管理端-评分类型.svg'

# 02 评分类型关联参数
TypePageContent
Add '<rect x="250" y="0" width="1422" height="941" fill="#0F172A" opacity="0.42"/>'
Add '<rect x="560" y="104" width="870" height="730" rx="16" fill="#FFFFFF" filter="url(#softShadow)"/>'
Text 596 154 '关联评分参数' 23 '#111827' 700
Text 596 184 '用户综合评分 · 可一次选择多个参数' 13 '#64748B' 400
Text 1390 154 '×' 24 '#64748B' 400 'middle'
Field 596 226 520 '' '' '搜索参数名称或参数标识'
Button 1134 238 96 '搜索' 'secondary'
Badge 1250 244 '已选择 2 项' '#F5F3FF' '#4F2BEE' | Out-Null
SimpleTable 596 302 798 @('选择','参数名称','参数标识','优先级','状态') @(
    @('☑','直播稳定度','LIVE_STABLE','90','启用'),
    @('☑','社交关系质量','SOCIAL_QUALITY','70','启用'),
    @('□','内容价值','CONTENT_VALUE','65','启用'),
    @('已关联','近30日活跃度','ACTIVE_30D','100','启用'),
    @('已关联','付费能力','PAY_LEVEL','80','启用'),
    @('不可选','设备风险','DEVICE_RISK','50','停用')
) @(90,190,220,130,168) 56
Rect 596 694 798 56 '#EFF6FF' 8 '#BFDBFE' 1
Text 616 728 '已关联参数不能重复选择；停用参数不可新增关联。' 12 '#475569' 500
Button 1152 770 104 '取消' 'secondary'
Button 1274 770 120 '确认关联' 'primary'
EndSvg '02-管理端-评分类型-关联参数.svg'

# 03 评分类型删除确认
TypePageContent
Add '<rect x="250" y="0" width="1422" height="941" fill="#0F172A" opacity="0.42"/>'
Add '<rect x="620" y="230" width="720" height="420" rx="16" fill="#FFFFFF" filter="url(#softShadow)"/>'
Circle 680 292 25 '#FEE2E2'
Text 680 301 '!' 19 '#DC2626' 700 'middle'
Text 724 298 '确认删除评分类型？' 22 '#111827' 700
Text 1298 294 '×' 24 '#64748B' 400 'middle'
Text 664 356 '即将删除：用户综合评分（USER_TOTAL）' 14 '#334155' 600
Rect 664 386 632 100 '#FEF2F2' 8 '#FECACA' 1
Text 686 420 '删除后将同步解除 4 个评分参数关联关系。' 13 '#991B1B' 600
Text 686 452 '历史评分等其他数据按既有后端逻辑处理。' 12 '#B91C1C' 400
Text 664 530 '该操作不可通过管理端撤销，请确认后继续。' 12 '#64748B' 400
Button 1042 572 110 '取消' 'secondary'
Button 1170 572 126 '确认删除' 'dangerPrimary'
EndSvg '03-管理端-评分类型-删除确认.svg'

# 04 评分参数
ParamPageContent $false
EndSvg '04-管理端-评分参数.svg'

# 05 新增评分参数
ParamPageContent $true
EndSvg '05-管理端-评分参数-新增参数.svg'

# 06 评分参数删除确认
ParamPageContent $false
Add '<rect x="250" y="0" width="1422" height="941" fill="#0F172A" opacity="0.42"/>'
Add '<rect x="620" y="230" width="720" height="420" rx="16" fill="#FFFFFF" filter="url(#softShadow)"/>'
Circle 680 292 25 '#FEE2E2'
Text 680 301 '!' 19 '#DC2626' 700 'middle'
Text 724 298 '确认删除评分参数？' 22 '#111827' 700
Text 1298 294 '×' 24 '#64748B' 400 'middle'
Text 664 356 '即将删除：近30日活跃度（ACTIVE_30D）' 14 '#334155' 600
Rect 664 386 632 100 '#FEF2F2' 8 '#FECACA' 1
Text 686 420 '该参数正在被 2 个评分类型使用。' 13 '#991B1B' 600
Text 686 452 '删除后将同步解除全部类型关联关系。' 12 '#B91C1C' 400
Text 664 530 '历史参数明细等其他数据按既有后端逻辑处理。' 12 '#64748B' 400
Button 1042 572 110 '取消' 'secondary'
Button 1170 572 126 '确认删除' 'dangerPrimary'
EndSvg '06-管理端-评分参数-删除确认.svg'

# 07 用户评分结果
ResultPageContent
EndSvg '07-管理端-用户评分结果.svg'

# 08 用户评分结果详情
ResultPageContent
Add '<rect x="250" y="0" width="1422" height="941" fill="#0F172A" opacity="0.30"/>'
Add '<rect x="790" y="0" width="882" height="941" fill="#FFFFFF" filter="url(#softShadow)"/>'
Text 826 58 '用户评分详情' 24 '#111827' 700
Text 1630 58 '×' 26 '#64748B' 400 'middle'
Rect 826 92 810 156 '#F5F3FF' 12 '#DDD6FE' 1
Text 852 126 '用户ID' 12 '#64748B' 500
Text 852 154 '102938475' 18 '#111827' 700
Text 1088 126 '评分类型' 12 '#64748B' 500
Text 1088 154 '用户综合评分' 17 '#111827' 700
Text 1088 178 'USER_TOTAL' 11 '#64748B' 400
Text 1370 126 '最终评分' 12 '#64748B' 500
Text 1370 172 '86.50' 34 '#4F2BEE' 700
Text 852 218 '评分更新时间：2026-08-27 03:00:18' 12 '#475569' 500
Text 826 294 '参数得分明细' 17 '#111827' 700
Text 826 320 '只读展示本次评分相关参数结果，不可在结果页修改。' 12 '#64748B' 400
SimpleTable 826 348 810 @('参数名称','参数标识','结果数据','所得分数','计算时间') @(
    @('近30日活跃度','ACTIVE_30D','活跃等级 A','28.50','08-27 03:00'),
    @('付费能力','PAY_LEVEL','近30日有效消费 420','32.00','08-27 03:00'),
    @('内容互动质量','INTERACTION','互动质量 76','18.00','08-27 02:59'),
    @('账号风险','ACCOUNT_RISK','低风险','8.00','08-27 02:59')
) @(155,165,210,120,160) 66
Rect 826 692 810 92 '#EFF6FF' 8 '#BFDBFE' 1
Text 848 726 '最终评分由既有计算模型输出；本页面不解释或修改计算公式。' 12 '#475569' 500
Text 848 754 '参数结果和得分来源于现有用户参数分明细。' 12 '#475569' 500
Button 1508 850 128 '关闭详情' 'secondary'
EndSvg '08-管理端-用户评分结果详情.svg'

Write-Output 'Generated 8 editable SVG prototypes.'

