<div align="center">
  <a href="https://github.com/chibangar/chibangarx">
    <img src="./resources/chibangarxlogo.png" alt="ChibangaRx Logo" width="80" height="80">
  </a>

  <h3>ChibangaRx</h3>
  <p>Aplicação Windows para limpar e otimizar o seu PC</p>

  <p>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/React.svg?variant=secondary&amp;logo=react&amp;size=xs&amp;mode=dark"><img alt="badge" src="https://shieldcn.dev/badge/React.svg?variant=secondary&amp;logo=react&amp;size=xs&amp;mode=light"></picture>
   <a href="#-what-if-im-allergic-to-electron"> <picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Electron.svg?variant=secondary&amp;logo=electron&amp;size=xs&amp;mode=dark"><img alt="badge" src="https://shieldcn.dev/badge/Electron.svg?variant=secondary&amp;logo=electron&amp;size=xs&amp;mode=light"></picture></a>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Typescript.svg?variant=secondary&amp;logo=typescript&amp;size=xs&amp;mode=dark"><img alt="badge" src="https://shieldcn.dev/badge/Typescript.svg?variant=secondary&amp;logo=typescript&amp;size=xs&amp;mode=light"></picture>
<picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Powershell.svg?variant=secondary&amp;logo=ri%3ATbBrandPowershell&amp;size=xs&amp;mode=dark"><img alt="badge" src="https://shieldcn.dev/badge/Powershell.svg?variant=secondary&amp;logo=ri%3ATbBrandPowershell&amp;size=xs&amp;mode=light"></picture>
  </p>

## Início Rápido

Instalar via PowerShell (sem administrador), escolher Instalação ou Portátil:

```powershell
irm https://raw.githubusercontent.com/chibangar/chibangarx/main/get.ps1 | iex
```

<a href="https://github.com/chibangar/chibangarx/releases/latest">Baixar Instalador/Portátil</a>

  <br/>
  <br/>

  <img src="./images/appshowcase.png" alt="Captura de Ecrã do ChibangaRx" width="90%">

</div>

  > [!AVISO]
  > O ChibangaRx está atualmente em versão beta. Embora tenhamos testado extensivamente, poderá encontrar alguns bugs. Por favor, faça backup do seu sistema antes de aplicar alterações e reporte quaisquer problemas que encontrar.

  <h3 align="left">Funcionalidades</h3>

| Funcionalidade     | Descrição                                                                                                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aplicar Alterações | 40 alterações em 7 categorias com interruptores reversíveis, presets recomendados, deteção de compatibilidade GPU e um limpador embutido com 2 métodos                    |
| Limpeza do Sistema | Limpar 6 categorias de ficheiros inúteis: ficheiros temporários, prefetch, lixeira, cache do Windows Update, cache de miniaturas e relatórios de erros                        |
| Utilitários        | 15 utilitários de sistema incluindo SFC, DISM, Verificar Disco, reiniciar condutor GPU, resetar rede, gestor de plano de alimentação, Storage Sense e mais                      |
| Gestor DNS         | Alterar DNS com 5 provedores predefinidos, DNS personalizado, teste de ping "Encontrar o DNS mais rápido", visualizador do DNS atual e limpar cache                            |
| Instalador de Apps | Navegar e instalar/desinstalar em lote 156 aplicativos em 10 categorias com <a href="https://learn.microsoft.com/en-us/windows/package-manager/winget/">Winget</a> ou <a href="https://chocolatey.org/">Chocolatey</a> |
| Backup e Reverter  | Criar e restaurar pontos de restauração do Windows, além de desfazer alterações individuais ou todas aplicadas via scripts unapply                                                                              |
| Estatísticas do Sistema | Painel mostrando CPU, GPU, RAM, versão do SO, informações de disco e número ativo de alterações modificadas                                                            |

<h3>O que é o ChibangaRx?</h3>

O estado atual do Windows é complicado. Atualizações com defeito, lixo pré-instalado, serviços em segundo plano e telemetria que funcionam quer queira ou não.

O ChibangaRx não pode resolver todos os problemas do Windows, mas pode ajudar a limpar o seu PC, melhorar o desempenho e reduzir a latência.

<h3>Porque Devo Otimizar o Windows?</h3>

Uma instalação padrão do Windows vem com aplicativos pré-instalados que não pediu ou que nunca usará, como telemetria rodando em segundo plano e serviços consumindo recursos para funcionalidades que nunca usará.

Otimizar é sobre cortar essa sobrecarga desnecessária para que mais dos recursos do seu PC sejam usados no que realmente importa, como jogos, renderização ou simplesmente uma experiência de ambiente de trabalho mais ágil.

Tudo o que o ChibangaRx faz também pode ser feito manualmente, mas isso não significa que você deva ter que fazer isso

# FAQ

### O ChibangaRx é seguro de usar?

Sim. O ChibangaRx é totalmente open source com a licença GPL-V3, o que significa que qualquer pessoa pode visualizar, editar ou construir o código por si mesma. Se preferir, pode clonar o repositório e construir o ChibangaRx por si mesmo leia aqui: <a href="#building-chibangarx">Construir ChibangaRx</a>

### O ChibangaRx melhora o desempenho?

Depende. Todas as alterações e utilitários foram testados em hardware real. Nenhuma das alterações foi gerada por IA, adicionada cegamente ou não testada. Nenhuma das alterações é inventada e não há valores falsos do registo nem coisa assim. As melhorias de desempenho dependem do seu hardware e do que aplica no ChibangaRx.

### Posso desfazer alterações feitas pelo ChibangaRx?

Sim, todas as alterações são reversíveis. Pode usar a inversão da alteração do ChibangaRx ou um ponto de restauração do sistema.

### Por que o ChibangaRx pede permissões de administrador?

Permissões de administrador são necessárias para aplicar alterações e otimizações ao nível do sistema e utilizar/criar pontos de restauração.

### Por que o Windows Defender/Smartscreen Bloqueia o ChibangaRx

O ChibangaRx atualmente não tem assinatura, já que custa muito para um projeto open source. Quando executa um exe sem assinatura no Windows, ele automaticamente assume que é inseguro e bloqueia-o.

Pode contornar isso clicando em:

Clique "Mais informações" → "Executar de qualquer forma".

<div>
  <h2>📃 Documentação</h2>
  <p>Pode encontrar a documentação no <a href="https://github.com/chibangar/chibangarx">repositório GitHub</a></p>
  A documentação cobre todas as alterações, como funcionam, o que fazem e todas as Páginas e Ferramentas do ChibangaRx.
</div>

<div>
  <h3>🎨 Novos Temas! (v0.35.0+)</h3>

Cinco temas adicionais para personalizar a sua experiência visual:

- 🌸 **Sakura** - Rosa floral suave, delicado e feminino  
- 🍃 **Forest** - Verde floresta relaxante, reduz fadiga ocular  
- 🔥 **Cyberpunk** - Neon vibrante estilo Cyberpunk 2077 (gama alta)  
- ❄️ **Ice** - Azul gelo translúcido refrescante  
- ⚡ **Energy** - Amarelo dourado energético para criativos

Total de temas: **13 opções**!

<div>
  <h3>💖 Créditos</h3>
  <ul>
    <li>
      <a href="https://github.com/ChrisTitusTech/winutil">CTT's WinUtil (Algumas das alterações & <b>Parte</b> da inspiração para criar esta v2 do projeto)</a>
    </li>
    <li>
      <a href="https://github.com/Raphire/Win11Debloat">Raphire Win11Debloat (Script secundário de desinstalação oferecido no script de desinstalação ChibangaRx)</a>
    </li>
  </ul>

  <h3>👥 Contribuir</h3>

  <h4>Adicionar Novas Alterações</h4>
  <ul>
    <li>As alterações estão localizadas em <code>/tweaks</code></li>
  </ul>

Consulte o <a href="https://github.com/chibangar/chibangarx">docs</a> para mais informações sobre como adicionar novas alterações

  <h4-Outras Formas de Contribuir</h4>
  <ul>
    <li>🐛 Reportar bugs e problemas</li>
    <li>💡 Sugerir novas funcionalidades ou melhorias</li>
    <li>📝 Melhorar a documentação</li>
    <li>🎨 Melhorar a Interface Utilizador/Experiência de Utilizador</li>
    <li>🧪 Melhorar a qualidade do código</li>
  </ul>

  <details>
  <summary><h3>O que se passar se eu for alérgico ao Electron?</h3></summary>

Isso está completamente bem, este projeto provavelmente não é para si.
 Poderá querer verificar o [CTT WinUtil](https://github.com/ChrisTitusTech/winutil),
 Uma alternativa baseada em PowerShell que mantém as coisas agradáveis e leves.

Esta mensagem foi inspirada por [esta](https://github.com/nukeop/nuclear/blob/legacy/electron/docs/electron.md)

</details>

<h2>Construir ChibangaRx</h2>

<p>Para construir o ChibangaRx, precisará do seguinte:</p>
<ul>
  <li><b>Node.js</b> v22 ou superior (v24 recomendado)</li>
  <li><b>pnpm</b></li>
  <li><b>Windows 10/11</b></li>
</ul>

---

</div>

> [!IMPORTANTE]
> A versão do ChibangaRx no repositório é provavelmente mais recente que a última release. Espere bugs e funcionalidades não lançadas

<ol>
  <li>
    <b>Clonar o repositório:</b>
    <pre><code>git clone https://github.com/chibangar/chibangarx
cd chibangarx</code></pre>
  </li>
  <li>
    <b>Instalar dependências:</b>
    <pre><code>pnpm i</code></pre>
  </li>
  <li>
    <b>Lançar o app em modo de desenvolvimento:</b>
    <pre><code>pnpm dev</code></pre>
    <i>Isto irá lançar o ChibangaRx com recarregamento quente para tanto o processo principal do Electron quanto os processos de renderização.</i>
  </li>
  <br/>
  <li>
    <b>Compilar para produção:</b>
    <pre><code>pnpm build</code></pre>
    <i>Isto irá compilar o ChibangaRx. As compilações estão localizadas no diretório <code>dist/</code>. Poderá ser solicitado se deseja atualizar o registo das alterações. Isto apenas é para compilações de produção</i>
  </li>
</ol>
## Distribuição e Atualizações

### Para Utilizadores
- As atualizações são baixadas automaticamente das GitHub Releases
- O app verifica por atualizações a cada 30 segundos
- Notificações aparecem no app quando as atualizações estão disponíveis

### Para Desenvolvedores
- Empurrar código para o branch `main`
- O CI roda automaticamente (lint, typecheck, testes)
- Para lançar uma nova versão:
  ```powershell
  .\scripts\deploy.ps1 -Version "2.39.0"
  ```
- GitHub Actions compila e publica a release
- Os utilizadores recebem a atualização automaticamente

Veja [DEPLOY.md](DEPLOY.md) para instruções detalhadas.

<br/>
  <p align="center">Criado com ❤️ por chibangar</p>
