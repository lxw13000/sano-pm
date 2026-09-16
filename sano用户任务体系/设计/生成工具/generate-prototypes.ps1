$ErrorActionPreference = 'Stop'

$ToolDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DesignDir = Split-Path -Parent $ToolDir
$OutputDir = Join-Path $DesignDir '源文件'
if (-not (Test-Path -LiteralPath $OutputDir -PathType Container)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$script:Svg = $null
$script:Width = 0
$script:Height = 0

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
    Text ($X + $W / 2) ($Y + 19) $Value 12 $Color 500 'middle'
    return $W
}

function Button($X, $Y, $W, [string]$Value, $Primary = $true) {
    $Fill = if ($Primary) { '#4F2BEE' } else { '#FFFFFF' }
    $Color = if ($Primary) { '#FFFFFF' } else { '#4F2BEE' }
    $Stroke = if ($Primary) { '#4F2BEE' } else { '#B8A9FF' }
    Rect $X $Y $W 42 $Fill 7 $Stroke 1
    Text ($X + $W / 2) ($Y + 27) $Value 14 $Color 500 'middle'
}

function Field($X, $Y, $W, [string]$Label, [string]$Value = '', [string]$Placeholder = '') {
    Text $X $Y $Label 13 '#334155' 500
    Rect $X ($Y + 12) $W 42 '#FFFFFF' 6 '#DCE3EE' 1
    $Display = if ($Value) { $Value } else { $Placeholder }
    $Color = if ($Value) { '#1E293B' } else { '#94A3B8' }
    Text ($X + 14) ($Y + 39) $Display 13 $Color 400
}

function Section($X, $Y, $W, $H, [string]$Title, [string]$Sub = '') {
    Rect $X $Y $W $H '#FFFFFF' 10 '#E3E8F1' 1
    Text ($X + 20) ($Y + 34) $Title 17 '#111827' 600
    if ($Sub) { Text ($X + 20) ($Y + 58) $Sub 12 '#64748B' 400 }
}

function BeginSvg($Width, $Height, $Background = '#F7F8FC') {
    $script:Width = $Width
    $script:Height = $Height
    $script:Svg = New-Object System.Text.StringBuilder
    Add ('<svg xmlns="http://www.w3.org/2000/svg" width="{0}" height="{1}" viewBox="0 0 {0} {1}">' -f $Width,$Height)
    Add '<defs><linearGradient id="purpleGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B5CF6"/><stop offset="1" stop-color="#4F2BEE"/></linearGradient><linearGradient id="softPurple" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F5F1FF"/><stop offset="1" stop-color="#E9E2FF"/></linearGradient><filter id="softShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#4C1D95" flood-opacity="0.12"/></filter></defs>'
    Add '<style>text{font-family:"Microsoft YaHei","PingFang SC","Noto Sans CJK SC",Arial,sans-serif}.shadow{filter:url(#softShadow)}</style>'
    Rect 0 0 $Width $Height $Background 0
}

function EndSvg([string]$FileName) {
    Add '</svg>'
    [System.IO.File]::WriteAllText((Join-Path $OutputDir $FileName), $script:Svg.ToString(), $Utf8NoBom)
}

function AdminSidebar([string]$Active) {
    Rect 0 0 250 941 '#061A33' 0
    Text 28 48 '☰' 24 '#FFFFFF' 400
    Text 30 112 '▣  主播体系配置' 16 '#FFFFFF' 500
    Text 220 112 '⌄' 18 '#FFFFFF' 400
    $Children = @(@('主播身份','identity',150),@('任务库','library',202))
    foreach ($Child in $Children) {
        if ($Active -eq $Child[1]) { Rect 26 ($Child[2]-30) 206 46 '#5632EE' 7 }
        Circle 58 ($Child[2]-7) 4 $(if ($Active -eq $Child[1]) { '#FFFFFF' } else { '#94A3B8' })
        Text 78 $Child[2] $Child[0] 15 $(if ($Active -eq $Child[1]) { '#FFFFFF' } else { '#E2E8F0' }) 500
    }
    $Roots = @(
        @('主播身份成员','members',286),
        @('周任务审核','weekly',350),
        @('奖励领取记录','rewards',414)
    )
    foreach ($Root in $Roots) {
        if ($Active -eq $Root[1]) { Rect 18 ($Root[2]-32) 216 48 '#5632EE' 7 }
        Text 30 $Root[2] '□' 18 '#FFFFFF' 400
        Text 64 $Root[2] $Root[0] 15 '#FFFFFF' 500
    }
}

function BeginAdmin([string]$Title, [string]$Subtitle, [string]$Active) {
    BeginSvg 1672 941 '#F8FAFD'
    AdminSidebar $Active
    Text 290 64 $Title 31 '#111827' 700
    if ($Subtitle) { Text 292 98 $Subtitle 14 '#64748B' 400 }
}

function LibraryTabs([string]$Selected) {
    $Tabs = @(@('任务项列表','items',320),@('任务模块','modules',470))
    foreach ($Tab in $Tabs) {
        $Color = if ($Selected -eq $Tab[1]) { '#4F2BEE' } else { '#64748B' }
        Text $Tab[2] 152 $Tab[0] 15 $Color $(if ($Selected -eq $Tab[1]) { 600 } else { 400 })
        if ($Selected -eq $Tab[1]) { Rect ($Tab[2]-8) 170 112 3 '#4F2BEE' 2 }
    }
    Line 250 180 1672 180 '#E5E7EB'
}

function IdentityTabs([string]$Selected) {
    $Tabs = @(@('基础信息','base',320),@('任务模块','modules',470),@('升降级规则','rules',620),@('App规则说明','app',800))
    foreach ($Tab in $Tabs) {
        $Color = if ($Selected -eq $Tab[1]) { '#4F2BEE' } else { '#475569' }
        Text $Tab[2] 112 $Tab[0] 15 $Color $(if ($Selected -eq $Tab[1]) { 600 } else { 400 })
        if ($Selected -eq $Tab[1]) { Rect ($Tab[2]-10) 132 116 3 '#4F2BEE' 2 }
    }
    Line 250 140 1672 140 '#E5E7EB'
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
            Text ($CX + 12) ($RY + 33) ([string]$Rows[$R][$I]) 12 '#334155' 400
            $CX += $Widths[$I]
        }
    }
}

# 01 主播身份列表
BeginAdmin '主播身份' '管理主播身份、资格、任务功能与奖励' 'identity'
Button 1450 42 170 '＋ 新建主播身份'
$Cards = @(@('主播身份','5','#5632EE'),@('启用中','5','#10B981'),@('身份成员','286','#3B82F6'))
for ($I=0; $I -lt 3; $I++) {
    $X = 290 + $I * 448
    Section $X 140 418 116 ''
    Circle ($X+62) 198 31 $Cards[$I][2]
    Text ($X+112) 183 $Cards[$I][0] 14 '#64748B' 400
    Text ($X+112) 220 $Cards[$I][1] 24 '#111827' 700
}
Rect 290 278 1330 50 '#EFF6FF' 7 '#BFDBFE' 1
Text 314 310 'ⓘ  以下为策略配置演示数据；每个身份独立配置资格和规则，最高奖励由关联模块策略上限自动合计。' 13 '#475569' 400
SimpleTable 290 350 1330 @('主播身份','身份编码','资格方式','关联任务模块','每周最高奖励','当前成员','状态','操作') @(
    @('普通优质主播','QUALITY_NORMAL','申请审核','3个模块','$15','128人','启用','查看配置  ›'),
    @('黄金优质主播','QUALITY_GOLD','升级或审核','4个模块','$77','96人','启用','查看配置  ›'),
    @('超级主播','SUPER_HOST','升级或邀请','5个模块','$50','18人','启用','查看配置  ›'),
    @('外部认证主播','EXTERNAL_CERT','外部认证审核','3个模块','$50','26人','启用','查看配置  ›'),
    @('签约主播','SIGNED_HOST','签约审核','4个模块','$100','18人','启用','查看配置  ›')
) @(180,195,165,170,170,140,110,170) 58
EndSvg '01-管理端-主播身份列表.svg'

# 02 身份关联任务模块
BeginAdmin '主播体系配置 / 主播身份 / 黄金优质主播' '' 'identity'
Button 1350 30 128 '保存配置' $false
Button 1490 30 140 '返回身份列表' $false
IdentityTabs 'modules'
Section 280 158 1360 132 ''
Circle 350 224 38 '#FFF3C4'
Text 350 232 '★' 28 '#EAB308' 600 'middle'
Text 430 206 '黄金优质主播' 21 '#111827' 700
Text 430 240 'QUALITY_GOLD' 13 '#475569' 500
Badge 590 214 '启用' '#DCFCE7' '#16A34A' | Out-Null
Text 820 205 '资格条件' 13 '#475569' 500
Text 820 238 '连续2周达标或运营审核' 14 '#334155' 500
Text 1310 205 '当前成员' 13 '#475569' 500
Text 1310 244 '96 人' 24 '#111827' 700
Section 280 312 1360 562 '关联任务模块'
Button 1420 330 188 '＋ 关联任务模块'
SimpleTable 306 390 1308 @('App顺序','任务模块ID / 名称','模块角色','奖励资格策略','奖励计算策略','最高奖励','操作') @(
    @('1','R001 / 优质主播基础奖励','基础门槛','无前置条件','固定奖励','$10','↑  ↓  查看  移除'),
    @('2','R002 / 收入阶梯奖励','普通模块','需要基础门槛','按任务指标阶梯','最高 $60','↑  ↓  查看  移除'),
    @('3','R003 / 时长奖励','普通模块','需要基础门槛','固定奖励','$3','↑  ↓  查看  移除'),
    @('4','R004 / 分享奖励','普通模块','需要基础门槛','固定奖励','$4','↑  ↓  查看  移除')
) @(95,255,140,185,190,135,308) 66
Rect 306 720 1308 110 '#F5F3FF' 8 '#C4B5FD' 1
Text 332 758 '每周最高奖励（按模块策略上限自动合计）' 14 '#334155' 600
Text 332 804 '$77' 28 '#4F2BEE' 700
Text 700 770 '本页关联数据仅包含：身份ID、任务模块ID、App展示顺序' 13 '#334155' 500
Text 700 802 '模块角色、三类策略和任务组成均来自公共任务库，只读展示' 12 '#64748B' 400
EndSvg '02-管理端-主播身份-任务模块.svg'

# 03 任务模块详情
BeginAdmin '任务库' '公共任务项与任务模块管理' 'library'
LibraryTabs 'modules'
Section 270 200 480 700 '任务模块'
Field 294 262 262 '' '' '搜索任务模块名称'
Button 576 274 150 '＋ 新建任务模块'
$Modules = @(
    @('优质主播基础奖励','固定 $10','3个任务项 · 基础门槛','#4F2BEE'),
    @('收入阶梯奖励','最高 $60','1个任务项 · 依赖门槛','#F59E0B'),
    @('时长奖励','固定 $3','1个任务项 · 依赖门槛','#3B82F6'),
    @('分享奖励','固定 $4','1个任务项 · 依赖门槛','#10B981')
)
for ($I=0; $I -lt $Modules.Count; $I++) {
    $Y = 350 + $I * 106
    $Fill = if ($I -eq 0) { '#FAF8FF' } else { '#FFFFFF' }
    $Stroke = if ($I -eq 0) { '#5B36F2' } else { '#E3E8F1' }
    Rect 292 $Y 436 88 $Fill 8 $Stroke 1
    Circle 344 ($Y+44) 25 $Modules[$I][3]
    Text 344 ($Y+51) $(if ($I -eq 0) {'▣'} elseif ($I -eq 1) {'···'} elseif ($I -eq 2) {'＋'} else {'$'}) 18 '#FFFFFF' 600 'middle'
    Text 394 ($Y+38) $Modules[$I][0] 15 '#111827' 600
    Text 394 ($Y+64) $Modules[$I][2] 12 '#64748B' 400
    Text 650 ($Y+40) $Modules[$I][1] 16 '#4F2BEE' 600
}
Section 772 200 868 700 '任务模块详情'
Button 1506 218 108 '保存配置'
Text 800 288 '模块图标' 13 '#334155' 600
Circle 838 340 30 '#4F2BEE'
Text 838 347 '▣' 19 '#FFFFFF' 600 'middle'
Text 800 396 '↥ 重新上传' 12 '#4F2BEE' 500
Field 930 288 260 '模块名称' '优质主播基础奖励'
Field 1210 288 166 '模块编码' 'R001'
Text 1410 288 '是否启用' 13 '#334155' 600
Badge 1410 308 '启用' '#4F2BEE' '#FFFFFF' | Out-Null
Text 930 390 '模块角色与三类策略' 14 '#111827' 600
Text 930 428 '模块角色' 12 '#475569' 500
Badge 1030 408 '基础门槛' '#DCFCE7' '#16A34A' | Out-Null
Text 1190 428 '完成策略' 12 '#475569' 500
Badge 1290 408 '全部任务完成' '#EEF2FF' '#4F46E5' | Out-Null
Text 930 474 '奖励资格策略' 12 '#475569' 500
Badge 1060 454 '无前置条件' '#F1F5F9' '#64748B' | Out-Null
Text 1190 474 '奖励计算策略' 12 '#475569' 500
Badge 1310 454 '固定奖励' '#4F2BEE' '#FFFFFF' | Out-Null
Field 1450 454 138 '金额' '$10'
Text 930 520 '配置保存为策略编码与JSON；运营使用结构化表单，不直接编辑JSON。' 11 '#64748B' 400
Text 800 566 '关联任务项' 17 '#111827' 600
Button 1430 542 184 '＋ 从任务项列表添加' $false
SimpleTable 800 594 814 @('任务项名称','任务类型','执行器状态','操作') @(
    @('周累计直播时长','系统统计','已启用','查看   移除'),
    @('每日高峰时段','系统统计','已启用','查看   移除'),
    @('每日有效PK场次','系统统计','已启用','查看   移除')
) @(300,180,150,184) 48
Field 800 786 520 '备注' '基础任务全部完成后获得$10，并为依赖模块提供奖励资格。'
Rect 1340 786 274 68 '#EFF6FF' 7 '#BFDBFE' 1
Text 1356 813 '校验：基础门槛的资格策略' 10 '#475569' 500
Text 1356 838 '必须为“无前置条件”。' 10 '#475569' 400
EndSvg '03-管理端-任务库-任务模块.svg'

# 04 新增任务模块
BeginAdmin '任务库 / 新增任务模块' '配置任务组成、模块角色与三类策略' 'library'
Button 1420 42 88 '取消' $false
Button 1524 42 98 '保存'
Section 290 130 1330 760 '任务模块配置'
Text 324 204 '* 模块图标' 13 '#334155' 600
Rect 324 222 104 104 '#FAFBFD' 8 '#CBD5E1' 1
Text 376 282 '↥' 30 '#64748B' 500 'middle'
Button 450 252 112 '上传图标' $false
Field 600 204 470 '* 模块名称' '有效邀请阶梯奖励'
Field 1090 204 260 '模块编码' '保存后自动生成'
Text 1380 204 '是否启用' 13 '#334155' 600
Badge 1380 224 '启用' '#4F2BEE' '#FFFFFF' | Out-Null
Text 324 374 '1  任务组成' 16 '#111827' 600
Field 520 350 500 '已关联任务项' '有效邀请用户数   ×'
Button 1042 362 166 '＋ 添加任务项' $false
Text 1236 378 '任务项可复用，不配置奖金' 11 '#64748B' 400
Text 324 458 '2  模块角色、完成与资格策略' 16 '#111827' 600
Field 520 434 300 '模块角色' '普通任务模块  ⌄'
Field 840 434 330 '完成策略' '全部任务完成  ⌄'
Field 1190 434 360 '奖励资格策略' '需要基础门槛  ⌄'
Text 520 512 '基础门槛模块的奖励资格必须为“无前置条件”，避免自我依赖。' 11 '#9A3412' 500
Text 324 576 '3  奖励计算策略' 16 '#111827' 600
Field 520 552 350 '策略类型' '按任务指标阶梯奖励  ⌄'
Field 890 552 320 '计奖依据任务' '有效邀请用户数  ⌄'
Field 1230 552 320 '计奖指标' '有效邀请人数（人）  ⌄'
Text 520 628 '指标名称、类型和单位来自任务结果定义；运营不能手工输入JSON字段路径。' 11 '#64748B' 400
Text 520 674 '奖励档位' 15 '#111827' 600
Button 1050 650 150 '＋ 添加档位' $false
SimpleTable 520 696 680 @('达到值','单位','奖励金额','操作') @(
    @('≥ 3','人','$5','删除'),
    @('≥ 5','人','$10','删除'),
    @('≥ 10','人','$20','删除')
) @(210,120,210,140) 42
Text 1230 674 '策略JSON（系统生成，只读）' 13 '#334155' 600
Rect 1230 696 320 166 '#111827' 7
Text 1248 724 'TIER_BY_TASK_METRIC' 11 '#C4B5FD' 500
Text 1248 750 'source: EFFECTIVE_INVITE' 10 '#E2E8F0' 400
Text 1248 774 'metric: effectiveInviteCount' 10 '#A7F3D0' 400
Text 1248 810 '取最高已达档，不累加' 10 '#94A3B8' 400
Text 1248 836 '保存后冻结到周任务快照' 10 '#94A3B8' 400
EndSvg '04-管理端-新增任务模块.svg'

# 05 任务项管理
BeginAdmin '任务库' '公共任务项与任务模块管理' 'library'
LibraryTabs 'items'
Section 270 200 520 700 '任务项列表' '选择任务项后在右侧查看和编辑'
Field 294 270 286 '' '' '搜索任务名称或编码'
Button 600 282 164 '＋ 新增任务项'
$Items = @(
    @('有效直播总时长','LIVE_TOTAL_MINUTES','系统统计'),
    @('有效直播天数','LIVE_VALID_DAYS','系统统计'),
    @('黄金时段达标天数','GOLDEN_PEAK_DAYS','系统统计'),
    @('有效邀请用户数','EFFECTIVE_INVITE','系统统计'),
    @('发布Sano相关外部内容','SANO_EXTERNAL_CONTENT','材料审核'),
    @('互动质量评审','INTERACTION_REVIEW','运营评审')
)
for ($I=0; $I -lt $Items.Count; $I++) {
    $Y=356+$I*78
    $Selected=$I-eq 2
    Rect 292 $Y 472 66 $(if($Selected){'#FAF8FF'}else{'#FFFFFF'}) 8 $(if($Selected){'#5B36F2'}else{'#E3E8F1'}) 1
    Text 312 ($Y+27) $Items[$I][0] 13 '#111827' 600
    Text 312 ($Y+51) $Items[$I][1] 10 '#64748B' 400
    $TypeFill=if($Items[$I][2]-eq '材料审核'){'#FFF7ED'}elseif($Items[$I][2]-eq '运营评审'){'#FDF2F8'}else{'#EEF2FF'}
    $TypeColor=if($Items[$I][2]-eq '材料审核'){'#C2410C'}elseif($Items[$I][2]-eq '运营评审'){'#BE185D'}else{'#4F46E5'}
    Badge 642 ($Y+18) $Items[$I][2] $TypeFill $TypeColor | Out-Null
}
Rect 292 842 472 38 '#FFF7ED' 7 '#FED7AA' 1
Text 312 867 '技术维护任务定义；运营仅管理关联关系。' 11 '#9A3412' 500

Section 810 200 830 700 '任务项详情' '新增与编辑共用右侧表单'
Badge 1080 214 '编辑任务项' '#EEF2FF' '#4F46E5' | Out-Null
Button 1488 218 126 '保存修改'
Text 834 274 '任务名称' 11 '#64748B' 500
Rect 834 288 238 42 '#FFFFFF' 6 '#DCE3EE' 1
Text 848 315 '黄金时段达标天数' 12 '#111827' 500
Text 1088 274 '任务编码' 11 '#64748B' 500
Rect 1088 288 236 42 '#FFFFFF' 6 '#DCE3EE' 1
Text 1102 315 'GOLDEN_PEAK_DAYS' 11 '#334155' 500
Text 1340 274 '任务类型' 11 '#64748B' 500
Rect 1340 288 250 42 '#FFFFFF' 6 '#DCE3EE' 1
Text 1354 315 '系统统计  ⌄' 12 '#334155' 500
Text 834 356 '执行器标识' 11 '#64748B' 500
Rect 834 370 490 42 '#FFFFFF' 6 '#DCE3EE' 1
Text 848 397 'GoldenPeakDaysHandler' 12 '#334155' 500
Text 1340 356 '是否启用' 11 '#64748B' 500
Badge 1340 370 '启用' '#4F2BEE' '#FFFFFF' | Out-Null
Badge 1430 370 '停用' '#F1F5F9' '#64748B' | Out-Null
Text 834 452 '任务参数 JSON' 14 '#111827' 600
Rect 834 470 366 184 '#111827' 8
Text 852 500 '{' 12 '#E2E8F0' 400
Text 870 528 '"requiredDays": 4,' 11 '#C4B5FD' 400
Text 870 554 '"dailyRequiredMinutes": 120,' 11 '#C4B5FD' 400
Text 870 580 '"timeRanges": [' 11 '#C4B5FD' 400
Text 886 606 '"12:00-14:00", "20:00-24:00"' 10 '#A7F3D0' 400
Text 870 632 ']' 11 '#C4B5FD' 400
Text 852 650 '}' 12 '#E2E8F0' 400
Text 1220 452 '结果定义 JSON' 14 '#111827' 600
Rect 1220 470 394 184 '#111827' 8
Text 1238 500 '{ "metrics": [' 11 '#E2E8F0' 400
Text 1254 528 '{ "code": "completedDays",' 10 '#C4B5FD' 400
Text 1270 554 '"name": "达标天数",' 10 '#C4B5FD' 400
Text 1270 580 '"type": "number", "unit": "天",' 10 '#A7F3D0' 400
Text 1270 606 '"rewardUsable": true }' 10 '#A7F3D0' 400
Text 1238 636 '] }' 11 '#E2E8F0' 400
Field 834 690 366 '展示说明' '每周至少4天，高峰时段累计直播满2小时。'
Field 1220 690 394 '实现说明' '按每日全部配置时段累计有效直播分钟数。'
Text 834 770 '统一任务结果示例' 14 '#111827' 600
Rect 834 788 780 76 '#F5F3FF' 8 '#DDD6FE' 1
Badge 854 804 '进行中' '#EEF2FF' '#4F46E5' | Out-Null
Text 964 824 'completed=false · status=IN_PROGRESS' 11 '#64748B' 500
Text 1236 824 'resultText：本周高峰时段达标3/4天' 11 '#111827' 600
Text 854 852 'resultData：{ completedDays: 3, requiredDays: 4 }（任务项不配置奖金）' 10 '#475569' 400
Rect 834 876 780 28 '#EFF6FF' 7 '#BFDBFE' 1
Text 854 895 '新增/编辑共用右侧表单；参数和结果定义由技术维护，运营仅管理关联关系。' 10 '#475569' 400
EndSvg '05-管理端-任务项管理.svg'

# 06 App规则说明配置
BeginAdmin '主播体系配置 / 主播身份 / 黄金优质主播' '' 'identity'
Button 1370 30 112 '保存规则'
Button 1500 30 132 '预览App规则' $false
IdentityTabs 'app'
Section 270 160 938 750 '黄金优质主播 · App规则说明' '按主播理解顺序维护身份规则内容'
$Rules = @('身份资格','任务功能与模块奖励','申请审核与生效周期','周任务审核与结算','奖励记录与主动领取','升级、降级与失效')
for ($I=0; $I -lt $Rules.Count; $I++) {
    $Y = 252 + $I * 96
    Rect 292 $Y 892 76 '#FFFFFF' 8 '#E3E8F1' 1
    Circle 336 ($Y+38) 18 '#EEF2FF'
    Text 336 ($Y+44) ([string]($I+1)) 13 '#4F2BEE' 600 'middle'
    Text 376 ($Y+45) $Rules[$I] 15 '#111827' 600
    Badge 1000 ($Y+24) '已配置' '#DCFCE7' '#16A34A' | Out-Null
    Text 1140 ($Y+46) '编辑 ⌄' 13 '#475569' 500
}
Section 1230 160 410 750 'App身份规则预览'
Rect 1284 222 302 610 '#FAFBFF' 34 '#DCE3EE' 5
Text 1435 268 '黄金优质主播身份规则' 15 '#111827' 700 'middle'
Rect 1308 300 254 88 '#FFFFFF' 10 '#E3E8F1' 1
Text 1330 334 '黄金优质主播' 15 '#111827' 700
Badge 1330 348 '身份有效' '#DCFCE7' '#16A34A' | Out-Null
$Preview = @('身份资格','任务与奖励','领取规则')
for ($I=0; $I -lt 3; $I++) {
    $Y=416+$I*112
    Rect 1308 $Y 254 92 '#FFFFFF' 10 '#E3E8F1' 1
    Text 1332 ($Y+34) $Preview[$I] 14 '#111827' 600
    Text 1332 ($Y+62) '查看详细规则与说明 ⌄' 11 '#64748B' 400
}
EndSvg '06-管理端-主播身份-App规则说明.svg'

# 07 主播身份成员
function IdentityMembersContent() {
    BeginAdmin '主播身份成员' '统一管理申请审核、已生效身份、失效与周期任务' 'members'
    Field 290 132 270 '' '' '搜索主播ID/昵称'
    Field 580 132 210 '' '全部身份类型'
    Field 810 132 190 '' '全部状态'
    SimpleTable 290 220 1330 @('主播','申请/当前身份','生效起始周期','当前周期','状态','操作') @(
        @('Lina_Star / 102938475','黄金优质主播','--','--','待审核','审核   删除'),
        @('Mina / 882016','普通优质主播','08-24—08-30','08-24—08-30','审核通过','审核  身份调整  失效结算  周期任务'),
        @('June / 620418','外部认证主播','08-17—08-23','--','已失效·剩5天','审核  重置失效  删除  周期任务'),
        @('Ploy / 991205','黄金优质主播','08-10—08-16','--','已禁止','审核  删除  周期任务')
    ) @(230,210,200,190,170,330) 62
    Section 290 540 1330 330 '功能操作说明' '根据当前身份状态展示可用操作'
    $Ops=@(
        @('审核','只要身份数据存在即可操作；通过、失效、禁止三种结论。'),
        @('身份调整','仅审核通过可用；选择新身份并设置生效起始周期。'),
        @('重置失效','清除“7天后可重新提交”的限制，使主播可以立即再次提交。'),
        @('失效结算','填写结算金额及用户可见备注；立即失效，金额>0生成待领取。'),
        @('删除','删除当前身份数据；涉及已结算奖励时不可直接删除。'),
        @('周期任务','加载该主播当前身份、当前周期的任务快照与具体任务数据。')
    )
    for($I=0;$I-lt $Ops.Count;$I++){
        $Col=$I%2; $Row=[Math]::Floor($I/2); $X=314+$Col*640; $Y=620+$Row*72
        Rect $X $Y 610 56 '#F8FAFC' 8 '#E3E8F1' 1
        Text ($X+18) ($Y+24) $Ops[$I][0] 13 '#4F2BEE' 600
        Text ($X+112) ($Y+24) $Ops[$I][1] 11 '#475569' 400
    }
}
IdentityMembersContent
EndSvg '07-管理端-主播身份成员.svg'

# 08 主播身份审核弹窗
IdentityMembersContent
Add '<rect x="250" y="0" width="1422" height="941" fill="#0F172A" opacity="0.42"/>'
Add '<rect x="500" y="94" width="930" height="760" rx="16" fill="#FFFFFF" filter="url(#softShadow)"/>'
Text 540 144 '主播身份审核' 23 '#111827' 700
Text 1388 144 '×' 24 '#64748B' 400 'middle'
Text 540 188 '主播' 12 '#64748B' 500
Text 688 188 'Lina_Star / 102938475' 14 '#111827' 600
Text 980 188 '申请身份' 12 '#64748B' 500
Text 1100 188 '黄金优质主播' 14 '#111827' 600
Text 540 242 '审核结果' 13 '#334155' 600
Rect 540 260 250 90 '#F0FDF4' 10 '#22C55E' 2
Text 566 294 '通过' 16 '#16A34A' 700
Text 566 324 '设置生效起始周期' 11 '#475569' 400
Rect 810 260 250 90 '#FFF7ED' 10 '#FED7AA' 1
Text 836 294 '失效' 16 '#C2410C' 700
Text 836 324 '7天后允许再次提交' 11 '#475569' 400
Rect 1080 260 250 90 '#FEF2F2' 10 '#FECACA' 1
Text 1106 294 '禁止' 16 '#DC2626' 700
Text 1106 324 '永久禁止再次提交' 11 '#475569' 400
Field 540 404 790 '* 生效起始周期' '2026-08-31—09-06'
Text 540 500 '审核备注（用户可见）' 13 '#334155' 600
Rect 540 518 790 126 '#FFFFFF' 8 '#DCE3EE' 1
Text 560 552 '审核通过，身份将从所选完整自然周开始生效。' 12 '#334155' 400
Rect 540 680 790 76 '#EFF6FF' 8 '#BFDBFE' 1
Text 562 710 '通过：必须设置生效周期；失效：7天后可重新提交；禁止：不可再次提交。' 11 '#475569' 400
Text 562 736 '三种结果均保存用户可见备注。' 11 '#475569' 400
Button 1090 790 106 '取消' $false
Button 1214 790 116 '确认审核'
EndSvg '08-管理端-主播身份审核弹窗.svg'

# 09 周任务审核列表
BeginAdmin '周任务审核' '按周期查询全部主播周任务记录；详情在独立页面打开' 'weekly'
Field 290 132 220 '任务周期' '08-17—08-23'
Field 530 132 210 '身份类型' '全部身份'
Field 760 132 250 '主播ID' '' '请输入主播ID'
Field 1030 132 190 '状态' '全部状态'
SimpleTable 290 240 1330 @('主播','身份类型','任务周期','基础门槛','任务数','已完成','预计可领取','状态','操作') @(
    @('Lina_Star / 102938475','黄金优质主播','08-17—08-23','未完成','7','5','$0','待审核','查看  审核'),
    @('Mina / 882016','普通优质主播','08-17—08-23','已完成','5','4','$10','待审核','查看  审核'),
    @('June / 620418','外部认证主播','08-17—08-23','已完成','6','6','$50','审核通过','查看  审核'),
    @('Ploy / 991205','黄金优质主播','08-10—08-16','未完成','7','6','$0','门槛未达标','查看  审核'),
    @('Nana / 762018','签约主播','08-10—08-16','已完成','8','8','$100','已领取','查看  审核')
) @(190,150,160,140,100,100,150,150,190) 62
Rect 290 650 1330 72 '#EFF6FF' 8 '#BFDBFE' 1
Text 316 680 '查看' 12 '#4F2BEE' 600
Text 382 680 '打开同一周任务结果页面的只读模式，不显示单项审核、整周通过或不通过操作。' 12 '#475569' 400
Text 316 708 '审核' 12 '#4F2BEE' 600
Text 382 708 '打开可操作模式；审核历史状态不限制再次进入，最终提交时记录本次审核结果。' 12 '#475569' 400
EndSvg '09-管理端-周任务审核列表.svg'

# 10 周任务结果审核
BeginAdmin '周任务审核 / 周任务结果' '查看入口为只读模式；审核入口显示以下操作控件' 'weekly'
Badge 1270 46 '审核模式' '#FFF7ED' '#C2410C' | Out-Null
Button 1480 42 140 '返回列表' $false
Section 290 126 1330 100 'Lina_Star / 102938475' '黄金优质主播 · 任务周期 08-17—08-23'
Badge 1180 148 '待审核' '#FFF7ED' '#C2410C' | Out-Null
Text 1320 160 '模块计算奖励 $24' 14 '#64748B' 600
Text 1320 190 '预计可领取 $0' 17 '#DC2626' 700
SimpleTable 290 250 1330 @('模块','任务项','任务类型','是否完成','结果文本','审核结果','操作') @(
    @('基础奖励','周累计直播时长','系统统计','是','本周直播16/14小时','自动结果','--'),
    @('基础奖励','每日高峰时段','系统统计','否','高峰时段达标5/7天','自动结果','--'),
    @('基础奖励','每日有效PK','系统统计','是','有效PK达标7/7天','自动结果','--'),
    @('收入阶梯','周期幸运礼物收入','系统统计','是','收入350W，达到300W档','自动结果','--'),
    @('分享奖励','外部内容分享','材料审核','是','已提交2条，审核通过2条','材料已审','--'),
    @('互动质量','互动质量评审','运营评审','--','等待运营提交主观评审结论','待审核','审核')
) @(130,190,130,110,430,160,180) 48
Rect 290 596 1330 58 '#FFF7ED' 7 '#FED7AA' 1
Text 314 620 '策略结果：基础奖励=全部任务完成 / 无前置；收入阶梯=按任务指标阶梯 / 需要基础门槛。' 10 '#9A3412' 600
Text 314 642 '基础门槛未完成：收入与分享模块保留完成结果和计算奖励，但预计可领取为$0。' 10 '#9A3412' 500
Section 290 666 1330 224 '整周审核快捷操作'
Text 318 716 '所有任务结果确认后统一提交；审核理由对主播可见。' 11 '#64748B' 400
Text 318 748 '审核结果' 12 '#334155' 600
Badge 420 728 '通过' '#DCFCE7' '#16A34A' | Out-Null
Badge 500 728 '不通过' '#FEE2E2' '#DC2626' | Out-Null
Text 318 800 '审核理由' 12 '#334155' 600
Rect 420 766 650 70 '#FFFFFF' 8 '#DCE3EE' 1
Text 440 796 '基础门槛未完成，本周依赖模块奖励不可领取。（用户可见）' 11 '#475569' 400
Text 440 820 '通过与不通过均可填写审核理由。' 11 '#94A3B8' 400
Button 1110 782 160 '审核不通过' $false
Button 1290 782 286 '审核通过并生成待领取记录'
Rect 420 848 1156 28 '#F5F3FF' 7 '#DDD6FE' 1
Text 438 867 '本次通过后最终金额为$0，不生成待领取记录；查看模式隐藏本区域和主观任务“审核”操作。' 10 '#4F2BEE' 500
EndSvg '10-管理端-周任务结果审核.svg'

# 11 奖励记录
BeginAdmin '奖励领取记录' '查询周任务结算后生成的主播主动领取记录' 'rewards'
Field 290 132 250 '' '' '搜索主播ID/昵称'
Field 560 132 210 '' '全部主播身份'
Field 790 132 190 '' '全部状态'
SimpleTable 290 220 1330 @('主播','主播身份','任务周期','奖励金额','生成时间','领取状态','领取时间','操作') @(
    @('Lina_Star','黄金优质主播','08-10—08-16','$37','08-25 11:20','待领取','--','查看'),
    @('Mina','普通优质主播','08-17—08-23','$0','08-25 11:18','门槛未达标','--','查看'),
    @('June','外部认证主播','08-10—08-16','$50','08-18 10:30','已领取','08-18 12:03','查看')
) @(200,190,180,140,190,150,180,100) 64
Rect 290 520 1330 64 '#EFF6FF' 7 '#BFDBFE' 1
Text 316 550 'ⓘ 奖励金额大于0生成“待领取”；主播主动领取后更新为“已领取”。' 12 '#475569' 400
Text 316 574 '基础门槛未完成导致金额为0时显示“门槛未达标”，其他金额为0场景显示“未达标”。' 12 '#475569' 400
EndSvg '11-管理端-奖励领取记录.svg'

function GradientRect($X, $Y, $W, $H, $Radius = 20) {
    Add ('<rect x="{0}" y="{1}" width="{2}" height="{3}" rx="{4}" fill="url(#purpleGradient)" filter="url(#softShadow)"/>' -f $X,$Y,$W,$H,$Radius)
}

function ProgressBar($X, $Y, $W, $Percent, $Color = '#6D45F5') {
    Rect $X $Y $W 10 '#E9E5F7' 5
    Rect $X $Y ($W * $Percent) 10 $Color 5
}

function BeginMobile([string]$Title, $Purple = $true) {
    BeginSvg 941 1672 $(if ($Purple) {'#F5F2FF'} else {'#F7F8FC'})
    Rect 0 0 941 108 '#FFFFFF' 0
    Circle 56 55 26 '#F5F3FF'
    Text 56 65 '‹' 38 '#111827' 500 'middle'
    Text 470 66 $Title 30 '#111827' 700 'middle'
}

function MobileRulesEntry() {
    Add '<rect x="40" y="132" width="861" height="90" rx="22" fill="#FFFFFF" stroke="#E3DDFD" filter="url(#softShadow)"/>'
    Circle 94 177 27 '#5B36F2'
    Text 94 186 '?' 25 '#FFFFFF' 600 'middle'
    Text 144 187 '身份资格、任务与奖励规则' 21 '#111827' 600
    Badge 686 157 '规则说明' '#F5F3FF' '#4F2BEE' | Out-Null
    Text 858 188 '›' 30 '#64748B' 400 'middle'
}

function WeekSwitch([string]$Selected) {
    Add '<rect x="108" y="250" width="725" height="78" rx="39" fill="url(#purpleGradient)"/>'
    if ($Selected -eq 'current') { Rect 112 254 360 70 '#FFFFFF' 35 } else { Rect 469 254 360 70 '#FFFFFF' 35 }
    Text 292 300 '本周任务' 22 $(if ($Selected -eq 'current') {'#4F2BEE'} else {'#FFFFFF'}) 600 'middle'
    Text 650 300 '上周奖励' 22 $(if ($Selected -eq 'last') {'#4F2BEE'} else {'#FFFFFF'}) 600 'middle'
}

# 12 申请状态
BeginMobile '主播身份'
MobileRulesEntry
GradientRect 40 258 861 184 24
Badge 72 286 '申请已通过' '#FFFFFF' '#4F2BEE' | Out-Null
Text 72 356 '普通优质主播' 34 '#FFFFFF' 700
Text 72 402 '将在下周一按完整自然周生效' 17 '#EDE9FE' 400
$Steps = @('提交申请','资格核验','运营审核','等待生效')
for ($I=0; $I -lt 4; $I++) {
    $X=122+$I*230
    if($I-lt 3){Line ($X+25) 520 ($X+205) 520 '#C4B5FD' 4}
    Circle $X 520 24 $(if ($I -lt 3) {'#16A34A'} else {'#5B36F2'})
    Text $X 528 $(if ($I -lt 3) {'✓'} else {'4'}) 14 '#FFFFFF' 700 'middle'
    Text $X 572 $Steps[$I] 14 '#475569' 500 'middle'
}
Add '<rect x="40" y="622" width="861" height="330" rx="24" fill="#FFFFFF" stroke="#E3DDFD" filter="url(#softShadow)"/>'
Text 78 682 '生效信息' 23 '#111827' 700
Badge 718 650 '待生效' '#F5F3FF' '#4F2BEE' | Out-Null
Text 78 748 '生效日期' 15 '#64748B' 400
Text 304 748 '2026-08-31（下周一）' 19 '#111827' 600
Line 78 780 860 780 '#EEF0F5'
Text 78 830 '首个完整周期' 15 '#64748B' 400
Text 304 830 '08/31—09/06' 19 '#111827' 600
Line 78 862 860 862 '#EEF0F5'
Text 78 914 '每周最高奖励' 15 '#64748B' 400
Text 304 914 '$15' 28 '#5B36F2' 700
Text 40 1014 '身份生效后可使用' 23 '#111827' 700
$Features=@('查看每项任务的实时结果说明','上传材料并查看审核进度','查看上周模块奖励','主动领取待领取奖励')
for($I=0;$I-lt 4;$I++){
    $Y=1050+$I*96
    Rect 40 $Y 861 76 '#FFFFFF' 18 '#E3DDFD' 1
    Circle 82 ($Y+38) 18 '#EDE9FE'
    Text 82 ($Y+44) '✓' 13 '#5B36F2' 700 'middle'
    Text 120 ($Y+46) $Features[$I] 17 '#334155' 500
}
Rect 40 1450 861 92 '#EEF2FF' 18
Text 76 1492 '审核通过后从下一个周一生效，任务按完整周期生成。' 15 '#4F2BEE' 500
Text 76 1522 '当前周不补发、不按剩余天数折算。' 14 '#64748B' 400
EndSvg '12-H5-主播身份申请状态.svg'

# 13 本周任务
BeginMobile '主播身份' $true
MobileRulesEntry
WeekSwitch 'current'
Text 470 374 '08/17—08/23' 20 '#5B36F2' 500 'middle'
GradientRect 40 406 861 248 26
Circle 112 478 38 '#FFFFFF'
Text 112 490 '★' 27 '#F59E0B' 700 'middle'
Text 174 472 '黄金优质主播' 31 '#FFFFFF' 700
Text 174 512 '本周任务进行中 · 每日更新结果' 15 '#EDE9FE' 400
Text 78 576 '最高奖励' 14 '#DDD6FE' 400
Text 78 622 '$77' 34 '#FFFFFF' 700
Text 350 576 '已达奖励（待解锁）' 14 '#DDD6FE' 400
Text 350 622 '$23' 34 '#FFFFFF' 700
Text 650 576 '基础门槛' 14 '#DDD6FE' 400
Text 650 622 '2/3项' 25 '#FFFFFF' 700
Text 40 712 '本周任务模块' 24 '#111827' 700
Text 866 712 '4个模块' 14 '#64748B' 400 'end'
$TaskCards=@(
    @('优质主播基础奖励','2/3项完成 · 完成后解锁其他奖励','$10','基础门槛','#5B36F2','0.67'),
    @('收入阶梯奖励','收入350W · 已达到300W奖励档','$20','待解锁','#F59E0B','1.0'),
    @('时长奖励','6天12小时已完成 · 等待门槛解锁','$3','待解锁','#3B82F6','1.0'),
    @('分享奖励','本周已提交1/2条外部内容','$4','进行中','#10B981','0.50')
)
for($I=0;$I-lt 4;$I++){
    $Y=746+$I*174
    Add ('<rect x="40" y="{0}" width="861" height="152" rx="22" fill="#FFFFFF" stroke="#E3DDFD" filter="url(#softShadow)"/>' -f $Y)
    Circle 92 ($Y+54) 28 $TaskCards[$I][4]
    Text 92 ($Y+62) ([string]($I+1)) 16 '#FFFFFF' 700 'middle'
    Text 138 ($Y+48) $TaskCards[$I][0] 22 '#111827' 700
    Text 138 ($Y+80) $TaskCards[$I][1] 14 '#64748B' 400
    ProgressBar 138 ($Y+108) 450 ([double]$TaskCards[$I][5]) $TaskCards[$I][4]
    Text 760 ($Y+48) $TaskCards[$I][2] 25 '#5B36F2' 700 'middle'
    Badge 704 ($Y+78) $TaskCards[$I][3] $(if($TaskCards[$I][3]-eq '已完成'){'#DCFCE7'}elseif($TaskCards[$I][3]-eq '审核中'){'#FDF2F8'}else{'#EEF2FF'}) $(if($TaskCards[$I][3]-eq '已完成'){'#16A34A'}elseif($TaskCards[$I][3]-eq '审核中'){'#BE185D'}else{'#4F2BEE'}) | Out-Null
    Text 864 ($Y+92) '›' 26 '#94A3B8' 500 'middle'
}
Rect 40 1450 861 88 '#FFFFFF' 18 '#E3DDFD' 1
Text 76 1482 '当前奖励资格' 14 '#64748B' 400
Text 76 1512 '尚未获得' 20 '#DC2626' 700
Text 860 1482 '已达奖励 $23，完成基础门槛后解锁' 14 '#4F2BEE' 600 'end'
Text 860 1514 '所有任务仍正常统计，最终以运营审核为准' 12 '#64748B' 400 'end'
EndSvg '13-H5-本周任务.svg'

# 14 任务结果详情
BeginMobile '高峰时段达标天数' $true
GradientRect 40 132 861 248 26
Badge 72 164 '系统统计' '#FFFFFF' '#4F2BEE' | Out-Null
Text 72 232 '本周已达标 3/4天' 34 '#FFFFFF' 700
Text 72 276 '还差1天完成任务' 17 '#EDE9FE' 400
ProgressBar 72 316 620 0.75 '#FBBF24'
Badge 730 292 '进行中' '#F5F3FF' '#4F2BEE' | Out-Null
Text 40 438 '任务要求' 23 '#111827' 700
Add '<rect x="40" y="470" width="861" height="184" rx="22" fill="#FFFFFF" stroke="#E3DDFD" filter="url(#softShadow)"/>'
Text 78 526 '每周至少4天达到高峰直播要求' 20 '#111827' 700
Text 78 570 '每日高峰时段累计直播 ≥ 120分钟' 16 '#475569' 500
Badge 78 598 '12:00—14:00' '#F5F3FF' '#4F2BEE' | Out-Null
Badge 238 598 '20:00—24:00' '#F5F3FF' '#4F2BEE' | Out-Null
Text 40 714 '每日结果' 23 '#111827' 700
Text 866 714 '08/17—08/23' 15 '#64748B' 400 'end'
$DayResults=@(
    @('08/17 周一','132分钟','完成','#16A34A','#DCFCE7'),
    @('08/18 周二','148分钟','完成','#16A34A','#DCFCE7'),
    @('08/19 周三','86分钟','未完成','#DC2626','#FEE2E2'),
    @('08/20 周四','125分钟','完成','#16A34A','#DCFCE7'),
    @('08/21 周五','64分钟','进行中','#4F2BEE','#EEF2FF'),
    @('08/22 周六','--','待统计','#64748B','#F1F5F9'),
    @('08/23 周日','--','待统计','#64748B','#F1F5F9')
)
for($I=0;$I-lt $DayResults.Count;$I++){
    $Y=744+$I*92
    Rect 40 $Y 861 76 '#FFFFFF' 17 '#E3DDFD' 1
    Circle 82 ($Y+38) 17 $DayResults[$I][4]
    Text 82 ($Y+44) $(if($DayResults[$I][2]-eq '完成'){'✓'}elseif($DayResults[$I][2]-eq '未完成'){'!'}else{'·'}) 13 $DayResults[$I][3] 700 'middle'
    Text 116 ($Y+45) $DayResults[$I][0] 17 '#111827' 600
    Text 610 ($Y+45) $DayResults[$I][1] 16 '#64748B' 400 'end'
    Text 848 ($Y+45) $DayResults[$I][2] 16 $DayResults[$I][3] 600 'end'
}
Rect 40 1420 861 110 '#F5F3FF' 20
Text 76 1460 '当前结果' 14 '#64748B' 400
Text 76 1494 '本周高峰时段达标3/4天' 20 '#4F2BEE' 700
Text 860 1494 '数据每日更新' 14 '#64748B' 400 'end'
EndSvg '14-H5-高峰时段任务结果详情.svg'

# 15 外部内容上传
BeginMobile '提交外部内容' $true
GradientRect 40 132 861 202 24
Badge 72 162 '材料审核' '#FFFFFF' '#4F2BEE' | Out-Null
Text 72 232 '每周发布2条Sano相关外部内容' 27 '#FFFFFF' 700
Text 72 280 '已提交 1/2条 · 审核通过 1条' 16 '#EDE9FE' 400
ProgressBar 610 268 220 0.5 '#FBBF24'
Text 40 392 '本周已提交' 23 '#111827' 700
Add '<rect x="40" y="424" width="861" height="180" rx="22" fill="#FFFFFF" stroke="#E3DDFD" filter="url(#softShadow)"/>'
Rect 70 452 142 124 '#EEEAFD' 16
Text 141 514 '截图' 20 '#5B36F2' 700 'middle'
Text 244 470 'Instagram · 08/19 16:20' 16 '#64748B' 400
Text 244 514 'Sano直播精彩片段' 20 '#111827' 700
Badge 244 542 '审核通过' '#DCFCE7' '#16A34A' | Out-Null
Text 40 670 '新增内容' 23 '#111827' 700
Text 40 718 '外部平台' 16 '#334155' 600
Rect 40 738 861 82 '#FFFFFF' 16 '#D8DDE8' 1
Circle 84 779 22 '#5B36F2'
Text 122 786 '选择平台' 17 '#475569' 500
Text 852 788 '⌄' 20 '#64748B' 400 'middle'
Text 40 878 '内容截图' 16 '#334155' 600
Add '<rect x="40" y="900" width="861" height="330" rx="22" fill="#FFFFFF" stroke="#CFC6FA" stroke-width="2" stroke-dasharray="10 8"/>'
Circle 470 1000 48 '#F1EDFF'
Text 470 1017 '＋' 40 '#5B36F2' 400 'middle'
Text 470 1086 '上传内容截图' 23 '#4F2BEE' 700 'middle'
Text 470 1126 '支持JPG/PNG，最多9张' 15 '#94A3B8' 400 'middle'
Text 40 1282 '内容说明' 16 '#334155' 600
Rect 40 1304 861 114 '#FFFFFF' 16 '#D8DDE8' 1
Text 72 1354 '补充外部内容标题或说明（选填）' 16 '#94A3B8' 400
Button 40 1480 861 '提交审核'
EndSvg '15-H5-外部内容截图上传.svg'

# 16 上周奖励
BeginMobile '主播身份' $true
MobileRulesEntry
WeekSwitch 'last'
Text 470 362 '08/10—08/16' 22 '#5B36F2' 500 'middle'
GradientRect 40 392 861 284 26
Text 76 452 '黄金优质主播 · 上周结算' 17 '#EDE9FE' 500
Text 76 526 '$37' 56 '#FFFFFF' 700
Text 76 570 '可领取奖励' 16 '#DDD6FE' 400
Badge 690 438 '待领取' '#FFFFFF' '#4F2BEE' | Out-Null
Text 690 520 '基础门槛已完成' 16 '#FFFFFF' 600
Text 690 552 '完成 4/4个模块' 14 '#EDE9FE' 500
Text 690 574 '审核时间 08/25 11:20' 13 '#DDD6FE' 400
Text 40 732 '模块结算明细' 23 '#111827' 700
$Modules=@(
    @('优质主播基础奖励','$10','基础门槛3项任务均完成'),
    @('收入阶梯奖励','$20','收入350W，达到300W档'),
    @('时长奖励','$3','6天12小时任务已完成'),
    @('分享奖励','$4','每周2条分享任务已完成')
)
for($I=0;$I-lt 4;$I++){
    $Y=768+$I*130
    Add ('<rect x="40" y="{0}" width="861" height="110" rx="18" fill="#FFFFFF" stroke="#E3DDFD" filter="url(#softShadow)"/>' -f $Y)
    Circle 86 ($Y+55) 23 '#DCFCE7'
    Text 86 ($Y+63) '✓' 15 '#16A34A' 700 'middle'
    Text 130 ($Y+45) $Modules[$I][0] 20 '#111827' 700
    Text 130 ($Y+76) $Modules[$I][2] 14 '#64748B' 400
    Text 808 ($Y+66) $Modules[$I][1] 27 '#5B36F2' 700 'end'
}
Rect 40 1304 861 106 '#FFF7ED' 18
Text 76 1346 '审核结算后生成待领取记录，请在有效期内主动领取。' 15 '#9A3412' 500
Text 76 1380 '领取有效期：2026-09-06 23:59:59' 14 '#C2410C' 400
Button 40 1470 861 '立即领取  $37'
EndSvg '16-H5-上周奖励待领取.svg'

# 17 奖励记录
BeginMobile '奖励记录' $true
MobileRulesEntry
$StatusTabs=@('全部','待领取','已领取','未达标')
for($I=0;$I-lt 4;$I++){
    $X=40+$I*220
    Text ($X+90) 280 $StatusTabs[$I] 18 $(if($I-eq 0){'#4F2BEE'}else{'#64748B'}) $(if($I-eq 0){600}else{400}) 'middle'
    if($I-eq 0){Rect ($X+34) 298 112 3 '#4F2BEE' 2}
}
$Records=@(
    @('08/17—08/23','黄金优质主播','$24','待领取','4/4个模块完成','有效期至09/06'),
    @('08/10—08/16','黄金优质主播','$24','已领取','4/4个模块完成','08/18 12:03已领取'),
    @('08/03—08/09','普通优质主播','$0','未达标','2/3个模块完成','周结算已结束')
)
for($I=0;$I-lt 3;$I++){
    $Y=342+$I*274
    Add ('<rect x="40" y="{0}" width="861" height="246" rx="22" fill="#FFFFFF" stroke="#E3DDFD" filter="url(#softShadow)"/>' -f $Y)
    Text 76 ($Y+50) $Records[$I][0] 16 '#64748B' 500
    Badge 696 ($Y+26) $Records[$I][3] $(if($Records[$I][3]-eq '待领取'){'#5B36F2'}elseif($Records[$I][3]-eq '已领取'){'#DCFCE7'}else{'#F1F5F9'}) $(if($Records[$I][3]-eq '待领取'){'#FFFFFF'}elseif($Records[$I][3]-eq '已领取'){'#16A34A'}else{'#64748B'}) | Out-Null
    Text 76 ($Y+98) $Records[$I][1] 22 '#111827' 700
    Text 76 ($Y+166) $Records[$I][2] 38 $(if($Records[$I][2]-eq '$0'){'#64748B'}else{'#5B36F2'}) 700
    Text 220 ($Y+150) $Records[$I][4] 15 '#475569' 500
    Text 220 ($Y+182) $Records[$I][5] 14 '#94A3B8' 400
    Line 76 ($Y+205) 860 ($Y+205) '#EEF0F5'
    Text 820 ($Y+232) '查看结算明细  ›' 14 '#4F2BEE' 600 'end'
}
EndSvg '17-H5-奖励记录.svg'

# 18 规则说明
BeginMobile '身份规则说明' $true
GradientRect 40 132 861 220 26
Badge 72 164 '当前身份' '#FFFFFF' '#4F2BEE' | Out-Null
Text 72 238 '黄金优质主播' 36 '#FFFFFF' 700
Text 72 286 '资格、功能、任务奖励，一页看懂' 17 '#EDE9FE' 400
Text 710 266 '每周最高' 14 '#DDD6FE' 400
Text 710 310 '$77' 34 '#FFFFFF' 700
Text 40 408 '身份规则' 23 '#111827' 700
$RuleItems=@(
    @('身份资格','完成申请与资格审核后，按审核结果获得主播身份。','01'),
    @('可用功能','查看任务、提交审核材料、查询结算和领取奖励。','02'),
    @('任务与模块','任务项输出结果；模块配置完成、资格与奖励三类策略。','03'),
    @('分项奖励','策略读取任务指标，支持固定奖励及通用数值阶梯。','04'),
    @('申请与生效','每周一完成审核，下一个周一按完整自然周生效。','05'),
    @('审核与结算','系统统计或人工评审；周一汇总，最迟周二统一结算。','06'),
    @('领取与身份变更','结算后主动领取；升降级或失效以下一周期为主。','07')
)
for($I=0;$I-lt $RuleItems.Count;$I++){
    $Y=440+$I*152
    Add ('<rect x="40" y="{0}" width="861" height="132" rx="20" fill="#FFFFFF" stroke="#E3DDFD" filter="url(#softShadow)"/>' -f $Y)
    Rect 70 ($Y+28) 64 64 '#F1EDFF' 18
    Text 102 ($Y+69) $RuleItems[$I][2] 16 '#5B36F2' 700 'middle'
    Text 164 ($Y+48) $RuleItems[$I][0] 21 '#111827' 700
    Text 164 ($Y+84) $RuleItems[$I][1] 14 '#64748B' 400
    Text 850 ($Y+70) '⌄' 20 '#475569' 400 'middle'
}
EndSvg '18-H5-主播身份规则说明.svg'

# 19 上周基础门槛未完成
BeginMobile '主播身份' $true
MobileRulesEntry
WeekSwitch 'last'
Text 470 362 '08/10—08/16' 22 '#5B36F2' 500 'middle'
Rect 40 392 861 284 '#FFFFFF' 26 '#FCA5A5' 1
Badge 74 426 '门槛未达标' '#FEE2E2' '#DC2626' | Out-Null
Text 74 506 '$0' 54 '#111827' 700
Text 74 550 '本周期可领取奖励' 16 '#64748B' 400
Text 560 462 '已完成3个有奖模块' 16 '#111827' 600
Text 560 500 '计算奖励 $27' 15 '#4F2BEE' 600
Text 560 536 '可领取奖励 $0' 15 '#DC2626' 600
Rect 74 586 790 58 '#FFF7ED' 12 '#FED7AA' 1
Text 96 620 '基础任务未完成，依赖基础门槛的奖励均不可领取。' 14 '#9A3412' 600
Text 40 732 '模块结算明细' 23 '#111827' 700
$LockedModules=@(
    @('优质主播基础奖励','未完成','计算 $0  ·  可领取 $0','#DC2626','#FEE2E2'),
    @('收入阶梯奖励','已完成','计算 $20  ·  可领取 $0','#D97706','#FFF7ED'),
    @('时长奖励','已完成','计算 $3  ·  可领取 $0','#D97706','#FFF7ED'),
    @('分享奖励','已完成','计算 $4  ·  可领取 $0','#D97706','#FFF7ED')
)
for($I=0;$I-lt 4;$I++){
    $Y=768+$I*132
    Add ('<rect x="40" y="{0}" width="861" height="112" rx="18" fill="#FFFFFF" stroke="#E3DDFD" filter="url(#softShadow)"/>' -f $Y)
    Circle 86 ($Y+56) 23 $LockedModules[$I][4]
    Text 86 ($Y+63) $(if($I-eq 0){'!'}else{'✓'}) 15 $LockedModules[$I][3] 700 'middle'
    Text 130 ($Y+43) $LockedModules[$I][0] 20 '#111827' 700
    Text 130 ($Y+76) $LockedModules[$I][2] 14 '#64748B' 400
    Badge 730 ($Y+38) $LockedModules[$I][1] $LockedModules[$I][4] $LockedModules[$I][3] | Out-Null
}
Rect 40 1320 861 116 '#FFF7ED' 18
Text 76 1362 '你完成的有奖任务结果已保留，但本周期没有奖励领取资格。' 14 '#9A3412' 500
Text 76 1398 '未完成门槛：每天高峰时间段累计直播 ≥ 2小时。' 13 '#C2410C' 400
Rect 40 1490 861 54 '#E5E7EB' 12
Text 470 1524 '基础门槛未完成，无可领取奖励' 15 '#64748B' 600 'middle'
EndSvg '19-H5-上周门槛未完成.svg'

Write-Output 'Generated 19 editable SVG prototypes.'
