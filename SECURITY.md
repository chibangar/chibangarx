# Política de Segurança

## Reportar uma vulnerabilidade

Não publique vulnerabilidades em issues públicas. Envie uma descrição reproduzível, versões afetadas e impacto para o contacto de segurança configurado no repositório GitHub. A manutenção confirmará a receção e coordenará a correção e divulgação.

## Releases oficiais

Uma versão oficial é criada apenas pelo workflow `Release`, iniciado pelo push de uma tag Git assinada e anotada `vX.Y.Z`. O workflow exige que a tag aponte para o commit atual de `main`, que a versão seja igual à de `package.json`, e que o ficheiro de notas `release-notes/pt-PT/vX.Y.Z.md` exista.

O ambiente GitHub `release` deve ser protegido por revisores e conter estes segredos:

- `RELEASE_TAG_SIGNING_PUBLIC_KEY`: chave pública que autoriza as assinaturas de tags de release.
- `WINDOWS_CERTIFICATE_BASE64`: certificado Authenticode PFX codificado em Base64.
- `WINDOWS_CERTIFICATE_PASSWORD`: palavra-passe do PFX.

Os assets da release incluem instalador e portátil assinados, metadados do updater, `SHA256SUMS`, SBOM CycloneDX e bundle de proveniência. Antes de instalar, valide a assinatura no Windows e o hash publicado:

```powershell
Get-AuthenticodeSignature .\chibangarx-*-Setup.exe
Get-FileHash .\chibangarx-*-Setup.exe -Algorithm SHA256
```

## Limites de suporte

São suportadas a versão estável mais recente e as versões ainda distribuídas através de GitHub Releases. Builds locais, artefactos sem assinatura válida e ficheiros fora da release oficial não são suportados.
