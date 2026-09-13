# Configuração obrigatória de segurança do repositório

Estas definições são administrativas e devem ser aplicadas em GitHub, além dos workflows versionados.

## Branch `main`

- Exigir pull request, pelo menos uma aprovação e resolução de conversas.
- Exigir que `CI / ci` e `CodeQL / Analyze JavaScript and TypeScript` passem antes de merge.
- Exigir branches atualizadas, bloquear force-pushes e eliminações, e limitar bypass a administradores de release.
- Restringir pushes diretos a `main`.

## Tags e ambiente de release

- Criar uma ruleset para `v*.*.*`: bloquear deleção/forçar atualização e permitir criação apenas a mantenedores de release.
- Exigir tags assinadas para as pessoas autorizadas; a pipeline também verifica criptograficamente a assinatura contra `RELEASE_TAG_SIGNING_PUBLIC_KEY`.
- Criar o ambiente `release`, restringi-lo a `main` e a tags `v*.*.*`, exigir revisores e guardar nele os três segredos referidos em `SECURITY.md`.
- Conceder ao `GITHUB_TOKEN` apenas permissões de leitura por defeito. O job de release declara explicitamente as permissões de escrita necessárias para release, SBOM e atestação.

## Verificação contínua

- Ativar Dependabot alerts, security updates e pull requests de versão.
- Ativar code scanning e secret scanning com push protection.
- Rever semanalmente pull requests de dependências e alertas CodeQL antes de os aceitar.
