$ErrorActionPreference = 'Stop'
$repoRoot = 'D:\XRAK\team\rak-end\rak-control'

# Pull credentials via Git Credential Manager — do not print secrets
$credInput = "protocol=https`nhost=github.com`n`n"
$cred = $credInput | git credential fill 2>$null
if (-not $cred) { Write-Output 'NO_CREDENTIAL'; exit 1 }

$user = ''
$pass = ''
foreach ($line in $cred -split "`n") {
  if ($line -like 'username=*') { $user = $line.Substring(9) }
  if ($line -like 'password=*') { $pass = $line.Substring(9) }
}
if (-not $user -or -not $pass) { Write-Output 'CRED_PARSE_FAIL'; exit 1 }
Write-Output "credential user=$user (password hidden, len=$($pass.Length))"

$headers = @{
  Authorization = "Bearer $pass"
  Accept        = 'application/vnd.github+json'
  'User-Agent'  = 'rak-control-setup'
  'X-GitHub-Api-Version' = '2022-11-28'
}

# Check org access
try {
  $org = Invoke-RestMethod -Uri 'https://api.github.com/orgs/VANexus' -Headers $headers -Method Get
  Write-Output "org ok: $($org.login)"
} catch {
  Write-Output "org check failed: $($_.Exception.Message)"
}

# Check if repo already exists
$exists = $false
try {
  $r = Invoke-RestMethod -Uri 'https://api.github.com/repos/VANexus/rak-control' -Headers $headers -Method Get
  Write-Output "repo already exists: $($r.full_name) private=$($r.private)"
  $exists = $true
} catch {
  Write-Output 'repo not found, will create'
}

if (-not $exists) {
  $body = @{
    name       = 'rak-control'
    description = 'Rak WeChat miniprogram — flowmind task pool ROI (team repo)'
    private    = $false
    auto_init  = $false
  } | ConvertTo-Json
  try {
    $created = Invoke-RestMethod -Uri 'https://api.github.com/orgs/VANexus/repos' -Headers $headers -Method Post -Body $body -ContentType 'application/json'
    Write-Output "created: $($created.full_name) private=$($created.private) url=$($created.html_url)"
  } catch {
    $detail = $_.ErrorDetails.Message
    if (-not $detail) { $detail = $_.Exception.Message }
    Write-Output "create failed: $detail"
    exit 2
  }
}

# Push without proxy
$env:HTTP_PROXY = ''
$env:HTTPS_PROXY = ''
$env:http_proxy = ''
$env:https_proxy = ''
$env:ALL_PROXY = ''
$env:all_proxy = ''

Push-Location $repoRoot
try {
  git remote set-url origin https://github.com/VANexus/rak-control.git
  git push -u origin main 2>&1 | Out-String | Write-Output
  Write-Output '--- remote branch ---'
  git ls-remote --heads origin 2>&1 | Out-String | Write-Output
} finally {
  Pop-Location
}
