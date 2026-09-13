# 🔧 Troubleshooting - ChibangaRx (PT-PT)

<div align="center">

![TroubleShooting](./resources/chibangarxlogo.png)

</div>

---

## 🎯 Problemas Comuns e Soluções em PT-PT

### **Problema 1: "Windows Defender bloqueia execução"**  
**Sintoma:** Mensagem de segurança Windows Defender/SmarthScreen ao tentar executar `chibangarx.exe`  
**Causa:** Arquivo não assinado digitalmente  

#### 👨‍💻 **Solução em PT-PT:**
```powershell
# Adicionar à exclusão do Defender:
Get-MpPreference | Out-File defender-config.txt

Add-MpPreference -ExclusionPath "C:\Users\$env:LOCALAPPDATA\Chibangarx"
Add-MpPreference -ExclusionProcess "chibangarx.exe"

# Ou usar opção alternativa via interface:
Start-ChibangaRxDefenderWhitelist.ps1 | Out-File Deflog.txt
```

---

### **Problema 2: "Requer permissões de administrador"**  
**Sintoma:** Erro UAC ao tentar aplicar ajustes ou criar pontos de restauração  
**Causa:** Execução sem privilegios suficiente  

#### 👨‍💻 **Solução:**
```powershell
# Correr como administrador:
Start-Process powershell -ArgumentList "./chibangarx_setup.exe" -Verb RunAs

# Se ainda ocorrer erro após UAC approval:
netsh advfirewall firewall show rule name=all | Select-String "Chibangarx"

# Verificar configurações de conta administrativa atual:
Get-LocalGroupMember "Administradores" | Out-File Administradores.txt
```

---

### **Problema 3: "Configurações reverter após reiniciar"**  
**Sintoma:** Aplicação aplicada desliga-se após boot do Windows  
**Causa:** Telemetria/Windows Defender removendo ajustes manualmente  

#### 👨‍💻 **Solução:**
```powershell
# Bloquear telemetria que remove ajustes:
Disable-NetConnectionBrokerFeature | Out-File TelemetriaDesativada.txt

Set-TelemetryState -Level 0 # Nível 0 = Mínimo, Desativa telemetria completa

# Criar ponto de restauração para backup caso necessário reverta manualmente:
Create-Cmo "Após corrigir problemas de configurações" | Out-File BackupPoint.txt
```

---

### **Problema 4: "Limpeza não remove cache"**  
**Sintoma:** Limpador afirma limpar, mas espaço disc permanece ocupado  
**Causa:** Permissão insuficientepasta protegidas do Windows  

#### 👨‍💻 **Solução:**
```powershell
# Aceder com permissões elevadas:
TakeOwnership "C:\Users\$env:LOCALAPPDATA\Microsoft\Windows\INetCache"

# ou manualmente alterar permissões ACL da pasta cache:
icacls "C:\Users\$env:LOCALAPPDATA\Microsoft\Windows\INetCache" /grant administrators:F | Out-File PermissaoACL.txt

# Limpar e recriar com permissões correctas agora:
Get-ChildItem C:\Users\$env:LOCALAPPDATA\Temp | Remove-Item -Recurse -Force | Out-File LogsLimpados.txt
```

---

### **Problema 5: "Erro ao aplicar ajustes" (0x800705B0)**  
**Sintoma:** Erro de acesso "Não permitido a aceder arquivo/registry"  
**Causa:** Permissões de UAC ou serviço de registro Windows indisponível  

#### 👨‍💻 **Solução:**
```powershell
# Reboot com permissão de administrador:
Restart-Computer -Force | Out-File Logs

# Verificar estado serviços de registro em background:
Get-Service Registry* | Select-Object Name,Status | Out-File StatusServicos.txt

# Recriar chaves de registry quebradas (se aplicável) após desabilitação:
New-Item -Path HKLM:\SOFTWARE\Chibangarx -Force | Out-File NovoRegistroCriado.txt
```

---

### **Problema 6: "Ajustes não persistem após Windows Update"**  
**Sintoma:** Telemetria do Windows reativa telemetria automaticamente após update do SO  
**Causa:** Windows Update reset telemetria nível para padrão  

#### 👨‍💻 **Solução:**
```powershell
# Criar tarefa agendada automática para manter desligado:
Register-ObjectScript -Path "./scripts/mainten-desativar-telemetria.ps1" | Out-File Task.txt

# Monitorar mudanças após update:
Get-History -Limit All | Select-String "telemetry" | Out-File TelemetriaHistory.txt
```

---

### **Problema 7: "Aplicação fecha-se ao iniciar"**  
**Sintoma:** ChibangaRx fecha imediatamente ao rodar `chibangarx.exe`  
**Causa:** Arquivo corrompido/corrupto ou conflito com software antivírus  

#### 👨‍💻 **Solução:**
```powershell
# Reinstalar desde build limpo:
Remove-App "ChibangaRx" -ErrorAction SilentlyContinue | Out-File Desinstalacao.txt

Get-ChildItem C:\Users\$env:LOCALAPPDATA\chibangarx* | Remove-Item -Recurse -Force | Out-File Limpar.txt

Install-Module -Name Chibangarx -Scope Local | Out-File Instalacao.txt

# Reinstalar e verificar estado:
npm install && pnpm start | Out-File Logs.txt
```

---

### **Problema 8: "Módulos do sistema de telemetria não desligados"**  
**Sintoma:** Telemetria ainda ativa apesar de ajustes aplicados  
**Causa:** Modulação/Script específico não executado devido a erro de permissão  

#### 👨‍💻 **Solução:**
```powershell
# Atualizar módulo de telemetria manualmente:
Update-TelemetryModule -Verbose | Out-File Logs.txt

# Verificar estado após deshabilitação:
Get-NetConnectionBrokerFeatureStatus | Out-File StatusDesativacao.txt
```

---

### **Problema 9: "Cache da loja Microsoft não limpo"**  
**Sintoma:** Cache de apps Loja Windows permanece ocupado apesar limpeza  
**Causa:** Permissão de sistema necessária para a pasta `AppXS` protegida  

#### 👨‍💻 **Solução:**
```powershell
# Limpar cache store completo com permissões elevadas:
Dism /Online /Cleanup-Image /StartComponentCleanup | Out-File CleanupComponentImages.txt
Dism /Online /Cleanup-Image /RestoreHealth | Out-File RestoreHealth.txt

# Ou manualmente limpar cache da loja apps (PowerShell admin) :
Stop-Service AppXSrv -ErrorAction SilentlyContinue | Out-File ServicosParados.txt

Remove-Item "C:\ProgramData\Windows\AppCache" -Recurse -Force | Out-File LimparStore.txt
```

---

### **Problema 10: "Ajuste não aplicado corretamente"**  
**Sintoma:** Ajuste selecionado continua ativa mesmo após "aplicar"  
**Causa:** Erro de script ou serviço Windows que reseta configurações automaticamente  

#### 👨‍💻 **Solução:**
```powershell
# Verificar estado manual registro para ajuste específico:
Get-ItemProperty HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Telemetry | Select-Object * | Out-File Registro.txt

# Reaplicar manualmente com verificação:
.\tweaks\disable-telemetry.ps1 -Aplicar -Verbose | Out-File ApplyScriptLog.txt

# Verificar estado após reaplicação:
Test-NetConnection -Destination "google.com" | Out-File ConexaoVerificada.txt
```

---

### **Problema 11: "Erro de compilação ao rodar `pnpm build`"**  
**Sintoma:** Erro TypeScript/TS durante build do projeto  
**Causa:** Tipos/outdated ou dependências com versões incompatíveis  

#### 👨‍💻 **Solução:**
```bash
# Resetear node_modules e reinstalar:
rm -rf node_modules package-lock*.json pnpm-lock.yaml

# Reinstalando dependências:
pnpm install --frozen-lockfile

# Verificar TypeScript:
npx tsc --noEmit | Out-File TypeScriptErrors.txt

# Compilar novamente:
pnpm build | Out-File BuildLog.txt
```

---

<div align="center">

### 📊 Monitoramento

**Arquivos de log para depuração:**  
```bash
./logs/chibangarx.log          # Logs principais do app
./logs/telemetry-status.txt     # Estado da telemetria após ajustes
./logs/cleaner-report.txt       # Relatório de limpeza executada
```

---

### 🔍 Ferramentas de Diagnóstico Disponíveis:

| Ferramenta | Uso | Arquivo Gerado |
|------------|------|-----------------|
| `ChibangaRx-Diagnosticar.ps1` | Diagnosticar sistema geral | `reporte-diagnostico.txt` |
| `VerificarTelemetria.ps1` | Checar se telemetria ativa | `telemetria-status.txt` |
| `Benchmark-Desempenho.ps1` | Medir ganhos pós otimização | `benchmark-results.txt` |

---

<div align="center">

### 📧 Precisa de Ajuda Adicional?

**Contactos:**  
- GitHub Issues: https://github.com/chibangar/chibangarx/issues  
- Email: chibangar@chibangarx.pt (se adicionado)  

**Comunidade em PT-PT:**  
Discord do projeto ChibangaRx (link no README principal)

---

**Última Atualização**: 13 Setembro 2026 | Versão: 2.45.15  
**Licença**: GPL-V3 (Open Source)  

</div>
