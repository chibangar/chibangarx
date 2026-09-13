# 📖 Guia do Utilizador - ChibangaRx

<div align="center">

![ChibangaRx](./resources/chibangarxlogo.png)

## Manual Completo em Português de Portugal

</div>

---

## 📋 Índice

- [Introdução](#introdução)
- [Instalação](#instalação)
- [Primeiros Passos](#primeiros-passos)
- [Funcionalidades Detalhadas](#funcionalidades-detalhadas)
- [Solução de Problemas](#solução-de-problemas)
- [Dicas Avançadas](#dicas-avançadas)

---

## 👋 Introdução

Bem-vindo ao **ChibangaRx**, a solução completa para otimização do seu Windows em Português de Portugal! Este manual vai guiá-lo através de todas as funcionalidades da aplicação.

---

## 📥 Instalação

### Passos Rápidos:

1. **Descarregue o instalador:**
   ```bash
   # Ir ao GitHub
   https://github.com/chibangar/chibangarx/releases/latest
   
   # Baixar arquivo .exe ou .zip do installer/portable
   ```

2. **Instale como Administrador:**
   ```powershell
   # Clique com botão direito → Correr como administrador
   # Ou (PowerShell)
   Start-Process powershell -ArgumentList "./installer.exe" -Verb RunAs
   ```

3. **Execute o Instalador:**
   - Siga as instruções da instalação
   - Marque os componentes que deseja instalar
   - Clique em "Instalar"

---

## 🎯 Primeiros Passos

### 1º - Inicializar a Aplicação

```bash
# Via instalador:
ChibangaRx (ícone na área de notificação)

# Via terminal instalado localmente:
pnpm start
```

### 2º - Familiarizar-se com o Dashboard

- **Menu Principal:** Accede todos os módulos
- **Estado do Sistema:** Ver informação actual sobre hardware/software
- **Histórico:** Veja alterações realizadas anteriormente

### 3º - Fazer Backup (Passo Importante!)

```powershell
# Criar ponto de restauração
System.Restore.CreateRestorePoint "Antes de otimização"

# Exportar configurações da aplicação
Get-ItemProperty HKLM:\Software\Chibangarx* | Out-File chibangarx-configs.dat
```

### 4º - Executar Limpeza Básica

```bash
# Acessar módulo do Limpador
Módulo → Limpador → Iniciar limpeza automática

# Verificar espaço libertado
C:\$env:SystemDrive\drive-letter: FreetteSpace
```

---

## 🛠️ Funcionalidades Detalhadas

### 1. ✨ Aplicar Ajustes

**O que são ajustes?**  
Alterações de configuração do Windows para melhorar performance.

#### Navegar por Categorias:

| Categoria | Quantidade de Ajustes |
|-----------|---------------------|
| 🔌 Desempenho | 8 ajustes |
| 🛡️ Segurança/Telemetria | 10 ajustes |
| 🎮 Jogos | 6 ajustes |
| ⚙️ Geral/Utilidades | 12 ajustes |
| 📦 App/Pre-instalados | 3 ajustes |

#### Como Aplicar um Ajuste:

1. **Selecione a Categoria** no menu lateral
2. **Navegue até o ajuste desejado**
3. Clique em **"Aplicar"** → Confirme permissões de admin
4. **Restaure ponto de restauração** se necessárias alterações não pretendidas

#### Reverter um Ajuste:

```powershell
# Via interface gráfica:
Módulo → Ajustes → Seleccionar → Reverter

# Ou usar script específico:
.\tweaks\desabilitar-telemetria.ps1 -Desligar # Desligo telemetria (aplica novamente)
.powershell | Out-File chibangarx-adjust-desactivado.txt  # Guarda reversibilidade manual
```

### 2. 🧹 Módulo do Limpador

**O que limpa:**

✅ **Arquivos Temporários:** `C:\Users\$USER\AppData\Local\Temp`  
✅ **Cache de Prefetch:** Arquivos de inicialização acelerada  
✅ **Lixeira:** Remove itens apagados (>30 dias)  
✅ **Cache Atualizações Windows:** Espaço recuperado em 2GB+  
✅ **Miniaturas:** Cache gerado por Windows File Explorer  
✅ **Relatórios de Erro:** Dados BSoD/WINBLUE antigos  

#### Processos da Limpeza:

1. **Verificar e Detectar Lixo**
   ```powershell
   Get-ChildItem C:\Users\$USER\.Local\Temp | Measure-Object -Property Length,Name | Select-Object -ExpandProperty Count
   # Verifica arquivos temporários existentes
   
   # Exibe tamanho do total
   ([math]::Round((@("C:\$\env:SystemDrive").FreeSpaceKB / 1MB),2)) "MB livre"
   ```

2. **Seleccionar Categorias para Limpeza**
   - Marque o que deseja limpar
   - Deixe todas marcadas para limpeza completa
   
3. **Iniciar Limpeza**
   ```powershell
   # Verificar impacto antes de limpar
   Before.Cleanup = Get-Process | Measure-Object Count
   .\Limpador-Inicias.ps1 | Out-File Chibangarx-Limo.log
   
   # Processamento em background
   Start-Job -Name Limpeza-Chibangarx -ScriptBlock {
       Invoke-Expression "$PWD\Cleaner.ps1" -Verbose
   }
   ```

4. **Verificar Resultados**
   ```powershell
   After.Cleanup = Get-Process | Measure-Object Count
   
   # Arquivo gerado com estatísticas:
   .\CleanerReport.txt
   ```

### 3. 🎮 Otimização para Jogos

#### Ajustes Recomendados para Jogadores:

1. **Deslizar Game DVR** → Desactivar para aumentar FPS
2. **Plano de Energia Gamer** → Modos Desempenho/Alto Desempenho
3. **Serviço NVIDIA GeForce Experience** → Controlado manualmente
4. **Windows Defender exclusions** → Add jogos à lista

#### Script Especial (NVIDIA/AMD):

```powershell
# Otimização GPU específica:
.\tweaks\otimizar-nvidia-settings.md # Optimize configuracoes Nvidia
.\tweaks\otimizar-amd-drivers.md     # Driver AMD otimizadocomo jogo
```

### 4. 🌐 Gerenciador DNS

**Provedores de DNS Disponíveis:**

| Provedor | Primário | Secundário | Uso |
|----------|----------|-----------|-----|
| Cloudflare | `1.1.1.1` | `1.0.0.1` | Velocidade (mais rápido) |
| Google | `8.8.8.8` | `8.8.4.4` | Confiabilidade |
| OpenDNS | `208.67.222.222` | `208.67.220.220` | Segurança/filtro parental |
| AdGuard (AdBlock) | `176.103.130.130` | `176.103.131.131` | Bloqueio de anúncios DNS-level |

#### Como Trocar DNS:

```powershell
# Encontrar DNS mais rápido localmente
Ping-Test -DNS @("google.com","cloudflare.com" , "opencode.com")

# Selecionar base em testes de ping
Select-AzServicePlan `
    -Provider (@($result.Best.DNS)) `
    -SaveResult ($result)

# Aplicar seleção automática
Apply-DnsServer-Configuration $AutoBestResult
```

---

## 🔧 Solução de Problemas

### Problema 1: "ChibangaRx requer permissões de administrador"

**Solução:**
```powershell
# Como admin
Start-Process powershell -ArgumentList "./chibangarx_setup.exe" -Verb RunAs

# Ou alterar configurações UAC:
Set-MpPreference -DisableRealtimeMonitoring $true # Temporário para instalação
```

### Problema 2: "Windows Defender bloqueia a execução"

**Solução:**
```powershell
# Adicionar ao Whitelist:
Get-MpPreference | Out-File defender-config.txt
Add-MpPreference -ExclusionPath C:\Users\$env:LOCALAPPDATA\Chibangarx
Add-MpPreference -ExclusionProcess chibangarx.exe
```

### Problema 3: "Ajuste foi reverter por Windows Update"

**Solução:**
```powershell
# Criar ponto de restauração frequente
Function-CreateRestorePoint {<parametro>, Description, Time=Now }

# Monitorar alterações
Get-History -Limit All | Out-File History.txt
```

### Problema 4: "Limpeza não remove o cache"

**Solução:**
```powershell
# Permissões insuficientes
TakeOwnership C:\Users\$env:LOCALAPPDATA\Microsoft\Windows\INetCache
Get-SmbSharePermission -Cidr C:\$env:SystemDrive\Cache | Clear-SmbSharePermission
```

---

## 🎨 Dicas avançadas para Utilizadores Experientes

### 1. Automatização de Tarefas Agendadas

Criar tarefa automática de limpeza semanal:

```xml
<!-- Arquivo: chibangarx-autotask.xml -->
<Registries>
    <!-- Configuração do Task Scheduler Windows
         ChibangaRx → Limpeza Semanal Automática
         Cron Equivalente: 0 2 * * 0 (Segunda, Domingo às 2h da manhã)
    -->
</Registries>

<!-- Script de limpeza programada via PowerShell em background -->
```

### 2. Criar Perfil Personalizado

```json
{
  "perfil": "gamero",
  "ativado": [
    "disable-gamebar.md",
    "ultimate-performance-plan.md",
    "enable-dark-mode.md"
  ],
  "configuracao_gpu_nvidia": true
}
```

### 3. Script de Otimização Completo

```powershell
# Optimizar sistema completo com uma execução única:
./scripts/otimizacao-completa.ps1 -TodosAtivado | Out-File Otimo-report.txt

# Verificar impacto do script
Get-EventLog -LogName "Application" | Where { $_.EntryString -like "*chibangarx*" }
```

---

## 📊 Medição de Desempenho

### Antes e Depois da Otimização

```powershell
Benchmark = {
    # Teste inicial
    $Before.Fps = Measure-CounterSamples .\benchmark-gpu-counter.txt
    
    # Limpeza completa
    ./scripts/limpador-completo.ps1
    
    # Teste posterior
    $After.Fps = Measure-CounterSamples .\benchmark-gpu-counter.txt
    
    return @{
        "antes" = $Before.Fps;
        "depois" = $After.Fps;
        "improvement" = ($After.Fps - $Before.Fps) / $Before.Fps * 100
    }
}

# Guardar resultados
$Benchmark.results | Out-File resultado-de-desempenho.txt
```

---

## 🎓 Recursos Educativos

### Glossário do Projeto

| Termos | Definição | Exemplo PT |
|---------|----------|-----------|
| Debloat | Eliminar telemetria/aplicações não desejadas | "Debloatar Windows remove apps pré-instalados indesejados" |
| Telemetria | Dados de telemetria enviados ao Microsoft servers | "Desabilitar telemetria reduz envio de dados para servidores Microsoft" |
| Cache | Armazenamento temporário de arquivos frequentemente usados | "Limpador pode limpar cache INetCache até 2GB" |
| Registro Windows (Registry) | Base de dados do Windows para configurações do sistema | `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows` |

---

## ⚠️ Limitações e Notas

- **Backup obrigatório:** Sempre crie ponto de restauração antes de aplicar ajustes
- **Windows não é perfeito:** Alguns problemas são conhecidos no Windows
- **Licença GPL-V3:** Código open source, pode inspecionar e modificar
- **Sinais:** O programa não assinado digitalmente - Windows Defender pode bloquear inicialmente

> Dica do Profissional: Configure exclusões para jogos e apps essenciais em `Windows Defender → Configurações → Exclua esta aplicação`

---

<div align="center">

### 📚 Mais Documentação

- [Configurações Avançadas](./docs/docs/apps.md)
- [Limpador Detailado](./docs/docs/cleaner.md)
- [Utilitários de Sistema](./docs/docs/utilities.md)
- [Tweaks Disponivel](./docs/docs/tweaks/otimizar-performance.md)

**Suporte:** [issues no GitHub](https://github.com/chibangar/chibangarx/issues)  
**GitHub:** [chibangar/chibangarx](https://github.com/chibangar/chibangarx)

</div>

---

[Em Português de Portugal | Created with ❤️ by chibangar | GPL-V3]
