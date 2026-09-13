export const operations = {
  "run-utilities.diskCleaner": {
    "script": "cleanmgr /sagerun:1",
    "requiresConfirmation": true
  },
  "check-utilities.storageSense": {
    "script": "\n$path = \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy\"\nif (Test-Path $path) {\n  $value = Get-ItemProperty -Path $path -Name \"01\" -ErrorAction SilentlyContinue\n  if ($value.\"01\" -eq 1) { Write-Output \"enabled\" } else { Write-Output \"disabled\" }\n} else {\n  Write-Output \"disabled\"\n}",
    "requiresConfirmation": false
  },
  "apply-utilities.storageSense": {
    "script": "\n$path = \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy\"\nif (-not (Test-Path $path)) {\n  New-Item -Path $path -Force | Out-Null\n}\nSet-ItemProperty -Path $path -Name \"01\" -Value 1",
    "requiresConfirmation": true
  },
  "unapply-utilities.storageSense": {
    "script": "\n$path = \"HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy\"\nif (Test-Path $path) {\n  Set-ItemProperty -Path $path -Name \"01\" -Value 0\n}",
    "requiresConfirmation": true
  },
  "run-utilities.systemInformation": {
    "script": "msinfo32",
    "requiresConfirmation": true
  },
  "check-utilities.fastStartup": {
    "script": "\n$path = \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power\"\nif (Test-Path $path) {\n    $value = Get-ItemProperty -Path $path -Name \"HiberbootEnabled\" -ErrorAction SilentlyContinue\n    if ($value.HiberbootEnabled -eq 1) { Write-Output \"enabled\" } else { Write-Output \"disabled\" }\n} else {\n    Write-Output \"disabled\"\n}",
    "requiresConfirmation": false
  },
  "apply-utilities.fastStartup": {
    "script": "\npowercfg /hibernate on\n$path = \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power\"\nif (!(Test-Path $path)) { New-Item -Path $path -Force | Out-Null }\nSet-ItemProperty -Path $path -Name \"HiberbootEnabled\" -Type DWord -Value 1\n",
    "requiresConfirmation": true
  },
  "unapply-utilities.fastStartup": {
    "script": "\n$path = \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power\"\nif (Test-Path $path) { Set-ItemProperty -Path $path -Name \"HiberbootEnabled\" -Type DWord -Value 0 }\n",
    "requiresConfirmation": true
  },
  "run-utilities.graphicsDriver": {
    "script": "\n$gpus = Get-PnpDevice -Class Display -Status OK -ErrorAction SilentlyContinue\nif ($gpus) {\n    foreach ($gpu in $gpus) {\n        Write-Output \"Restarting $($gpu.FriendlyName)...\"\n        Disable-PnpDevice -InstanceId $gpu.InstanceId -Confirm:$false\n        Start-Sleep -Seconds 2\n        Enable-PnpDevice -InstanceId $gpu.InstanceId -Confirm:$false\n    }\n    Write-Output \"Graphics driver restart completed.\"\n} else {\n    Write-Output \"No active display devices found.\"\n}\n",
    "requiresConfirmation": true
  },
  "run-utilities.windowsSearch": {
    "script": "\ntry {\n    Get-AppxPackage Microsoft.Windows.Search | Reset-AppxPackage\n    Write-Output \"Microsoft.Windows.Search restart completed.\"\n}\ncatch {\n    Write-Output \"An error occured while resetting Microsoft.Windows.Search.\"\n}\ntry {\n    Get-AppxPackage MicrosoftWindows.Client.CBS | Reset-AppxPackage\n    Write-Output \"MicrosoftWindows.Client.CBS restart completed.\"\n}\ncatch {\n    Write-Output \"An error occured while resetting MicrosoftWindows.Client.CBS.\"\n}\n",
    "requiresConfirmation": true
  },
  "check-utilities.powerPlan": {
    "script": "\n$current = powercfg /getactivescheme\nif ($current -match \"Power saver\") { Write-Output \"Power Saver\" }\nelseif ($current -match \"High performance\") { Write-Output \"High Performance\" }\nelseif ($current -match \"Ultimate Performance\") { Write-Output \"Ultimate Performance\" }\nelse { Write-Output \"Balanced\" }\n",
    "requiresConfirmation": false
  },
  "apply-utilities.powerPlan-Balanced": {
    "script": "powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e",
    "requiresConfirmation": true
  },
  "apply-utilities.powerPlan-High Performance": {
    "script": "powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c",
    "requiresConfirmation": true
  },
  "apply-utilities.powerPlan-Power Saver": {
    "script": "powercfg /setactive a1841308-3541-4fab-bc81-f71556f20b4a",
    "requiresConfirmation": true
  },
  "apply-utilities.powerPlan-Ultimate Performance": {
    "script": "\n$ultimatePlan = powercfg -l | Select-String \"Ultimate Performance\"\n\nif (-not $ultimatePlan) {\n    Write-Host \"Ultimate Performance plan not found. Creating...\"\n    powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61\n} else {\n    Write-Host \"Ultimate Performance plan already exists.\"\n}\n\n$ultimatePlanGUID = (powercfg -l | Select-String \"Ultimate Performance\").ToString().Split()[3]\n\nif ($ultimatePlanGUID) {\n    powercfg -setactive $ultimatePlanGUID 2>$null\n    Write-Host \"Ultimate Performance power plan is now active.\"\n} else {\n    Write-Host \"Failed to find Ultimate Performance plan GUID.\"\n}\n",
    "requiresConfirmation": true
  },
  "run-utilities.flushDnsCache": {
    "script": "\nipconfig /flushdns\nWrite-Output \"DNS cache flushed.\"\n",
    "requiresConfirmation": true
  },
  "run-utilities.releaseIp": {
    "script": "\nipconfig /release\nWrite-Output \"IP address released. You are temporarily disconnected from the network.\"\n",
    "requiresConfirmation": true
  },
  "run-utilities.renewIp": {
    "script": "\nipconfig /renew\nWrite-Output \"New IP address obtained successfully.\"\n",
    "requiresConfirmation": true
  },
  "run-utilities.fixBluetooth": {
    "script": "\nStop-Service -Name \"bthserv\" -Force -ErrorAction SilentlyContinue\nStart-Service -Name \"bthserv\" -ErrorAction SilentlyContinue\nWrite-Output \"Bluetooth services restarted.\"\n",
    "requiresConfirmation": true
  },
  "run-utilities.systemFileChecker": {
    "script": "\nStart-Process powershell -ArgumentList \"-NoExit\", \"-Command\", \"sfc /scannow; Write-Output 'System File Checker completed'\"\n\n",
    "requiresConfirmation": true
  },
  "run-utilities.dismHealthRestore": {
    "script": "\nStart-Process powershell -ArgumentList \"-NoExit\", \"-Command\", \"dism /online /cleanup-image /restorehealth; Write-Output 'DISM Health Restore completed'\"\n\n",
    "requiresConfirmation": true
  },
  "run-utilities.checkDisk": {
    "script": "\nStart-Process powershell -ArgumentList \"-NoExit\", \"-Command\", \"chkdsk /f /r /x; Write-Output 'Check Disk completed'\"\n\n",
    "requiresConfirmation": true
  },
  "run-utilities.restartAudioService": {
    "script": "\nStop-Service -Name \"Audiosrv\" -Force -ErrorAction SilentlyContinue\nStart-Service -Name \"Audiosrv\" -ErrorAction SilentlyContinue\nWrite-Output \"Audio service restarted.\"\n",
    "requiresConfirmation": true
  },
  "run-utilities.networkReset": {
    "script": "\nnetsh winsock reset\nnetsh int ip reset\nWrite-Output \"Network stack reset. Restart your PC to apply changes.\"\n",
    "requiresConfirmation": true
  },
  "cleanup-temp": {
    "script": "\n      $systemTemp = \"$env:SystemRoot\\Temp\"\n      $userTemp = [System.IO.Path]::GetTempPath()\n      $foldersToClean = @($systemTemp, $userTemp)\n      $totalSizeBefore = 0\n      \n      foreach ($folder in $foldersToClean) {\n          if (Test-Path $folder) {\n              $folderSize = (Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum\n              $totalSizeBefore += if ($folderSize) { $folderSize } else { 0 }\n              Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue\n          }\n      }\n      \n      Write-Output $totalSizeBefore\n    ",
    "requiresConfirmation": true
  },
  "size-temp": {
    "script": "\n      $systemTemp = \"$env:SystemRoot\\Temp\"\n      $userTemp = [System.IO.Path]::GetTempPath()\n      $foldersToClean = @($systemTemp, $userTemp)\n      $totalSize = 0\n      foreach ($folder in $foldersToClean) {\n          if (Test-Path $folder) {\n              $folderSize = (Get-ChildItem -Path $folder -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum\n              $totalSize += if ($folderSize) { $folderSize } else { 0 }\n          }\n      }\n      Write-Output $totalSize\n    ",
    "requiresConfirmation": false
  },
  "cleanup-prefetch": {
    "script": "\n      $prefetch = \"$env:SystemRoot\\Prefetch\"\n      $totalSizeBefore = 0\n      if (Test-Path $prefetch) {\n          $totalSizeBefore = (Get-ChildItem -Path \"$prefetch\\*\" -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum\n          Remove-Item \"$prefetch\\*\" -Force -Recurse -ErrorAction SilentlyContinue\n      }\n      Write-Output $totalSizeBefore\n    ",
    "requiresConfirmation": true
  },
  "size-prefetch": {
    "script": "\n      $prefetch = \"$env:SystemRoot\\Prefetch\"\n      $totalSize = 0\n      if (Test-Path $prefetch) {\n          $totalSize = (Get-ChildItem -Path \"$prefetch\\*\" -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum\n      }\n      Write-Output $totalSize\n    ",
    "requiresConfirmation": false
  },
  "cleanup-recyclebin": {
    "script": "\n      $recycleBinSize = 0\n      $shell = New-Object -ComObject Shell.Application\n      $recycleBin = $shell.Namespace(0xA)\n      $recycleBinSize = ($recycleBin.Items() | Measure-Object -Property Size -Sum).Sum\n      if ($null -eq $recycleBinSize) { $recycleBinSize = 0 }\n      Clear-RecycleBin -Force -ErrorAction SilentlyContinue\n      Write-Output $recycleBinSize\n    ",
    "requiresConfirmation": true
  },
  "size-recyclebin": {
    "script": "\n      $recycleBinSize = 0\n      $shell = New-Object -ComObject Shell.Application\n      $recycleBin = $shell.Namespace(0xA)\n      $recycleBinSize = ($recycleBin.Items() | Measure-Object -Property Size -Sum).Sum\n      if ($null -eq $recycleBinSize) { $recycleBinSize = 0 }\n      Write-Output $recycleBinSize\n    ",
    "requiresConfirmation": false
  },
  "cleanup-windows-update": {
    "script": "\n      $windowsUpdateDownload = \"$env:SystemRoot\\SoftwareDistribution\\Download\"\n      $totalSizeBefore = 0\n      if (Test-Path $windowsUpdateDownload) {\n          $totalSizeBefore = (Get-ChildItem -Path \"$windowsUpdateDownload\\*\" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum\n          Remove-Item \"$windowsUpdateDownload\\*\" -Force -Recurse -ErrorAction SilentlyContinue\n      }\n      Write-Output $totalSizeBefore\n    ",
    "requiresConfirmation": true
  },
  "size-windows-update": {
    "script": "\n      $windowsUpdateDownload = \"$env:SystemRoot\\SoftwareDistribution\\Download\"\n      $totalSize = 0\n      if (Test-Path $windowsUpdateDownload) {\n          $totalSize = (Get-ChildItem -Path \"$windowsUpdateDownload\\*\" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum\n      }\n      Write-Output $totalSize\n    ",
    "requiresConfirmation": false
  },
  "cleanup-thumbnails": {
    "script": "\n      $thumbCache = \"$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer\"\n      $totalSizeBefore = 0\n      $thumbFiles = Get-ChildItem \"$thumbCache\\thumbcache_*.db\" -ErrorAction SilentlyContinue\n      if ($thumbFiles) {\n          $totalSizeBefore = ($thumbFiles | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum\n          Remove-Item \"$thumbCache\\thumbcache_*.db\" -Force -ErrorAction SilentlyContinue\n      }\n      Write-Output $totalSizeBefore\n    ",
    "requiresConfirmation": true
  },
  "size-thumbnails": {
    "script": "\n      $thumbCache = \"$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer\"\n      $totalSize = 0\n      $thumbFiles = Get-ChildItem \"$thumbCache\\thumbcache_*.db\" -ErrorAction SilentlyContinue\n      if ($thumbFiles) {\n          $totalSize = ($thumbFiles | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum\n      }\n      Write-Output $totalSize\n    ",
    "requiresConfirmation": false
  },
  "cleanup-errorreports": {
    "script": "\n      $crashDumps = \"$env:LOCALAPPDATA\\CrashDumps\"\n      $totalSizeBefore = 0\n      if (Test-Path $crashDumps) {\n          $totalSizeBefore = (Get-ChildItem -Path \"$crashDumps\\*\" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum\n          Remove-Item \"$crashDumps\\*\" -Force -Recurse -ErrorAction SilentlyContinue\n      }\n      Write-Output $totalSizeBefore\n    ",
    "requiresConfirmation": true
  },
  "size-errorreports": {
    "script": "\n      $crashDumps = \"$env:LOCALAPPDATA\\CrashDumps\"\n      $totalSize = 0\n      if (Test-Path $crashDumps) {\n          $totalSize = (Get-ChildItem -Path \"$crashDumps\\*\" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum\n      }\n      Write-Output $totalSize\n    ",
    "requiresConfirmation": false
  }
} as const

export type MaintenanceRequest = { operation: keyof typeof operations }

export function resolveOperation(request: unknown): { script: string; requiresConfirmation: boolean } {
  if (!request || typeof request !== "object" || Array.isArray(request) ||
      Object.keys(request).length !== 1 || !("operation" in request) ||
      typeof request.operation !== "string" || !Object.hasOwn(operations, request.operation)) {
    throw new Error("Unknown maintenance operation")
  }
  return operations[request.operation as keyof typeof operations]
}
