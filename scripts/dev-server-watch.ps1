$ErrorActionPreference = 'Continue'
Set-Location 'C:\citizen_witness\Citizen-Witness'
[System.Environment]::SetEnvironmentVariable('PATH', $null, 'Process')
$node = 'C:\Program Files\nodejs\node.exe'
$args = @('node_modules\tsx\dist\cli.mjs', 'server\index.ts')
while ($true) {
  $stamp = Get-Date -Format o
  Add-Content -Path 'server-watch.log' -Value "$stamp starting server"
  & $node @args >> 'server-watch.out.log' 2>> 'server-watch.err.log'
  $code = $LASTEXITCODE
  $stamp = Get-Date -Format o
  Add-Content -Path 'server-watch.log' -Value "$stamp server exited code=$code; restarting in 2s"
  Start-Sleep -Seconds 2
}
