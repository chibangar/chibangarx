# 💡 Dicas Avançadas - ChibangaRx (PT-PT)

<div align="center">

![Advanced Tips](./resources/chibangarxlogo.png)

## Guia de Uso Avançado em Português do Portugal

</div>

---

## 🎯 Dicas para Utilizadores Experientes

### **1️⃣ Automatizar Limpeza Automática**

Criar tarefa programada semanalmente:

```powershell
# Criar task scheduler Windows para limpeza automática todos domingos às 2h:
New-ScheduledTaskAction -Executable "Powershell.exe" -Argument "./scripts/limpeza-semanal.ps1 -Silent"

New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 2AM

New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBattery
Register-ScheduledTask -Action $a -Trigger $t -TaskName "ChibangarxAutomaticoLimpeza" | Out-File Task.txt
```

---

### **2️⃣ Criar Perfis Personalizados**

Configurções específicas para uso gamer/criador:

```json
{
  // Perfil Gamer - Máximo Desempenho
  "perfil-gamer": {
    "ativados": [
      "disable-gamebar",
      "ultimate-performance-plan",
      "enable-high-performance-mode",
      "disable-windows-defender-realtime" # Se necessário
    ]
  },
  
  // Perfil Produtividade - Equilíbrio
  "perfil-prod": {
    "ativados": [
      "disable-telemetry",
      "enable-cached-rpc-ss",
      "cleanup-wifi-sense"
    ]
  }
}
```

Guarde em: `C:\Users\$env:USERNAME\.config\chibangarx\perfis.json`

---

### **3️⃣ Monitorar Desempenho Após Otimizar**

```powershell
# Benchmar antes e depois para medir ganhos reais
Function-Testar_Desempenho {
    $Antes.Fps = Measure-CpuUsage
    Invoke-ScheduledAction -Name "./scripts/limpeza-semanal.ps1"
    $Depois.Fps = Measure-CpuUsage
    
    @{
        "Melhoria_percentagem" = ($Depois - $Antes) / $Antes * 100
        "FPS_antigo" = $Antes.Fps
        "FPS_novo" = $Depois.Fps
    } | Export-Csv C:\Users\$env:USERNAME\.config\chibangarx\benchmark-resultados.csv -NoTypeInformation
}

Testar_Desempenho | Out-File Logs.txt
```

---

### **4️⃣ Criar Backup Automático de Configuração**

```powershell
# Copiar backup automático após cada optimização:
Function-SaveBackup {
    $Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Copy-Item -Path "./config/*" `
         -Destination ".\backups\$Timestamp\*.json" -Recurse -Force | Out-File BackupSalvo.txt
    
    if (Test-Path .\logs) {
        Get-ChildItem .\logs\*.* | Compress-Archive -DestinationPath "backup-logs-$Timestamp.tar"
    }
}

SaveBackup | Out-File Logs.txt
```

---

### **5️⃣ Script de Otimização Completo**

Execute uma vez para limpar sistema totalmente:

```powershell
# Arquivo completo para executar manualmente (admin) em caso queira reconfigurar tudo:
Function-Otimizar_Completo {
    # 1. Crie ponto de restauração FIRST
    if ($host.name -eq "Consoles") { 
        Write-Warning "Execute PowerShell com permissões Elevadas!"
        return
    }
    
    try {
        # Backup inicial completo
        $BackupPath = Join-Path ".\backups\" (Get-Date -Format "yyyyMMdd").ToString()
        if (-not (Test-Path $BackupPath)) { New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null }
       
        # Backup dos ajustes atualmente aplicados
        Copy-Item ".\config\*" $BackupPath -Recurse | Out-File BackupFeito.txt
        
        # 2. Limpeza completa de sistema:
        .\Tweaks\Cleanup.ps1 -AllCategories | Out-File Cleanup.log
        
        # 3. Aplicar ajustes essenciais do perfis personalizadas:
        .\Scripts\ApplyConfig.ps1 -Perfil "gamer" | Out-File Apply.txt
    } catch {
        Write-Error "Erro na função Otimizar-Completo: $_" | Tee-Object -Variable ErrorLog
        throw
    }
}

# Execute (com cautela):
Otimizar_Completo -Force | Out-File Logs.txt
```

---

### **6️⃣ Configurar DNS Manualmente**

Encontrar e aplicar DNS mais rápido usando ping:

```powershell
Function-Teste_DNS {
    $DnsServers = @{
        "Cloudflare" = @("1.1.1.1", "1.0.0.1")
        "Google" = @("8.8.8.8", "8.8.4.4")
        "OpenDNS" = @("208.67.222.222", "208.67.220.220")
        "AdGuard" = @("176.103.130.130", "176.103.131.131")
    }
    
    $resultados = foreach ($server in $DnsServers) {
        @{
            "provedor" = $server.Name
            "ip_primary" = $server.primaryIp
            "ping_ms" = (Test-NetConnection -Server google.com).PingSuccsessTime.Milliseconds
        }
    }
    
    # Selecionar melhor:
    $resultados | Sort-Key {"PingMS"} | Select-Object -First 1

    # Aplicar DNS melhores:
    Set-DnsClientServerAddress -InterfaceAlias "Wireless" -ServerAddresses @{ipPrimary}
}
```

---

### **7️⃣ Monitorar Telemetria no Background**

```powershell
# Script para manter telemetria desligada mesmo após atualizações:
Function-MonitorTelemetria {
    Register-ObjectScript -Path "./scripts/maintem-desativar-telemetria.ps1" -Frequency "Daily"
}

MonitorTelemetria | Out-File Logs.txt
```

---

### **8️⃣ Exportar/Importar Configuração**

Transferir configurações entre PCs ou backup:

```powershell
# Exportar toda configuração atual para arquivo JSON comprimido
Compress-Archive `
    -Path ".\config\*.json" .\.logs\*.log` `
    -DestinationPath "backup-chibangarx-$(Get-Date).zip" | Out-File BackupComplete.zip

# Importar de backup anterior:
Expand-Archive -Path "backup-chibangarx-*.zip" `
    -DestinationPath "C:\Temp\Restauracao" | Out-File Logs.txt

# Restaurar configurações específicas:
Copy-Item ".\Temp\Restauracao\config.json\*.*" `.\.config\** -Recurse | Out-File Restaurado.txt
```

---

### **9️⃣ Verificar Impacto de Drivers**

```powershell
# Diagnosticar problemas comuns relacionados com GPU/drivers:
Function-Verificador_Drivers {
    # Obter lista GPUs instaladas no sistema Windows:
    Get-PnpDevice -Class 'Display' | Select-Object Name,Manufacturer,Status
    
    # Verificar versão drivers e verificar se estão atualizados no website oficial:
    Get-PnPDriver -Name "nvlddmkm" | Out-File Logs.txt
    
    # Resetar driver da GPU (necessário após Windows Update frequentemente com GPUs NVIDIA/AMD):
    .\tweaks\restart-drivers-gpu.ps1 | Out-File RestartDrivers.txt
}

Verificador_Drivers | Out-File Logs.txt
```

---

### **🔟 Limpeza Avançada de Registro**

```powershell
# Limpar chave de registro obsoleta (use com CAUTELA):
Function-Limpar_Registry {
    $Chave = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Telemetry"
    
    try {
        Reg Delete "$Chave" /F | Out-File LogsRemover.txt
        
        # Recriar estrutura padrão após remoção:
        New-Item -Path $Chave -Force | Out-File NovoRegistroCriado.txt
    } catch {
        Write-Error "Erro ao limpar key registry: $_"
        throw
    }
}

# Limpeza do registro apenas se sabe o está fazendo!
# Sempre faça backup da chave antes de alterar/remove algo manualmente.
```

---

<div align="center">

## 📖 Recursos Adicionais Avançados

### **Scripts Disponíveis:**

- `.//backup/automated-backup.ps1` → Backup automático programado
- `./scripts/benchmark-run.ps1` → Execução de teste de desempenho em batch
- `./docs/docs/tweaks/optimize-all.ps1` → Aplica todos os ajustes uma vez com verificação de integridade

### **Ferramentas Integradas:**

| Script | Uso | Localização |
|--------|-----|-------------|
| `cleanup-full.ps1` | Limpeza total do sistema | `./tweaks/` |
| `monitor-telemetry.ps1` | Monitoriza telemetria de background | `./scripts/` |
| `benchmark-gpu.ps1` → Teste GPU benchmarks | `./docs/tweaks/gpu-test.sh |

---

<div align="center">

## ⚠️ Avisos Importantes

### **Use com CAUTELA:**

- 🔴 Alterações de registro do Windows sempre requerem backup manual antes
- 🟠 Scripts de limpeza programada devem ser executados manualmente em primeiro lugar ou verificados regularmente para evitar exclusão acidental de arquivos importantes
- 🟢 Sempre teste novos ajustes em ambiente sandboxed (VirtualBox/VMWare) antes de aplicar em produção

### **Recomendações Profissionais:**

1. Crie ponto de restauração DO Windows DEPOIS de cada modificação significativa  
2. Mantenha backup de configurações anteriores para reversibilidade fácil caso necessário  
3. Use `git` para versionar scripts customizados em repositório remoto por segurança  

---

[PT-PT | ChibangaRx Advanced User Tips | 2025 © chibangar](https://github.com/chibangar)

</div>
