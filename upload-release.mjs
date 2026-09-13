import { createReadStream } from "fs";

async function uploadToGithub(token, owner, repo, releaseId, fileName, filePath) {
  const url = `https://uploads.github.com/repos/${owner}/${repo}/releases/${releaseId}/assets?name=${encodeURIComponent(fileName)}`;

  console.log(`📤 Upload: ${fileName}...`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/octet-stream"
    },
    body: createReadStream(filePath)
  });

  if (response.ok) {
    console.log(`✅ ${fileName} subido com sucesso!`);
    return true;
  } else {
    const error = await response.text();
    console.error(`❌ Erro ao subir ${fileName}:`, error.substring(0, 200));
    return false;
  }
}

async function main() {
  const token = process.env.GITHUB_TOKEN || "";

  if (!token) {
    console.log("⚠️  Nenhum GITHUB_TOKEN encontrado. Por favor execute: npm adduser --scope=chibangar");
    return;
  }

  const files = [
    { name: "chibangarx-2.45.21-portable.exe", path: "./dist/chibangarx-2.45.21-portable.exe" },
    { name: "chibangarx-2.45.21-Setup.exe", path: "./dist/chibangarx-2.45.21-Setup.exe" }
  ];

  console.log("📦 Iniciando upload aos GitHub Releases...\n");

  for (const file of files) {
    await uploadToGithub(token, "chibangar", "chibangarx", "387917510", file.name, file.path);
  }

  console.log("\n✅ Upload completo!");
}

main();
