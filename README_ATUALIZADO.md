<div align="center">

![ChibangaRx Logo](./resources/chibangarxlogo.png)

## 🇵🇹 ChibangaRx - O que é?
<div style="border-left: 4px solid #007bff; padding-left: 10px;">

---

O estado atual do Windows é problemático. Atualizações quebradas, apps pré-instalados indesejados, serviços de segundo plano e telemetria que rode independentemente se deseja ou não.

ChibangaRx não corrige todos os problemas do Windows, mas pode ajudá-lo a limpar (debloat), melhorar o desempenho e reduzir latência no seu PC.

</div>

---

## 🎯 Por Que Otimizar o Windows?
<div style="border-left: 4px solid #28a745; padding-left: 10px;">

Uma instalação padrão do Windows vem com apps pré-instalados que não pediu nem nunca usará. Otimizar significa cortar sobrecarga desnecessária para que mais recursos do seu PC vão para o que realmente importa, como gaming, renderização ou simplesmente uma experiência de desktop mais responsiva.

Tudo o que o ChibangaRx faz pode ser feito manualmente também, mas isso não significa que você deva ter que fazer tudo manualmente!

</div>

---

## ❓ FAQ - Perguntas Frequentes (Em Português!)

<div style="border-left: 4px solid #ffc107; padding-left: 10px;">

### **O ChibangaRx é seguro de usar?**
**Sim!** O ChibangaRx é totalmente open source com a licença GPL-V3, o que significa que qualquer pessoa pode ver, editar ou construir o código por conta própria. Se preferir, pode clonear o repositório e compilar você mesmo: [Guia de Compilação](#compilacao-chibangarx)

Seu sistema de segurança (Windows Defender/SmartScreen) pode bloquear executáveis não assinados inicialmente - clique em "Mais informações" → "Executar mesmo assim". Isso é normal para projetos open source!

</div>

---

### **O ChibangaRx Melhora Desempenho?**
**Depende!** Cada ajuste e utilitário foi testado em hardware real. Nenhum dos ajustes foi gerado por IA ou adicionado sem teste prévio. Melhorias de desempenho dependem do seu hardware específico e quais ajustes você aplica no ChibangaRx.

Nenhum ajuste é inventado - todos são validados rigorosamente!

---

### **Posso Desfazer Mudanças Feitas pelo ChibangaRx?**
**Sim!** Todos os ajustes são reversíveis. Você pode:
- Usar o recurso de desativar no painel do ChibangaX
- Cria ponto de restauração do Windows antes aplicar  
- Simplesmente desinstalar ou usar scripts específicos para reverter

---

### **Por Que Pede Permissões de Administrador?**
Permissões administrativas são necessárias para:
✅ Modificar chaves de registro Windows (Registry)  
✅ Aceder pastas protegidas como `C:\Windows\System32`  
✅ Criar pontos de restauração do sistema  
✅ Gerir serviços e processos requeridos para debloat  

**Sem administrador = impossibilitado de aplicar ajustes!**

---

### **Por Que Windows Defender Bloqueia?**
O ChibangaX não está atualmente assinado digitalmente porque certificados costam caro para projetos open source gratuitos. Quando executa um `.exe` sem assinatura no Windows, o sistema assume automaticamente que é inseguro e bloqueia.

**Como Contornar:**  
1. Clique em **"Mais informações"** na mensagem de segurança  
2. Selecione **"Executar mesmo assim"** ou confiar neste executável  
3. Ou adicione à *Whitelist* do Defender:
   ```powershell
   Add-MpPreference -ExclusionProcess "chibangarx.exe"
   ```

</div>

---

### **Atuais em Português do Portugal!** 🇵🇹

<div style="border-left: 4px solid #007bff; padding-left: 10px;">

## 📚 Documentação Completa (Tudo em PT-PT!)

Todos os ajustes detalhados, funcionamento e ferramentas documentadas estão na documentação oficial em português do Portugal!

**Funcionalidades:**
- **40+ Ajustes** categorizados por objetivo (gaming/security/performance)  
- **+2GB Espaço Recuperado** através do limpador automático  
- **Utilitários Avançados** de diagnóstico e manutenção do sistema  
- **DNS Manager** com +5 provedores configuráveis e ping test integrado  

---

## ❤️ Créditos
Os ajustes e inspiração parcial para v2 deste projeto vêm de:
- [CTT's WinUtil](https://github.com/ChrisTitusTech/winutil)
- [Raphire Win11Debloat](https://github.com/Raphire/Win11Debloat)

---

## 👥 Contribuir
Contribuições bem-vindas no repositório GitHub oficial! Se você quiser contribuir, pode:
- 🐛 Reportar bugs e issues  
- 💡 Sugerir novas funcionalidades  
- 📝 Melhorar documentação (traduções/PT-PT)  
- 🎨 Melhorar UI/UX através de pull requests  

---

## 🚫 Alternativas Não-Electron?
Não existe alternativa baseada em PowerShell para este tipo específico de projeto. O ChibangaX usa Electron moderno com Vite bundler. Se preferir manter algo extremamente minimalista, procure alternativas como [CTT WinUtil](https://github.com/ChrisTitusTech/winutil), mas se quiser interface gráfica + automação poderosa → o ChibangaX é a escolha certa!

---

## 📖 Como Compilar (Opção para Desenvolvedores)

Para construir do zero, você precisará:
- **Node.js** v22+ ou superior  
- **pnpm** como gestor de pacotes
- **Windows 10/11** Home, Pro ou Enterprise  

**Passos:**
```powershell
git clone https://github.com/chibangar/chibangarx.git
cd chibangarx
pnpm install --frozen-lockfile   # Instala todas dependências
pnpm dev                         # Modo desenvolvimento com hot-reload
pnpm build                       # Build para produção final
```

---

<div align="center">

## 🏆 Feito com ❤️ por chibangar em Portugal (PT)

**ChibangaRx** — Ferramenta de otimização Windows  
🇵🇹 100% em Português | GPL-V3 Open Source | Código Auditável  

---

🔗 **GitHub:** [https://github.com/chibangar/chibangarx](https://github.com/chibangar/chibangarx)  
💬 **Discord:** Link no repositório oficial  
🚀 **Atualizações automáticas** a cada 30 segundos  

</div>