$ErrorActionPreference = 'Stop'
node (Join-Path $PSScriptRoot 'validate-prototypes.js')
if ($LASTEXITCODE -ne 0) { throw '原型验证未通过' }
node (Join-Path $PSScriptRoot 'render-prototypes.js')
if ($LASTEXITCODE -ne 0) { throw '原型导出未完成' }
