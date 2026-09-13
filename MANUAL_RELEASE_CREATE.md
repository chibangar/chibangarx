# Processo de releases

Este guia manual foi descontinuado. Não crie nem publique GitHub Releases pela interface web.

Cada versão oficial é criada exclusivamente pelo workflow `Release` quando uma tag Git anotada e assinada `vX.Y.Z` é enviada para o repositório. O workflow verifica a assinatura da tag, a correspondência com `package.json`, o commit atual de `main`, os testes, a assinatura Authenticode e os artefactos antes de publicar a release.

Siga o procedimento em [DEPLOY.md](DEPLOY.md). As notas da versão devem existir em `release-notes/pt-PT/vX.Y.Z.md` antes de a tag ser criada.
