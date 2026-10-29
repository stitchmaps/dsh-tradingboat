# Install the "dsh-tradingboat" plugin into the running DSH desktop profile.
#
#   pwsh -File .\install.ps1
#
# Copies this repository's plugin files (package.json, lib/, ...) into the
# profile's node_modules, records a file: dependency, and appends a loader row
# to the profile's cordis.patch.yml. Every modified file is backed up next to
# the original with a timestamp.

param(
  [string]$Profile = $(if ($env:DSH_PROFILE_DIR) { $env:DSH_PROFILE_DIR } else { Join-Path (Join-Path $env:USERPROFILE '.dsh') 'profiles\desktop' }),
  [switch]$NoEnable
)

$ErrorActionPreference = 'Stop'
$pkg = 'dsh-tradingboat'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = $repoRoot
if (-not (Test-Path (Join-Path $source 'package.json'))) { throw "plugin source not found: $source" }
if (-not (Test-Path $Profile)) { throw "profile not found: $Profile" }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$target = Join-Path (Join-Path $Profile 'node_modules') $pkg

Write-Host "[1/4] copying plugin to $target"
if (Test-Path $target) { Remove-Item -Recurse -Force $target }
New-Item -ItemType Directory -Path $target -Force | Out-Null
foreach ($item in @('package.json', 'cordis.patch.yml', 'icon.svg', 'README.md', 'README.zh.md', 'lib')) {
  if (Test-Path (Join-Path $source $item)) {
    Copy-Item -Recurse -Force (Join-Path $source $item) (Join-Path $target $item)
  }
}

Write-Host "[2/4] registering dependency in profile package.json"
$pkgPath = Join-Path $Profile 'package.json'
Copy-Item $pkgPath "$pkgPath.bak-$stamp" -Force
$pkgJson = Get-Content $pkgPath -Raw | ConvertFrom-Json
if ($null -eq $pkgJson.dependencies) {
  $pkgJson | Add-Member -MemberType NoteProperty -Name dependencies -Value ([pscustomobject]@{}) -Force
}
$fileSpec = 'file:' + ($source -replace '\\', '/')
$existing = $pkgJson.dependencies.PSObject.Properties[$pkg]
if ($null -eq $existing) {
  $pkgJson.dependencies | Add-Member -MemberType NoteProperty -Name $pkg -Value $fileSpec -Force
} else {
  $existing.Value = $fileSpec
}
$pkgJson | ConvertTo-Json -Depth 40 | Set-Content -Path $pkgPath -Encoding utf8

if ($NoEnable) {
  Write-Host "[3/4] -NoEnable set; skipping cordis.patch.yml edit"
  Write-Host "[4/4] done (not enabled)"
  return
}

Write-Host "[3/4] enabling plugin row in cordis.patch.yml"
$patchPath = Join-Path $Profile 'cordis.patch.yml'
Copy-Item $patchPath "$patchPath.bak-$stamp" -Force
$patch = Get-Content $patchPath -Raw
if ($patch -match '(?m)^\s*name:\s*[''"]?dsh-tradingboat[''"]?\s*$') {
  Write-Host "      dsh-tradingboat row already present; leaving as is"
} else {
  $block = @"

# --- dsh-tradingboat plugin (added by install.ps1) ---
- insert:
    - id: dsh-tradingboat
      name: dsh-tradingboat
"@
  Add-Content -Path $patchPath -Value $block -Encoding utf8
  Write-Host "      row appended"
}

Write-Host "[4/4] done"
Write-Host "Refresh the Web GUI page (Ctrl+R) to load the browser half."
Write-Host "Host half needs a patch reload (remove+re-add the row) or a profile restart to take effect."
