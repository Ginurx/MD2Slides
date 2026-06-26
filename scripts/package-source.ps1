$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$packageJsonPath = Join-Path $repoRoot "package.json"
$packageJson = Get-Content -Raw -LiteralPath $packageJsonPath | ConvertFrom-Json
$packageName = $packageJson.name

if ([string]::IsNullOrWhiteSpace($packageName)) {
  throw "package.json must include a non-empty name field."
}

$dateStamp = Get-Date -Format "yyyyMMdd"
$releaseDir = Join-Path $repoRoot "releases"
$zipPath = Join-Path $releaseDir "$packageName-$dateStamp.zip"
$stageRoot = Join-Path ([System.IO.Path]::GetTempPath()) "md2slides-source-package"
$stageDir = Join-Path $stageRoot "$packageName-$dateStamp"

function ConvertTo-RepoRelativePath {
  param([Parameter(Mandatory = $true)][string]$Path)

  return ($Path -replace "\\", "/").TrimStart("./")
}

function Test-IncludedPath {
  param([Parameter(Mandatory = $true)][string]$Path)

  $relativePath = ConvertTo-RepoRelativePath $Path

  if ([string]::IsNullOrWhiteSpace($relativePath)) {
    return $false
  }

  if ($relativePath -match '(^|/)\.git(/|$)') {
    return $false
  }

  if ($relativePath -match '(^|/)releases(/|$)') {
    return $false
  }

  if ($relativePath -match '(^|/)\.md2slides-package-tmp(/|$)') {
    return $false
  }

  if ($relativePath -match '\.zip$') {
    return $false
  }

  return $true
}

function Invoke-GitFileList {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)

  $files = git -c core.quotepath=false @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Arguments -join ' ') failed."
  }

  return $files
}

function Assert-SafeChildPath {
  param(
    [Parameter(Mandatory = $true)][string]$Parent,
    [Parameter(Mandatory = $true)][string]$Child
  )

  $parentFullPath = [System.IO.Path]::GetFullPath($Parent)
  $childFullPath = [System.IO.Path]::GetFullPath($Child)

  if (-not $childFullPath.StartsWith($parentFullPath, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to remove path outside expected directory: $childFullPath"
  }
}

function Get-RepoRelativeFiles {
  param([Parameter(Mandatory = $true)][string]$Directory)

  if (-not (Test-Path -LiteralPath $Directory -PathType Container)) {
    return @()
  }

  return Get-ChildItem -LiteralPath $Directory -Recurse -File |
    ForEach-Object {
      $_.FullName.Substring($repoRoot.Length + 1).Replace("\", "/")
    }
}

Push-Location $repoRoot
try {
  $trackedFiles = Invoke-GitFileList @("ls-files")
  $untrackedFiles = Invoke-GitFileList @("ls-files", "--others", "--exclude-standard")
  $documentAssetFiles = Get-RepoRelativeFiles (Join-Path $repoRoot "docs/layout-previews")

  $sourceFiles = @($trackedFiles + $untrackedFiles + $documentAssetFiles) |
    Where-Object { Test-IncludedPath $_ } |
    Sort-Object -Unique

  if ($sourceFiles.Count -eq 0) {
    throw "No source files found to package."
  }

  New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

  if (Test-Path -LiteralPath $stageDir) {
    Assert-SafeChildPath -Parent $stageRoot -Child $stageDir
    Remove-Item -LiteralPath $stageDir -Recurse -Force
  }

  New-Item -ItemType Directory -Force -Path $stageDir | Out-Null

  foreach ($relativeFile in $sourceFiles) {
    $sourcePath = Join-Path $repoRoot $relativeFile

    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
      continue
    }

    $destinationPath = Join-Path $stageDir $relativeFile
    $destinationDir = Split-Path -Parent $destinationPath
    New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
    Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Force
  }

  if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }

  Compress-Archive -Path (Join-Path $stageDir "*") -DestinationPath $zipPath -Force

  Write-Host "Packaged $($sourceFiles.Count) files."
  Write-Host "Created $zipPath"
} finally {
  Pop-Location

  if (Test-Path -LiteralPath $stageDir) {
    Assert-SafeChildPath -Parent $stageRoot -Child $stageDir
    Remove-Item -LiteralPath $stageDir -Recurse -Force
  }
}
