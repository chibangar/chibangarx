#!/usr/bin/env python3
import json, urllib.request, ssl

context = ssl.create_default_context()
headers = {"Accept": "application/vnd.github.v3+json"}

# Ler ficheiros a subir
files = {
    "chibangarx-2.45.21-portable.exe": open("dist/chibangarx-2.45.21-portable.exe", "rb"),
    "chibangarx-2.45.21-Setup.exe": open("dist/chibangarx-2.45.21-Setup.exe", "rb")
}

# Publica release manualmente se não existir
release_data = {
    "tag_name": "v2.45.21",
    "name": "v2.45.21 - Sistema de Clips",
    "body": open("RELEASE_NOTES.md").read() if __import__('os').path.exists("RELEASE_NOTES.md") else None,
    "draft": True,
    "prerelease": False
}

print("📦 Upload aos GitHub Releases v2.45.21")
print("=" * 50)
for name in files:
    print(f"⏳ Subindo {name}...")
