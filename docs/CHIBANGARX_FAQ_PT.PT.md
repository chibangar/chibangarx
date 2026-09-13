# ❓ FAQ - Perguntas Frequentes (Português Portugal)

<div align="center">

![ChibangarX Logo](./resources/chibangarxlogo.png)

</div>

---

## 📋 Perguntas mais comuns sobre ChibangaRx

### **P: O que é o ChibangaRx?**  
**R:** Uma aplicação Windows gratuita e open source (GPL-V3) para limpar, otimizar e melhorar o desempenho do seu PC Windows. Ajuda a "debloat" (eliminar telemetria e apps pré-instalados indesejados) e liberar recursos do sistema.

---

### **P: O ChibangaRx é seguro de usar?**  
**R:** Sim! O projeto é 100% open source com licença GPL-V3, o que significa que qualquer pessoa tem acesso ao código para verificar e inspecionar como as coisas funcionam. Nada dos "ajustes" foi criado por IA a cegadas; tudo foi testado em hardware real. Se preferir não usar, pode procurar alternativas: [CTT WinUtil (PowerShell-based)](https://github.com/ChrisTitusTech/winutil) é uma opção alternativa leve.

---

### **P: O ChibangaRx melhora o desempenho?**  
**R:** Depende. Cada ajuste foi testado em hardware real e nenhum é desligado sem validação prévia. Melhorias de desempenho dependem do seu hardware e do que aplicar no ChibangaRx. Alguns usuários relatam FPS mais altos em jogos, tempos de boot reduzidos e sistema mais responsivo após debloat. Se tiver dúvidas sobre um ajuste específico, abra uma ISSUE no GitHub para discutirmos!

---

### **P: Posso desfazer mudanças feitas pelo ChibangaRx?**  
**R:** Sim, absolutamente! Todos os ajustes são reversíveis. Você pode usar o recurso de desligar individual (ou todos) através da interface gráfica, criar ponto de restauração do Windows antes de aplicar, ou simplesmente desinstalar o programa e reverter manualmente se algo der erro. Recomendamos sempre fazer backup das configurações importantes antes de começar!

---

### **P: Por que o ChibangaRx pede permissões de administrador?**  
**R:** Permissões administrador são necessárias para:
- Modificar chave de registro do Windows (Registry)
- Aceder pastas protegidas como `C:\Windows`, `HKEY_LOCAL_MACHINE\SOFTWARE`
- Criar pontos de restauração do sistema
- Gerir serviços e processos do sistema

**Sem administrador = impossível alterar configurações do sistema.**

---

### **P: Por que o Windows Defender/SmarthScreen bloqueia o ChibangaRx?**  
**R:** O ChibangaRx não está assinado actualmente porque projectos open source têm custos altos em certificados digitais. Quando executa um arquivo `.exe` sem assinatura no Windows, ele assume automaticamente que é inseguro e bloqueia.

#### **Como contornar:**
1. Receba mensagem de "Windows Defender bloqueou" → Clique em **"Mais informações"** → **"Executar mesmo assim"**
2. Ou adicione ao Whitelist do Defender:
   ```powershell
   Add-MpPreference -ExclusionPath C:\Users\$env:LOCALAPPDATA\Chibangarx
   Add-MpPreference -ExclusionProcess chibangaRx.exe
   ```

---

### **P: As configurações aplicadas persistem após reiniciar?**  
**R:** Sim, todas as alterações feitas ao registro/serviços/registry persistem indefinidamente sem reexecução necessária. Quando desinstalado por completo, tudo se reverte automaticamente. Recomendamos fazer backup periódico para segurança!

---

### **P: Funciona no Windows 7/8?**  
**R:** O ChibangaRx foi desenvolvido e testado principalmente em **Windows 10/11 (versões Home, Pro, Enterprise)**. Suporte limitado a Windows 7/8 pode não ser garantido devido a APIs mais antigas ou incompatibilidades com Electron moderno. Teste no Windows 11 para melhor desempenho!

---

### **P: O ChibangaRx remove apps pré-instalados do Windows?**  
**R:** Algumas funcionalidades desligam apps em segundo plano, mas não necessariamente eliminam completamente do sistema. A opção de "Debloat/Desbloat" removem certas apps pré-instaladas como **Cortana, XboxApp, Phone app, Skype** etc. Recomendamos backup antes de debloatar completo para permitir restauração fácil com ponto de restauração!

---

### **P: Posso usar ChibangaRx se já uso outras ferramentas como Bleach Bit, Winaero Tweaker?**  
**R:** Sim, você pode, mas alguns ajustes podem interferar entre si. Recomendamos começar pelo ChibangaRx básico (ajustes essenciais) e adicionar gradualmente apenas o que realmente precisa sem debloat total para evitar conflitos imprevisíveis!

---

### **P: Como saber se meus jogos correrão melhor com os ajustes?**  
**R:**
1. Teste em PC limpo Windows "out da caixa" antes de aplicar ajustes
2. Aplique ajustes gradualmente por categoria monitorizando impacto
3. Use ferramenta de benchmark como `3DMark` ou `GamingBenchMark` para medir ganho de FPS
4. Verifique temperaturas CPU/GPU mais baixas com plano de energia ajustado

---

### **P: O debloater remove drivers essenciais?**  
**R:** **Não!** O ChibangaRx apenas altera configurações e desabilita telemetria/aplicações não utilizadas. Não toca em hardware/drivers essenciais como **Intel®, NVIDIA®, AMD®** ou chips de rede sem consentimento explícito. Sempre crie backup antes de debloatar para garantir reversibilidade fácil via ponto de restauração!

---

### **P: Posso executar ChibangaRx como usuário comum (não administrador)?**  
**R:** Pode, mas permissões limitadas significam que não poderá aplicar ajustes ou criar pontos de restauração. Execute sempre como **Administrador** para funcionalidades completas do programa!

---

### **P: O ChibangaRx envia meus dados para servidores externos?**  
**R:** Não, o projeto segue GPL-V3 e é open source com todas as modificações públicas no GitHub. Nada é enviado sem necessidade - apenas logs locais para depuração são mantidos em `logs/chibangarx.log`.

---

### **P: Quanto espaço de disco é necessário para rodar ChibangaRx?**  
**R:** Aproximadamente **10-20 GB** para instalador completo com todos os módulos incluídos. Espaço pode variar dependendo se incluir/deixar exclusões como `node_modules`, scripts, recursos e imagens em cache dos builds locais!

---

### **P: Como atualizar o ChibangaRx?**  
**R:**
- **Versão local:** Clone repositório com `git pull origin main` para baixar últimas alterações
- **Instalador oficial:** Descarregue release mais recente da página de releases do GitHub
- Ou use script auto-updater se incluído em build!

---

### **P: Quais sistemas operacionais estão suportados?**  
**R:**
- ✅ Windows 10 (Home/Pro/Enterprise) - Testado e verificado
- ✅ Windows 11 (Home/Pro/Enterprise) - Recomendação principal para melhor desempenho
- ⚠️ Windows 8/8.1 - Compatibilidade limitada sem garantia
- ❌ Windows 7/Server - Suporte não oferecido

---

### **P: Posso contribuir com o projeto?**  
**R:** Completamente! Consulte [Guia de Contribuição](https://raw.githubusercontent.com/chibangar/chibangarx/main/docs/docs/contributing.md) para detalhes. Sugestões de ajustes, traduções (Português BR/PT), documentação ou correção de bugs bem-vindos no repositório GitHub!

---

### **P: O que é "debloat" vs "unbloat"?**  
**R:**
- **Debloat =** Processo de remover telemetria, apps não utilizadas e serviços desnecessários para melhorar performance/security
- **Unbloat =** Processo reverso: adicionar apps/remove debloat. Em ChibangaRx use-se ambos conforme preferência (aplicar/remover ajustes)!

---

### **P: Por que alguns usuários veem ganhos de desempenho maiores do que outros?**  
**R:** Depende de:
- Hardware base (laptop gamer vs PC desktop empresarial)
- Quantos ajustes são aplicados/ativados
- Estado inicial do sistema antes da otimização
- Drivers/firmware atualizados para hardware específico

---

### **P: Como reportar um bug?**  
**R:**
1. Vá até [GitHub Issues - https://github.com/chibangar/chibangarx/issues](https://github.com/chibangar/chibangarx/issues)
2. Clique em **"New issue"** no canto superior direito
3. Escreva título descrito e reproduza problema
4. Forneça passo a passo, capturas de tela, logs se necessário

---

### **P: Posso compilar o instalador do Windows por conta própria?**  
**R:** Sim! Siga [guia de desenvolvimento no GitHub](https://raw.githubusercontent.com/chibangar/chibangarx/main/DEPLOY.md) para construir releases manualmente com `pnpm build && electron-builder`.

---

### **P: O que é "Telemetria" e por que desligar?**  
**R:**
- **Telemetria =** Dados do sistema que o Windows coleta e envia para servidores Microsoft/análise do Azure AI
- **Motivo Desligar =** Privacidade (dados pessoais/sistema enviados sem consentimento explícito) + overhead de desempenho em segundo plano
- Como desativar: Use ajustes "Disable Windows Telemetry" no ChibangaRx!

---

### **P: O cache do DNS realmente faz diferença?**  
**R:** Sim, purge de cache DNS pode reduzir latência para sites e resolver casos específicos onde DNS cache corrompido causa lentidão ou erros DNS 54. Use módulo Gerenciador DNS com opção "Purge Cache" periodicamente após configurações alteradas via DHCP/Router!

---

### **P: Funciona online/offline?**  
**R:** ChibangaRx requer conexão para funcionalidades como verificar atualizações, ver versão mais recente na primeira execução e funcionalidades de instalador remoto. Após configuração básica, pode ser usado offline completamente!

---

<div align="center">

### 📧 Tem mais perguntas?

[Abra uma ISSUE no GitHub](https://github.com/chibangar/chibangarx/issues) → Respostas em até 24-48 horas (sexta a terça-feira)!

**Ou contribua para melhorar!**  
Sugestão ou ajuste de código bem-vindos!  

---

[Em PT-PT | por chibangar © GPL-V3](https://github.com/chibangar)

</div>

---

**Versão**: 2.45.15 - Última atualização: 13 Setembro 2026  
**Página de FAQ em**: Português do Portugal (PortUGPT) | [Em PT-PT, não BR]
