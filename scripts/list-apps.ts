import { readdirSync, existsSync, readFileSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const RESERVED = new Set([
  ".git",
  ".github",
  "node_modules",
  "schemas",
  "scripts",
  "templates",
  "dist",
  "build",
]);

interface AppManifest {
  name: string;
  description: string;
  credentials: {
    source_keys?: string[];
    board_keys?: string[];
    algorithm_key?: string;
    secret_key: string;
  };
  settings: {
    team_name: string;
    theme_color?: string;
    [key: string]: unknown;
  };
}

function discoverAppFolders(): string[] {
  const entries = readdirSync(ROOT, { withFileTypes: true });
  return entries
    .filter((e) => {
      if (!e.isDirectory()) return false;
      if (e.name.startsWith(".")) return false;
      if (RESERVED.has(e.name)) return false;
      return true;
    })
    .map((e) => e.name)
    .sort();
}

function main() {
  const folders = discoverAppFolders();

  if (folders.length === 0) {
    console.log("No app submissions found.");
    process.exit(0);
  }

  const apps: (AppManifest & { folder: string })[] = [];

  for (const folder of folders) {
    const manifestPath = join(ROOT, folder, "app.json");
    if (!existsSync(manifestPath)) {
      console.warn(`WARN: ${folder}/app.json not found, skipping.`);
      continue;
    }

    try {
      const manifest: AppManifest = JSON.parse(
        readFileSync(manifestPath, "utf-8")
      );
      apps.push({ ...manifest, folder });
    } catch {
      console.warn(`WARN: ${folder}/app.json is invalid JSON, skipping.`);
    }
  }

  if (apps.length === 0) {
    console.log("No valid apps found.");
    process.exit(0);
  }

  console.log(`\n  HrFlow.ai App Store — ${apps.length} app(s)\n`);
  console.log(
    "  " +
      "Folder".padEnd(35) +
      "Name".padEnd(30) +
      "Team".padEnd(20)
  );
  console.log("  " + "-".repeat(85));

  for (const app of apps) {
    console.log(
      "  " +
        app.folder.padEnd(35) +
        app.name.padEnd(30) +
        app.settings.team_name.padEnd(20)
    );
  }

  console.log();
}

main();
