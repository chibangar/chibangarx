# 🚀 ChibangaRx para Windows

<div align="center">

![ChibangaRx Logo](./resources/chibangarxlogo.png)

## Ferramenta de Otimização e Otimização do seu PC Windows

Uma aplicação completa para limpar, otimizar e melhorar o desempenho do seu computador Windows.

---

### 📝 Características Principais

| Característica | Descrição |
|---------------|-----------|
| **Aplicar Ajustes** | 40+ ajustes em categorias essenciais com interruptores reversíveis |
| **Limpador de Sistema** | Elimine arquivos temporários, cache e lixo do Windows |
| **Utilitários** | Ferramentas de diagnóstico e manutenção avançada |
| **Gerenciador DNS** | Altere servidores DNS facilmente com opções personalizáveis |
| **Instalador de Aplicações** | Instale ou remova apps pré-instaladas do Windows |
| **Cópia de Segurança & Reverter** | Crie pontos de restauração reversíveis com segurança |
| **Estatísticas do Sistema** | Dashboards para desempenho e diagnóstico completo |

---

## 📋 Requisitos do Sistema

```json
{
  "node": "^22.0.0 ou superior",
  "pnpm": "Instalado",
  "os": "Windows 10/11",
  "admin": "Permissões de administrador necessárias"
}
```

---

## 🚀 Instalação Rápida

### Método 1: Instalador Oficial
```powershell
# Download do instalador:
https://github.com/chibangar/chibangarx/releases/latest
```

### Método 2: Instalar via PowerShell
```powershell
irm https://raw.githubusercontent.com/chibangar/chibangarx/main/get.ps1 | iex
```

### Método 3: Instalação Local (Desenvolvimento)
```bash
git clone https://github.com/chibangar/chibangarx.git
cd chibangarx
pnpm install
pnpm dev
```

---

## 📂 Estrutura do Projeto

O projeto `CHIBANGARX` é organizado da seguinte forma:

```
chibangarx/
├── src/              # Código-fonte principal
│   ├── main/         # Electron process principal
│   ├── preload/      # IPC Bridge
│   └── renderer/     # React Frontend
├── tweaks/           # Scripts de otimização do Windows
├── docs/             # Documentação completa em PT-PT
├── scripts/          # Automação e ferramentas
├── backups/          # Cópias de segurança
└── build/            # Arquivos de compilação
```

---

## 🔧 Funcionalidades Principais

### 1. **Aplicar Ajustes do Sistema**
   - Eliminar telemetria e rastreamento
   - Desativar serviços desnecessários
   - Otimizar configurações para jogos e rendering
   - Configurações de GPU compatíveis (NVIDIA, AMD, Intel)

### 2. **Limpador do Sistema**
   - Arquivos temporários
   - Prefetch cache
   - Lixeira vazia
   - Cache de atualizações Windows
   - Cache de miniaturas
   - Relatórios de erro

### 3. **Utilitários do Sistema**
   ```bash
   SFC, DISM, Verificar Disco
   
   Reiniciar drivers GPU
   Resetar configurações de rede
   Gerenciar plano de energia customizado
   
   Armazenamento inteligente
   Ferramentas de diagnóstico completo
   ```

### 4. **Gerenciador DNS**
   - Servidores de DNS pré-configurados
   - Teste de ping para encontrar o DNS mais rápido
   - Visualizador de DNS atual
   - Purge de cache DNS
   
   **Provedores comuns:**
   - Cloudflare: `1.1.1.1`
   - Google: `8.8.8.8`
   - OpenDNS, AdGuardDNS

### 5. **Instalador de Aplicações**
   - Navegue por +156 aplicações disponíveis
   - Instale via Winget ou Chocolatey
   - Remova apps que não são utilizadas
   
   **Categorias:**
   - Utilidades (10 categorias)
   - Ferramentas de sistema
   - Aplicativos de segurança

### 6. **Backup & Restauração**
   ```powershell
   # Criar ponto de restauração
   ChibangaRx criar-pp
  
   # Reverter ajustes individuais
   ChibangaRx reverter ajuste-nome
   ```

### 7. **Dashboards do Sistema**
   - Monitoramento de CPU, GPU, Memória
   - Informações de versão do SO
   - Informações de disco
   - Contagem de ajustes ativos

---

## 📖 Utilização

### Iniciar a Aplicação
```bash
# Para desenvolvimento
pnpm dev

# Para construir
pnpm build

# Para rodar o executável compilado
pnpm start
```

### Executar Scripts Individualmente
```powershell
# Limpar cache do Windows
.\tweaks\run-cache-cleanup.ps1

# Aplicar ajuste específico
.\tweaks\disable-telemetry.ps1 -aplicar

# Gerenciar DNS
.\scripts\dns-manager.ps1
```

---

## 🎯 Exemplo: Desativar Telemetria

```powershell
# Via ChibangaRx UI ou linha de comando
.\tweaks\disable-telemetry.ps1

# Verificar estado
Get-ItemProperty HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Telemetry | Select-Object *
```

---

## ✨ Recursos Especiais

### 🔒 Segurança e Reversibilidade
- Todos os ajustes são reversíveis
- Criação de pontos de restauração automática
- Logs detalhados das ações
- Backups automáticos mantidos

### 🎮 Otimizações para Jogos
```powershell
# Plano de energia otimizadocom jogos
.\tweaks\ultimate-performance-plan.md

# FPS limite e sincronização vertical desativado
.\tweaks\disable-vsync-games.md

# Desativar Game DVR
.\tweaks\disable-gamebar.md
```

### 📊 Monitoramento de Desempenho
- CPU, GPU, memória RAM
- Latência de rede
- Utilização de disco
- Processos em tempo real

---

## 🛠️ Dicas e Truques

### 1. Antes de Aplicar Ajustes
```powershell
# Crie ponto de restauração
Create-Cmo -Description "Antes da otimização"

# Faça backup dos dados importantes
tar -czf backup-dados.tar.gz \
    documentos/ fotos/ videos/
```

### 2. Verificar Impacto do Ajuste
```powershell
# Antes
Get-Process | Measure-Object Count

# Após
.\scripts\benchmark.ps1
```

### 3. Restaurar Se Necessário
```powershell
# Reverter um ajuste específico
.\tweaks\revert-all.ps1

# Ou usar ponto de restauração do Windows
System.Restore -RestorePoint nome-do-ponto
```

---

## 📤 Sair / Remover ChibangaRx

### Desinstalação Limpa
```bash
pnpm remove chibangarx
Remove-Item .\node_modules -Recurse
Remove-Item .\dist -Recurse
```

### Backup da Configuração
```powershell
# Salvar configurações atuais
tar -czf backups/backup-chibangarx-pre-install.tar.gz \
    src/* tweaks/* configs/*
```

---

## 🔐 Privacidade e Segurança

- **Licença:** GPL-V3 (Open Source)
- **Transparência:** Código auditável publicamente
- **Sem telemetria não solicitada** por padrão
- **Privacidade:** Dados mantidos localmente

---

## ⚠️ Avisos Importantes

> [!ATENÇÃO]
> O estado atual do Windows tem problemas: atualizações quebradas, apps pré-instalados indesejados e telemetria em segundo plano que roda não importa se você quer ou não.
>
> O `CHIBANGARX` não pode resolver todos os problemas do Windows, mas pode ajudá-lo a debloatar seu PC, melhorar o desempenho e reduzir a latência.

### Backup OBRIGATÓRIO Antes de Iniciar:
```powershell
# Criar ponto de restauração do Windows
Create-Cmo -Description "Backup antes da otimização"

# Copiar arquivos pessoais
Copy-Item C:\Users\Public\*.\backup-pessoal\

# Imagem de sistema (opcional)
systemimage -export C:\backup-sistema.vhd
```

---

## 🌐 Recursos Adicionais

### Documentação Completa
- [Guia de Ajustes](docs/docs/tweaks/index.md) - Todos os ajustes disponíveis
- [Configuração do Sistema](docs/docs/apps.md) - Configurações avançadas
- [Limpador](docs/docs/cleaner.md) - Ferramentas de limpeza
- [Utilitários](docs/docs/utilities.md) - Ferramentas do sistema

### Contribuição
1. **Reportar bugs:** Abra uma ISSUE no GitHub
2. **Sugerir melhorias:** Crie uma FEATURE REQUEST
3. **Melhorar documentação:** Edite os arquivos do `mkdocs`
4. **Contribua com código:** Envie um PR para o repositório

### Licença
```text
© 2025 ChibangaRx (by chibangar)
Todos os direitos reservados.

Distribuído nos termos da licença GPL-V3.
```

---

## 📞 Suporte e Contacto

- 🔗 **GitHub:** https://github.com/chibangar/chibangarx
- 🌐 **Website:** https://chibangarx.github.io (em breve)
- 💬 **ISSUES:** Abra issue no repositório do GitHub

---

<div align="center" style="margin-top: 2rem;">

### ✨ Obrigado por usar ChibangaRx!

**Feito com amor em Portugal, para Windows Users que amam performance!** ⚡🇵🇹

Made with ❤️ by **chibangar** | Open Source | GPL-V3

</div>
