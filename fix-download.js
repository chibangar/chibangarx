const fs = require("fs");
const path = "src/main/updates.ts";
let c = fs.readFileSync(path, "utf8");
const old = "      return { ok: false, error: String(error) }\n    }\n  })";
const nw = "      console.error(\"[ChibangaRx] Download failed:\", error.message);\n      return { ok: false, error: String(error) }\n    }\n  })";
if (c.includes(old)) {
  c = c.replace(old, nw);
  fs.writeFileSync(path, c, "utf8");
  console.log("Updated download handler with error logging");
} else {
  console.log("Pattern not found");
}
