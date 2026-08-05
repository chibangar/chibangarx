powershell -Command "
$content = Get-Content -Path 'C:\\Users\\Ricardo\\Downloads\\chibangarx-main\\chibangarx-main\\src\\main\\drivers.ts' -Raw -Encoding UTF8
$lines = $content -split '\\r?\\n'
for ($i = 690; $i -le 720; $i++) {
    if ($i -lt $lines.Count) {
        Write-Host ('=== LINE {0} ===' -f $i)
        Write-Host $lines[$i]
    }
}
" 2>&1 | Out-String -Width 1000