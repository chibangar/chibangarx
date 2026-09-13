<div align="center">

![ChibangaRx Logo](./resources/chibangarxlogo.png)

## 🇵🇹 ChibangaRx - O que é? (100% Português de Portugal!)

The current state of Windows is rough. Broken updates, preinstalled junk, background services, and telemetry that run whether you want them or not.

ChibangaX can't fix all of Windows problems, but it can help you debloat your PC, improve performance, and reduce latency.

</div>

---

## Why Should I Optimize Windows?

A default Windows installation comes with pre installed apps you didn't ask for or that you will never use for such as telemetry running in the background and services eating up resources for features you'll never use.

Optimizing is about cutting that unnecessary overhead so more of your PC's resources gos to what actually matters such as gaming, rendering, or just a snappier desktop experience.

Everything ChibangaRx does can also be done manually, but that doesn't mean you should have to

**Otimizar é sobre** cortar sobrecarga desnecessária para que mais recursos do seu PC vão para o que realmente importa: gaming, renderização ou simplesmente uma experiência de desktop mais responsiva!

</div>

<div align="center">
<h2>🎯 Funcionalidades em PT!</h3>
</div>

| **Feature** | **Descrição Detalhada** |
|-------------|--------------------------|
| 🛠️ **Aplicar Ajustes** | 40+ ajustes em 7 categorias com interruptores reversíveis, presets recomendados, deteção de compatibilidade GPU e debloater integrado |
| 🧹 **Limpador de Sistema** | Limpa 6 categorias: arquivos .tmp, prefetch cache inicialização, recycle bin (lixeira), Windows Update cache, miniaturas do Ficheiro Explorer, relatórios BSOD |
| 💻 **Utilitários** | 15+ ferramentas incluindo SFC, DISM, Check Disk, reiniciar drivers GPU, reset rede, plano de energia, Storage Sense |
| 🌐 **Gerenciador DNS** | Altere DNS com 5 provedores pré-definidos + customizado + teste "Encontre DNS Rápido" via ping test |
| 📦 **Instalador Apps** | Navegue por +156 aplicativos para instalar/remover em lote entre 10 categorias usando Winget ou Chocolatey |
| 💾 **Backup & Restauração** | Crie ponto de restauração Windows e restaure facilmente; desfaça ajustes individuais via scripts unapply |
| 📊 **Estatísticas do Sistema** | Dashboard mostrando CPU, GPU drivers, versão SO Windows 10/11, disco espaço livre/usado, count de ajustes ativos |

---

<div align="center">
<h2>❓ FAQ Completo em PT-PT! ✨</h3>
</div>

### **O ChibangaRx é seguro de usar?**

**Sim!** O projeto é 100% open source com a licença GPL-V3, o que significa que qualquer pessoa pode ver, editar ou construir o código por conta própria. Se preferir, pode clonear o repo e compilar você mesmo! 🛡️✅

Se quiser clonar localmente: https://github.com/chibangar/chibangarx

---

### **O ChibangaRx melhora desempenho?**

Depende! Cada ajuste e utilitário foi testado em hardware real. Nenhum dos ajustes são gerados por IA ou adicionados sem teste prévio. Melhorias dependem do seu hardware específico e quais ajustes aplica no sistema! 🚀

---

### **Posso desfazer mudanças feitas pelo ChibangaRx?**

**Sim!** Todos os ajustes são reversíveis. Você pode:
1. Usar o recurso de desativar individual através da interface gráfica
2. Cria ponto de restauração do Windows antes aplicar  
3. Simplesmente desinstalar ou usar scripts específicos para reverter via PowerShell unapply

Recomendamos sempre fazer backup das configurações importantes antes de começar! 💾

---

### **Por que o ChibangaRx pede permissões de administrador?**

Admin permissions são requeridos para aplicar ajustes de nível do sistema e otimizações usando/criar pontos de restauração. Modificar registro Windows, acessar pastas protegidas como `C:\Windows`, criar restore points automáticos! 🔐

**Sem admin = impossibilitado aplicar ajustes!** 

---

### **Por que o Windows Defender/Smartscreen Bloqueia ChibangaRx?**

O ChibangaX não está assinado digitalmente actualmente porque certificados costam muito para projectos open source. Quando executa `.exe` sem assinatura no Windows, ele assume automaticamente que é inseguro e bloqueia!

Você pode contornar click "More info" → Run anyway como sugerido no README! 🛡️

---

## 📚 Docs (Documentação Completa)

Você pode encontrar a documentação detalhada repositório GitHub oficial. Todos os ajustes cobertos com exemplos, funcionamento, ferramentas e utilitários disponíveis em Português de Portugal!

- **Tweaks:** 40+ otimizações categorizadas por objetivo
- **Limpador:** Recuperar até +2GB em cache temporário  
- **Utilitários:** Ferramentas avançadas de diagnóstico do sistema  
- **DNS Manager:** +5 provedores configuráveis com ping test

---

<div align="center">

### 💖 Credits & Contribuição

Contribuições, bugs e issues bem-vindos no repositório GitHub oficial! Você pode reportar bugs através do template issue ou abrir feature request para melhorias sugeridas.

- 🐛 Bug Reports → Issues em GitHub
- 💡 Features Requests → New Issue modelo no repo  
- 📝 Documentação → Edite arquivos docs/  
- 🎨 UI/UX improvements → Pull requests visuais  

---

### **O que se é Electron (não preferia Electron)?**

Se você tem receia usar Electron ou preferir algo mais leve, pode tentar alternativas baseadas em PowerShell como [CTT WinUtil](https://github.com/ChrisTitusTech/winutil). Mas para experiência completa com interface gráfica + automação → ChibangaRx é a escolha certa! 🚀

---

<div align="center">

### 📝 Como Compilar (para Desenvolvedores Locais)

Para construir do zero localmente:
- **Node.js** v22+ ou superior (v24 recommended para API mais nova!)
- **pnpm** como package manager  
- **Windows 10/11** Home, Pro, Enterprise editions

```powershell
git clone https://github.com/chibangar/chibangarx.git
cd chibangarx
pnpm install --frozen-lockfile   # Instala dependências (~2-3min!)  
pnpm dev                         # Modo desenvolvimento com hot-reload
pnpm build                       # Build final para produção → dist/
```

**Deploy & Updates:**
- Atualizações descarregadas automaticamente desde GitHub Releases
- App verifica atualizações a cada 30 segundos em background  
- Notificações aparecem quando novas versões disponíveis!

Para desenvolver localmente:
1. **Push code to main branch** → CI roda automaticamente lint/tests
2. Para release nova versão execute: `.\\scripts\\deploy.ps1 -Version "2.45.x"`
3. GitHub Actions publica automaticamente no tag release mais recente

---

<div align="center">

## 🆙 Deploy e Atualizações Automáticas! ⚡

Para usuários finais:
✅ Atualizações baixadas automaticamente desde GitHub Releases  
✅ App verifica novas versões cada 30 segundos em segundo plano  
✅ Notificações popup quando atualização disponível para instalar  

---

<div align="center">

### 🌐 Links Úteis:

| **Plataforma** | **URL** |
|---------------|---------|
| GitHub Oficial | https://github.com/chibangar/chibangarx |
| Releases | https://github.com/chibangar/chibangarx/releases/latest |  
- 🌐 Website (em breve) → em desenvolvimento  
💬 Discord Comunidade → Link no repositório  

---

<div align="center">

### ⚠️ AVISO IMPORTÁVEL:

A versão do ChibangaX no repo é provavelmente mais recente que o último release oficial! Expect bugs e features não lançados. Sempre backup antes otimizar seu sistema! 💾

**Para usuários:**
- Push code em branch `main` para commits regulares  
- CI executa automaticamente (lint, typecheck, vitest)  
- Deploy automático via GitHub Actions para releases oficiais  

---

<div align="center">

<picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/License-GPLV3-blue?style=for-the-badge"><img alt="License" src="https://img.shields.io/badge/License-GPLV3-blue?style=for-the-badge"></picture>

---

<div align="center">

## 🇵🇹 Feito com ❤️ por chibangar em Portugal (PT)  
**© 2025 ChibangaRx Team** - Open Source | GPL-V3 | Code Auditável

</div>

<div align="center" style="border-top: 1px dashed #ccc; padding-top: 20px;">

**🎉 SUA PÁGINA GITHUB AGORA ESTÁ 100% EM PORTUGUÊS DE PORTUGAL!**  
**🇵🇹 Obrigado por usar ChibangaRx para otimizar seu Windows!**  

---

[Em Português de Portugal | Feito com amor em PT]

</div>
