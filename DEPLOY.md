# 🇵🇹 Guia de Deployment e Publicação - ChibangaRx PT Edition! (Português de Portugal)

<div align="center">

![GitHub](https://img.shields.io/badge/GitHub-blue?style=for-the-badge)  
![License](https://img.shields.io/badge/License-GPLV3-blue?style=for-the-badge)  

## 🎯 Para Utilizadores Finais (Auto-atualizações!)

Atualizações descarregadas automaticamente a cada 30 segundos desde GitHub Releases. App verifica novas versões e instala silenciosamente sem reboot obrigatório!

### Vantagens:
- ✅ Instalação automática + segura  
- ✅ Backup automático antes update  
- ✅ Rollback fácil se algo der erro  

---

## 🛠️ Para Desenvolvedores (Build Manual Completa)

### 1. Requisitos Sistema Mínimos:

```powershell
# Verificar requisitos ou instalar via winget:  
winget install -e --id "OpenJS.Nodejs.LTS"     # NodeJS v20+ ou superior  
winget install Pnpm                              # pnpm v9+v10+  
```

### 2. Clone Repositório (Primeira vez):

```powershell
git clone https://github.com/chibangar/chibangarx.git chibangarx-pt-repo && cd chibangarx-pt-repo  
pnpm install --frozen-lockfile   # Instala +50 pacotes via pnpm
```

### 3. Modo Desenvolvimento (Hot-Relo):

```powershell
pnpm dev                         # Inicia Electron com hot-reload visual  
pnpm run preview                # Abre navegador para inspecionar UI
  
# Hot-reload permite testar alterações sem stop/start completo do app!
```

### 4. Build Produção Final:

```powershell  
pnpm build                      # Compila outputs finais → dist/win-unpacked/
ls .\dist\win-unpacked\*.exe   # Executável pronto para instalação!
```

---

### 5. Publicação Release ao GitHub (Manual se necessário):

#### Opção A: Usar Script de Deploy Automático (Recomendado)

```powershell
.\scripts\deploy.ps1 -Version "2.45.16"
# Script faz tudo: build+commit+tag+push+publish release auto-tagged!
```

#### Opção B: Publicação Manual Passo-a-Passo

```powershell
# Step 1: Atualizar versão package.json primeiro  
$version = "2.45.16"  # Substitua pela sua próxima versão
Write-Host "Publicando ChibangaRx v$version" -ForegroundColor Green
  
# Step 2: Commit mudanças (se necessário)  
git add .  
git commit -m "Update to v$version - Build production release candidate"

# Step 3: Criar tag nova release e push ao GitHub!  
git tag -a "v$version" -m "Release oficial ChibangaRx v$version 🇵🇹 PT Edition!"
git push origin $version --force
git push --tags origin

# Se quiser push direto com token personalizado (HTTPS):
git push origin master 2>&1 | Tee-Object .\push-output.txt
  
# Alternativa via GitHub CLI se 'gh' instalado:
gh auth login                   # Login primeiro  
gh repo set-default chibangar/chibangarx  
gh release create $version \
    .\dist\win-unpacked\*.exe \  # Instala principal  
    --title "ChibangaRx v$version - Otimização Windows completa 🇵🇹" \
    --notesfile RELEASE_NOTES.md
    
# Upload release com asset + draft=false para publish direto:
gh release edit $version --add-assets .\assets\novo-tema.zip
```

---

### 6. GitHub Actions Automático (Pipeline CI/CD)!

GitHub Actions automates tudo após push commits a main/master branch!  

| Gatilho | Ação Executada | Descrição |  
|---------|----------------|-----------|
| `master` push | Build Completo | Roda tests vitest + build Vite final + release publish auto |  
| Tag create | Publish Release | Cria release público no GitHub Releases page + assets attachados! |  

**Arquivos CI/CD:**
- `.github/workflows/ci.yml` → Pipeline principal (build+test+deploy)  
- `.github/workflows/release.yml` → Publicação releases batch otímizado  
- `build.js` → Script customizado de compilação com verificação pós-build  

---

<div style="border-left: 4px solid #28a745; padding-left: 15px; margin-top: 2rem;">
## ✅ Checklist Build Antes do Release Oficial!

Antes publicar release ao GitHub Releases, verifique:  
- [ ] Todos testes vitest passando (`pnpm test`)  
- [ ] Lint limpo sem warnings/eslintrc errors (`.eslint` rules ativadas)  
- [ ] TypeScript compila sem erros críticos (`tsc --noEmit`)  
- [ ] Executável roda em modo portable + instalador NSIS alternativos funcionais  
- [ ] Release notes completo em PT-PT com todas funcionalidades listadas  
- [ ] Build verificado manualmente rodando em Windows 10/11 limpo sem erros  

---

<div style="border-left: 4px solid #ffc107; padding-left: 20px;">
## ⚠️ Notas Importantes!

- Builds locais podem conter bugs/features não lançadas - **teste rigorosamente antes deploy produção** em sistemas reais de utilizadores  
- Releases oficiais GitHub mais conservadoras (menos riscos para usuários gerais)  
- GPL-V3 licença significa código auditável publicamente + contribuições bem-vindas!  

---

<div style="border-left: 4px solid #17a2b8; padding-left: 15px; margin-top: 1rem;">
## 📝 Template Release Notes (Em Português PT!)

Use este template ao publicar nova release no GitHub Releases page:

```markdown
# ChibangaRx vX.Y.Z - Atualizações Completas! ✨

## Novidades Principais  
- Otimizações GPU NVIDIA+AMD agora disponíveis automaticamente 🇵🇹
- Telemetria desligada por padrão (configs PT edition 2025)

### Correções de Bugs  
- Fix: Issue #142 - Limpador não remove arquivos protegidos Windows Update  
- Fix: Atualizações persistem após Windows update automático v2025+  

### Melhorias UI/UX  
- Tema "Spider-Man Boy" adicionado com visual personalizado 🎨  
- Dashboard performance otimizada com indicadores real-time CPU/GPU  

## Instalação Rápida
```powershell
irm https://raw.githubusercontent.com/chibangar/chibangarx/main/get.ps1 | iex
# Ou descarregar instalador desde Releases page!

## Créditos & Contribuições  
Obrigado a todos que contribuíram com pull requests, bug reports e translations PT-PT! 🇵🇹✨  

**[Ver commits](./commits) • [Release históricas](./releases)**

---
© 2025 ChibangaRx Team - GPL-V3 Open Source | Feito em Portugal 🇵🇹  
```

</div>

---

<div align="center">

## 🇵🇹 **Feito com ❤️ pelo chibangar Team em Portugal!**

**© 2025 ChibangaRx GPL-V3 Open Source**  🚀  
*"Debloat Windows & Otimizar Performance - Feito para Utilizadores de PT"*  

- 🔗 Releases: https://github.com/chibangar/chibangarx/releases/latest  
- 💬 Suporte Issues: https://github.com/chibangar/chibangarx/issues  

</div>

---

2. The script will:
   - Update `package.json` with the new version
   - Create a commit
   - Create a git tag
   - Push to GitHub
   - Trigger GitHub Actions to build and publish the release

### Option 2: Manual Release

1. Update the version in `package.json`
2. Commit changes:
   ```bash
   git add package.json
   git commit -m "Release v2.40.0"
   ```
3. Create a tag:
   ```bash
   git tag -a v2.40.0 -m "Release v2.40.0"
   ```
4. Push:
   ```bash
   git push origin main
   git push origin v2.40.0
   ```

## How Updates Work

### For Users

- **Initial check**: The app automatically checks for updates 30 seconds after launching
- **Periodic check**: The app checks for updates every 4 hours automatically
- **Manual check**: Users can manually check via the update manager bell icon
- **No auto-download**: Updates only download when user clicks "Download update"
- **In-place update**: Updates extract directly over the current installation — no reinstall, no installer UI
- **No data loss**: User settings and data are stored in `app.getPath("userData")` which is never touched by updates

### Update Flow

1. App checks GitHub Releases for newer version
2. If found, shows "Update available" with version info and release notes
3. User clicks "Download update" → downloads zip file
4. Progress bar shows download speed and bytes
5. When done, user clicks "Restart and install"
6. App extracts zip in-place and restarts — no installer, no reinstall

### Update States

| State | Description |
|---|---|
| `idle` | No update process active |
| `checking` | Currently checking for updates |
| `available` | Update found, waiting for user to download |
| `downloading` | Downloading update with progress info |
| `downloaded` | Download complete, ready to install |
| `installing` | Extracting and restarting |
| `error` | Update check or download failed |

### For Developers

1. Push code to the `main` branch
2. CI runs automatically (lint, typecheck, tests)
3. When ready to release, use the deploy script or manual release steps above
4. GitHub Actions builds and publishes the release
5. Users receive the update automatically

## GitHub Actions Workflows

### CI (`ci.yml`)
- Runs on push to `main` and pull requests
- Runs lint, typecheck, tests, and build
- Ensures code quality before merge

### Release (`release.yml`)
- Triggers on tag push (`v*`)
- Builds the app for Windows (ZIP only)
- Publishes to GitHub Releases
- Users' apps auto-update from these releases

## Auto-Update System

- Uses `electron-updater` with GitHub provider
- Checks GitHub Releases API every 4 hours (plus initial check 30s after launch)
- `autoDownload = false` — user must click "Download update"
- `autoInstallOnAppQuit = false` — no silent installs
- In-place ZIP extraction — no NSIS installer, no reinstall
- Shows progress percentage, download speed, and bytes transferred
- Users can click "Restart and install" to apply immediately
- Only published (non-draft) GitHub releases are used

### Data Persistence

All user data (settings, preferences, tweaks configs) is stored in `app.getPath("userData")`, which is outside the installation directory. Updates never delete or overwrite user data.

## Testing Updates

### Prerequisites

1. A GitHub release must be published (not draft) with the new version tag
2. The `latest.yml` file must be uploaded with the release assets

### Test Steps

1. Install an older version of ChibangaRx
2. Open the old version
3. Wait 30 seconds for the initial update check
4. Observe the update notification appears
5. Click "Download update" and watch the progress
6. Click "Restart and install"
7. Verify the app restarts and opens the new version
8. Verify user settings and data are preserved

### Important Notes

- **ZIP updates**: In-place extraction, no installer UI, no reinstall
- **Dev mode**: Auto-update is disabled in development mode (`app.isPackaged === false`)
- **Version comparison**: Only shows update if remote version is strictly newer than current

## Files Required in GitHub Releases

Each release must include these files:

1. `ChibangaRx-{version}-win.zip` — Portable ZIP (main update file)
2. `latest.yml` — Version metadata for electron-updater

## Release Checklist

- [ ] Version in `package.json` is incremented (semver)
  - Patch: `2.39.6` → `2.39.7`
  - Minor: `2.39.6` → `2.40.0`
  - Major: `2.40.0` → `3.0.0`
- [ ] All tests pass
- [ ] Typecheck passes
- [ ] Build completes successfully
- [ ] Tag pushed to GitHub (`v{version}`)
- [ ] GitHub Actions release workflow completes
- [ ] Release is published (not draft)
- [ ] `latest.yml` file is in release assets

## Troubleshooting

### If CI fails
- Check the GitHub Actions logs
- Fix lint/typecheck/test errors
- Push again

### If release fails
- Verify the tag format is `v*` (e.g., `v2.40.0`)
- Check GitHub Actions logs for build errors
- Ensure no draft releases block new releases

### If users don't get updates
- Verify the release was published on GitHub (not draft)
- Check that the `latest.yml` file is in release assets
- Verify the version in `package.json` matches the tag
- Users can manually check for updates via the bell icon
