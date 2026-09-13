# 🔐 Guia para Criar Release Manual no GitHub

## Passo a Passo:

### 1. Abra no navegador:
https://github.com/chibangar/chibangarx/releases/new

### 2. Preencha os campos:

**Tag version:** `v0.35.1` (já criada como tag, não precisa digitar)

**Title:** 
```
v0.35.1 - Novas Aplicações Gráficas 🎨🎮
```

### 3. Release notes (Copie todo conteúdo abaixo):

---
# ChibangaRx v0.35.1 - Novas Aplicações Gráficas 🎨

## ✨ O que há de novo nesta release

### 🎮 DirectX e Visual C++ Redistributables Adicionados!

Esta versão traz uma melhoria importante para utilizadores de jogos:

---

#### 📦 **DirectX End-User Runtime (June 2010)**
- **ID:** `Microsoft.DirectXEndUser`
- **Finalidade:** O runtime mais recente para jogos e aplicações multimédia no Windows
- **O que resolve:** Erros de "DirectX não instalado" em muitos jogos
- **Recomendado para:** Gamer, utilizadores de aplicações gráficas

---

#### 🛠️ **Visual C++ 2015-2022 Redistributable (x64)**
- **ID:** `Microsoft.VCRedist.2015-2022.x64`
- **Finalidade:** Runtime necessário para a maioria dos jogos Windows modernos
- **Versão:** Inclui todas as actualizações até 2022
- **Recomendado para:** Utilizadores de PC gaming, desenvolvedores

---

#### 🔄 **Visual C++ 2015-2022 Redistributable (x86)**
- **ID:** `Microsoft.VCRedist.2015-2022.x86`
- **Finalidade:** Runtime 32-bit para aplicações antigas e jogos legados
- **Quando usar:** Jogos de 32-bit, aplicações mais antigas
- **Recomendado para:** Utilizadores que precisam de compatibilidade

---

#### 📦 **Visual C++ 2015-2022 Redistributable All-in-One**
- **ID:** `Microsoft.VCRedist.2015-2022.All`
- **Finalidade:** Pacote completo contendo x86 e x64 em um único instalador
- **Vantagem:** Instala ambos os runtimes com um clique
- **Recomendado para:** Utilizadores que querem tudo de uma vez

---

### 🎨 Categoria "Graphics" Criada!

Uma nova categoria dedicada para aplicações gráficas e runtimes:
- **Ícone:** 🎨
- **Localização:** Página de Aplicações → Scroll até ao final
- **Aplicações nesta categoria:** 4 apps DirectX/Visual C++

---

### 📊 Comparativo de Temas (v0.35.0)

Para referência da release anterior:

| Tema | Descrição | Categoria |
|------|-----------|-----------|
| 🌸 Sakura | Rosa Floral | Novo |
| 🍃 Forest | Verde Natureza | Novo |
| 🔥 Cyberpunk | Neon Vibrante | Novo |
| ❄️ Ice | Azul Gelado | Novo |
| ⚡ Energy | Amarelo Energético | Novo |
| 🎨 Sunset | Pôr do Sol | Novo |

---

## 📥 Como Instalar

### Método 1: Via ChibangaRx (Recomendado)
1. Abra o **ChibangaRx**
2. Vá em **Settings → Apps Page**
3. Selecione os aplicativos DirectX/Visual C++ desejados
4. Clique em **"Install Selected"**

### Método 2: Instalação Direta
```powershell
irm https://raw.githubusercontent.com/chibangar/chibangarx/main/get.ps1 | iex
git pull origin main
pnpm install
pnpm dev
```

---

## 🎮 Por que Instalar?

### DirectX End-User Runtime:
- Resolve "DirectX 9/10/11 not installed" errors
- Necessário para muitos jogos AAA
- Pequeno (~35 MB) e seguro (Microsoft)

### Visual C++ Redistributables:
- **x64:** Para jogos modernos (FIFA, GTA V, Cyberpunk, etc.)
- **x86:** Para jogos antigos (StarCraft, older titles)
- **All-in-One:** Instala tudo automaticamente

---

## 📝 Notas de Versão

**v0.35.1** (Atual - 2026-09-13):
- ✅ Adicionado DirectX End-User Runtime
- ✅ Adicionado Visual C++ x64, x86, e All-in-One
- ✅ Nova categoria Graphics com ícone 🎨

**v0.35.0**:
- 🌸 6 Novos Temas (Sakura, Forest, Cyberpunk, Ice, Energy, Sunset)
- 📝 Documentação completa

---

## 🔗 Links Úteis

- [GitHub Repository](https://github.com/chibangar/chibangarx)
- [Downloads](https://github.com/chibangar/chibangarx/releases/latest)
- [Documentação](https://github.com/chibangar/chibangarx/tree/main/docs)
- [DirectX Download Oficial](https://www.microsoft.com/en-us/download/details.aspx?id=36)
- [Visual C++ Redistributables Oficial](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)

---

<div align="center">
  <strong>Mais informações: <a href="https://github.com/chibangar/chibangarx/releases/tag/v0.35.1">GitHub Releases</a></strong>
</div>

🎨✨ *Todos os temas e funcionalidades foram criados com ❤️ pela equipa Chibanga*


---

### 4. Clique em **Publish release** 🚀

---

## ✅ Conclusão

Após publicar, você verá a nova release disponível em:
https://github.com/chibangar/chibangarx/releases/tag/v0.35.1

Os usuários podem baixar e instalar as atualizações! ✨
