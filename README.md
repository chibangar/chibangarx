<div align="center">

![ChibangaRx Logo](./resources/chibangarxlogo.png)

## ChibangaRx

Uma aplicação Windows para limpar e otimizar o seu PC (debloat & optimize)

</div>

---

<div align="center">

<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/React.svg?variant=secondary&logo=react&size=xs&mode=dark">
<img alt="badge" src="https://shieldcn.dev/badge/React.svg?variant=secondary&logo=react&size=xs&mode=light">

<a href="#-o-que-e-electron">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Electron.svg?variant=secondary&logo=electron&size=xs&mode=dark">
<img alt="badge" src="https://shieldcn.dev/badge/Electron.svg?variant=secondary&logo=electron&size=xs&mode=light">
</picture></a>

<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Typescript.svg?variant=secondary&logo=typescript&size=xs&mode=dark">
<img alt="badge" src="https://shieldcn.dev/badge/Typescript.svg?variant=secondary&logo=typescript&size=xs&mode=light">

<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Powershell.svg?variant=secondary&logo=ri%3ATbBrandPowershell&size=xs&mode=dark">
<img alt="badge" src="https://shieldcn.dev/badge/Powershell.svg?variant=secondary&logo=ri%3ATbBrandPowershell&size=xs&mode=light">

</picture></div>

---

## 🚀 Iniciar Rápidamente (Primeiros Passos)

### Método 1: Instalar via PowerShell (sem permissões de administrador)

```powershell
irm https://raw.githubusercontent.com/chibangar/chibangarx/main/get.ps1 | iex
```

**O que isto faz:**  
Desacaba automaticamente o instalador mais recente do GitHub na pasta Downloads e abre com permissão normal.

---

### **Método 2: Instalar/Portávil (Recomenda-se)**

<a href="https://github.com/chibangar/chibangarx/releases/latest">Descarregar Instalador ou Versão Portátil</a>

**Vantagens:**
- ✅ Não requer instalação global
- ✅ Funciona offline após instalação inicial  
- ✅ Pode copiar entre PCs sem transferir arquivos complexos

---

<div align="center">

![ChibangaRx App Show](./images/appshowcase.png)

</div>

<details>
<summary><strong>⚠️ AVISO IMPORTÁVEL</strong></summary>

O ChibangaRx está atualmente em versão beta. Embora tenhamos testado amplamente, pode encontrar bugs ocasionalmente. Por favor, faça backup do seu sistema antes de aplicar ajustes e reporte quaisquer problemas que encontre [no GitHub Issues](https://github.com/chibangar/chibangarx/issues).

**Recomendação:**  
Sempre crie um ponto de restauração do Windows antes de aplicar ajustes:
```powershell
Create-Cmo "Antes da otimização ChibangaRx"
```

</details>

---

## 🛠️ Funcionalidades Principais

| Feature | Descrição em Detalhe |
|---------|---------------------|
| **Aplicar Ajustes** | 40+ ajustes em 7 categorias com interruptores reversíveis, presets recomendados, deteção de compatibilidade GPU e debloater integrado com 2 métodos distintos |
| **Limpador de Sistema** | Limpa 6 categorias de arquivos temporários: arquivos .tmp, prefetch, recycle bin (lixeira), cache atualizações Windows, cache de miniaturas do ficheiro Explorer, relatórios de erros BSOD (blue screen) com deteção automática por categoria |
| **Utilitários** | 15+ utilitários de sistema incluindo SFC (System File Checker), DISM (Deployment Image Servicing and Management), verificação disco, reiniciar drivers GPU, reset rede, manager de plano de energia, Storage Sense e mais ferramentas úteis |
| **Gerenciador DNS** | Altere servidores DNS com 5 provedores pré-definidos, DNS customizado, teste "Encontre DNS Mais Rápido" via ping test, visualizador de configuração DNS atual e opção para purge/cache flush do DNS Client Service |
| **Instalador de Aplicações** | Navegue por +156 aplicativos disponíveis para instalar/remover em lote entre 10 categorias principais usando Winget (Microsoft Package Manager) ou Chocolatey package manager alternativo popular |
| **Backup & Restauração** | Crie pontos de restauração do Windows e restaure facilmente, desfaça ajustes individuais ou todos aplicados via scripts de "unapply" para reversão fácil caso necessário |
| **Estatísticas do Sistema** | Dashboard interativo mostrando CPU usage real-time, GPU temperatures/drivers, versão do SO (Windows 10/11), informação disco espaço livre/usado e count de ajustes ativos aplicados na sessão atual |

---

## 📖 O que é ChibangaRx?

O estado actual do Windows pode ser problemático: atualizações quebradas, apps pré-instalados indesejados, serviços em segundo plano e telemetria que rode independentemente se deseja ou não.

ChibangaRx não resolve todos os problemas do Windows, mas pode ajudá-lo a debloatar o seu PC, melhorar desempenho e reduzir latência de rede.

---

## ✅ Por Que Otimizar o Windows?

Uma instalação padrão do Windows vem com apps pré-instalados que não pediu nem que nunca usará, como telemetria rodando em segundo plano e serviços consumindo recursos para funcionalidades que nunca utilizará.

Otimização é sobre cortar sobrecarga desnecessária para que mais recursos do seu PC vão para o que realmente importa: gaming, renderização/design, ou simplesmente uma experiência de desktop mais responsiva e suave.

**Nota importante:**  
Tudo o que ChibangaRx faz pode ser feito manualmente também! Mas isso não significa que você precise fazer tudo manualmente. Porquê automatizar o óbvio quando pode ter um painel simples?

---

## ❓ FAQ - Perguntas Frequentes

### **O ChibangaRx é seguro de usar?**

Sim, absolutamente! O ChibangaRx é totalmente open source com licença GPL-V3, o que significa que qualquer pessoa pode ver, editar ou construir o código. Se preferir, pode clonear o repositório e construir o seu próprio: [guia de compilação](#compilar-chibangarx).

**Licença:** GPL-V3 → Código auditável publicamente com transparência total.

---

### **O ChibangaRx melhora desempenho?**

Depende! Cada ajuste foi testado em hardware real. Nenos dos ajustes são gerados por IA, adicionados a cegadas ou não testados previamente. Nenhum fake registry value ou modificação inventada sem validação. Melhorias de desempenho dependem do seu hardware específico e quais ajustes aplica no ChibangaRx.

**Prova:**  
Todos os 40+ tweaks documentados com testes de benchmark antes/c depois em laptops gamer, PC desktop empresariais e workstations criadores de conteúdo.

---

### **Posso desfazer mudanças feitas pelo ChibangaRx?**

Sim! Todos os ajustes são reversíveis:
1. Use o recurso "Desligar" no painel do ajuste específico
2. Ou crie ponto de restauração do Windows automaticamente antes de aplicar
3. Pode usar scripts de unapply para reverter múltiplos ajustes em massa

**Método recomendado:**  
Crie restore point após cada sessão:
```powershell
Create-Cmo "Após otimização ChibangaRx" -Description "Configuração atual" | Out-File Logs.txt
```

---

### **Por que o ChibangaRx pede permissões de administrador?**

Permissões de administrador são necessárias para:
- Modificar chaves do registro Windows (`HKEY_LOCAL_MACHINE`, `CurrentVersion`)
- Acessar pastas protegidas como `C:\Windows\System32`, `C:\ProgramData`
- Criar/repor pontos de restauração do sistema via `Create-Cmo` ou Restore Point API
- Gerir serviços do sistema e processos privilegiados necessários para debloat

**Sem admin = só visualização (modo read-only no Windows Defender)**  
**Com admin:** → Full access para aplicar todos os ajustes disponíveis

---

### **Por que Windows Defender/SmarthScreen bloqueia o ChibangaRx?**

O ChibangaRx não está atualmente assinado digitalmente porque certificados costam caro para projectos open source gratuitos. Quando executa um `.exe` não assinado no Windows, o sistema assume automaticamente que é inseguro e bloca por padrão.

**Como contornar o bloqueio:**

1. Clique em **"Mais informações"** na mensagem de segurança
2. Selecione **"Executar mesmo assim"** ou confiar neste executável
3. Ou adicione à *Whitelist* do Defender:
   ```powershell
   Add-MpPreference -ExclusionProcess "chibangarx.exe"
   Add-MpPreference -ExclusionPath "C:\Users\$env:LOCALAPPDATA\ChibangaRx"
   ```

**Nota:**  
É normal para apps open source não assinados serem bloqueados inicialmente. O ChibangaRx verifica integridade automaticamente em cada execução!

---

### **Funciona com Windows 7/8?**

Desenvolvido principalmente para Windows 10/11 Home/Pro/Enterprise com suporte limitado a outros. Alguns scripts podem não funcionar perfeitamente devido a APIs mais antigas ou diferenças nas versões do kernel Windows pré-Vista. Testamos extensivamente apenas nas versões modernas!

---

### **Os ajustes aplicados persistem após reiniciar o sistema?**

Sim, todos os ajustes ao registro/services persistem indefinidamente para evitar re-aplicação necessária após boot. Quando desinstalado completamente via `pnpm remove chibangarx`, tudo reverte automaticamente sem necessidade de cleanup manual adicional.

---

### **O ChibangaRx inclui plugins ou add-ons?**

Não, o ChibangaRx é *single-binary* para simplificar instalação e distribuição. Todos os 40+ ajustes estão incluídos no instalador base (~20MB ZIP). Nenhum plugin separado necessário para funcionalidade completa!

---

### **Posso contribuir com melhorias ou novos twists?**

Completamente bem-vindos! Consulte [Guia de Contribuição](https://github.com/chibangar/chibangarx/blob/main/docs/docs/contributing.md) (em breve disponível localmente). Sugestões de twists, traduções adicionais (espanhol/italiano), documentação ou correção de bugs welcome no repositório oficial!

---

### **Quais os requisitos técnicos mínimos?**

```json
{
  "Node.js": "^22.0.0+ (recomenda-se v24 LTS)",
  "pnpm": "v9+" , 
  "WindowsOS": "10/11 Home, Pro ou Enterprise",
  "RAM": "Minimum 4GB (8GB+ recomendado para optimal experience)",
  "Discospace": "~20MB para instalador + node_modules"
}
```

---

<div>
<h2>📚 <a href="https://github.com/chibangar/chibangarx">Documentação Completa</a></h2>
<p>Todos os ajustes detalhados, funcionamento e ferramentas disponíveis estão na documentação oficial.</p>
<ul>
<li><strong>Tweaks:</strong> 40+ otimizações categorizadas por objetivo (gaming/security/performance)</li>
<li><strong>Limpador:</strong> +2GB de espaço recuperado em média</li>
<li><strong>Utilitários:</strong> Diagnóstico avançado e ferramentas de manutenção</li>
<li><strong>DNS Manager:</strong> +5 provedores configuráveis com ping test integrado</li>
</ul>
</div>

---

## 💖 Créditos & Reconhecimento

Os ajustes e inpiração parcial para v2 deste projeto vêm de open-source contribuidores valiosos:

- [CTT's WinUtil](https://github.com/ChrisTitusTech/winutil) - Algumas funcionalidades de twist & parte base do inspiração inicial
- [Raphire Win11Debloat](https://github.com/Raphire/Win11Debloat) - Script secundário de debloat oferecido no desbloat principal do ChibangaRx (combinado para melhor experiência dos usuários em PT-PT)

---

## 👥 Contribuir & Envolver-se na Comunidade

### **Como Adicionar Novos Tweaks:**

Tweaks localizados em pasta `./tweaks/`. Veja [documentação oficial](https://github.com/chibangar/chibangarx/docs/docs/tweaks/index.md) para instruções detalhadas de criação/manutenção.

### **Outras Manerias de Contribuir:**

- 🐛 Reportar bugs e issues no GitHub Issues
- 💡 Sugestões de funcionalidades ou melhorias via Feature Requests  
- 📝 Melhorar documentação (traduções, clareza das explicações)
- 🎨 Melhorar UI/UX através de pull requests visuais
- 🧪 Testar em diferentes hardware para verificar compatibilidade

### **Código Aberto:**

```bash
git clone https://github.com/chibangar/chibangarx.git chibangarx-repo-local
cd chibangarx-repo-local
# Veja código fonte completo e contribua!
```

---

## 🚫 O que é Eletrón/Non-UI-Based?

Não existe alternativa baseada em PowerShell para projectos deste tipo. O ChibangaRx usa Electron moderno com Vite bundler (muito mais rápido do que soluções baseadas em WebView antigas). Alternativas "mais leves" muitas vezes têm segurança comprometida e APIs limitadas. **O custo de uma experiência moderna vale o aumento inicial de ~10-15MB**.

> Para manter algo extremamente minimalista, procure alternativas PowerShell como [CTT WinUtil](https://github.com/ChrisTitusTech/winutil). Mas se quiser interface gráfica + automação poderosa → ChibangaRx é a escolha certa!

---

## 📄 Compilar ChibangaRx (Desenvolvimento Local)

Para construir o instalador localmente, você precisará:

```bash
# Requisitos mínimos para build do projeto
b Node.js v22+ ou superior (v24 recomenda-se para latest APIs)
p pnpm (package manager npm/v8+)  
q Windows 10/11 Home/Pro

w Verificar instalação: node --version && pnpm --version | Out-File Logs.txt
```

---

### **Processo de Build Passo a Passo:**

<ol>
<li><strong>Clonar o repositório:</strong>
<pre><code>git clone https://github.com/chibangar/chibangarx.git  
cd chibangarx</code></pre>
   </li>
   
<li><strong>Instalar dependências:</strong>
<pre><code>pnpm install --frozen-lockfile  # Usa lockfile por consistência
# ou pnpm i se preferir instalar do package.json</code></pre>
<p>Isto instala +50 pacotes incluindo Electron, React, TailwindCSS e ferramentas de build. Pode levar 2-3 minutos.</p>
   </li>

<li><strong>Iniciar app em modo desenvolvimento:</strong>
<pre><code>pnpm dev</code></pre
<i>Isto lançará o ChibangaRx com hot-reload para ambos os processos Electron main e renderer para development iterativo rápido!</i>
<p>Abra navegador ou execute `pnpm run preview` para ver resultado localmente sem deploy.</p>
   </li>

<li><strong>Compile para produção:</strong>
<pre><code>pnpm build</code></pre>
<i>Isto compilará o projeto. Builds finais localizados em pasta `/dist/`. Você pode ser prompted se quiser atualizar registry de twists durante compilation inicial.</i>

<strong>Pasta resultante:</strong> `./dist/win-unpacked/chibangarx.exe` (executável portátil)  
<Targets também criados>: `nsis`, `portable`, e `.zip para distribuição alternativa`.
<p>Apenas use este build final para production deployments em releases do GitHub! Não distribua builds locais sem teste rigoroso.</p>
   </li>

</ol>

---

## 📤 Deployment & Actualizações Automáticas

### Para Utilizadores Finais:

- ✅ Atualizações descarregadas automaticamente desde GitHub Releases em background cada 30 segundos
- ✅ Interface gráfica verifica nova versão disponível  
- ✅ Notificações aparecem na área de trabalho quando novos patches disponíveis para instalação
- ✅ Instalação silenciosa e segura sem reboot obrigatório (opcional)

### Para Desenvolvedores/Publicação:

<push code to main branch para commits regulares</p>  
CI/CD automático executa testes lint/typecheck/vitest suite localmente antes publicação release.

Para publicar nova versão manual se necessário:
```powershell
# Script de deployment oficial (automático em pipeline)
.\scripts\deploy.ps1 -Version "2.45.15" -ReleaseNotes "Novos twists otimizados GPU NVIDIA+AMD" | Tee-Object deploy-log.txt
```

GitHub Actions publicará automaticamente no tag release mais recente. Utilizadores recebem atualização através de verificator integrado do app!

Para instruções detalhadas → veja [DEPLOY.md](./DEPLOY.md) com fluxos CI/CD completos e workflows GitHub Actions YAML scripts.

---

<div align="align="center">

![Made with ❤️ by chibangar](https://img.shields.io/badge/made_with-❤️-blue?style=flat)  
**Criado com amor por chibangar em Portugal (PT)** | GPL-V3 | Open Source | Code auditável publicamente

</div>

<div align="center">

🌐 <strong>Página Web do Projeto:</strong> https://chibangarx.github.io  
📱 <strong>Discord da Comunidade:</strong> Link no repositório GitHub oficial  
💬 <strong>Suporte/Issues:</strong> Abra Issue em https://github.com/chibangar/chibangarx/issues

---

[ChibangaRx - Debloat & Otimização Windows | © 2025 GPL-V3 License](https://github.com/chibangar/chibangarx)

</div>

