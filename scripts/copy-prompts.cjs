const fs = require("fs-extra");
const path = require("path");

async function copyPrompts() {
  try {
    const srcDir = path.join(__dirname, "..", "src", "prompts");
    const destDir = path.join(__dirname, "..", "dist", "prompts");

    // 대상 디렉토리가 존재하면 제거
    if (await fs.pathExists(destDir)) {
      await fs.remove(destDir);
    }

    // prompts 디렉토리 복사
    await fs.copy(srcDir, destDir);

    console.log("✅ Prompts copied successfully to dist/prompts");
  } catch (error) {
    console.error("❌ Error copying prompts:", error);
    process.exit(1);
  }
}

copyPrompts();
