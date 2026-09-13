#!/bin/bash
TOKEN=$(npm whoami 2>/dev/null | grep -oE '[a-zA-Z0-9]{40,}' || echo "")

if [ -z "$TOKEN" ]; then
  echo "⚠️ Sem autenticação. Execute primeiro:"
  echo "   gh auth setup-git"
  exit 1
fi

RELEASE_ID=387917510
OWNER=chibangar
REPO=chibangarx

for FILE in dist/*-2.45.21*.exe; do
  NAME=$(basename "$FILE")
  curl -sL -X POST "https://uploads.github.com/repos/$OWNER/$REPO/releases/$RELEASE_ID/assets?name=$NAME" \
    -H "Authorization: Bearer $TOKEN" \
    --header "Content-Type: application/octet-stream" \
    --data-binary "@$FILE" \
    && echo "✅ Subido: $NAME" || echo "❌ Falha: $NAME"
done

echo ""
echo "Verifica releases em: https://github.com/chibangar/chibangarx/releases/tag/v2.45.21"
