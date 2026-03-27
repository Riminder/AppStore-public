import { readdirSync, existsSync, readFileSync, writeFileSync } from "fs";
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

const START_MARKER = "<!-- APP_TABLE_START -->";
const END_MARKER = "<!-- APP_TABLE_END -->";

interface AppManifest {
  name: string;
  description: string;
  settings: {
    team_name: string;
  };
}

function discoverApps(): { folder: string; manifest: AppManifest }[] {
  const entries = readdirSync(ROOT, { withFileTypes: true });
  const apps: { folder: string; manifest: AppManifest }[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;
    if (RESERVED.has(entry.name)) continue;

    const manifestPath = join(ROOT, entry.name, "app.json");
    if (!existsSync(manifestPath)) continue;

    try {
      const manifest: AppManifest = JSON.parse(
        readFileSync(manifestPath, "utf-8")
      );
      apps.push({ folder: entry.name, manifest });
    } catch {
      console.warn(`WARN: ${entry.name}/app.json is invalid JSON, skipping.`);
    }
  }

  return apps.sort((a, b) => a.folder.localeCompare(b.folder));
}

function generateTable(apps: { folder: string; manifest: AppManifest }[]): string {
  if (apps.length === 0) {
    return "_No apps submitted yet._";
  }

  const header = "| App | Team | Description |\n|-----|------|-------------|";
  const rows = apps.map(({ folder, manifest }) => {
    const link = `[${manifest.name}](./${folder}/)`;
    const team = manifest.settings.team_name;
    const desc = manifest.description;
    return `| ${link} | ${team} | ${desc} |`;
  });

  return [header, ...rows].join("\n");
}

function main() {
  const readmePath = join(ROOT, "README.md");
  if (!existsSync(readmePath)) {
    console.error("ERROR: README.md not found.");
    process.exit(1);
  }

  const readme = readFileSync(readmePath, "utf-8");
  const startIdx = readme.indexOf(START_MARKER);
  const endIdx = readme.indexOf(END_MARKER);

  if (startIdx === -1 || endIdx === -1) {
    console.error(
      `ERROR: README.md is missing ${START_MARKER} / ${END_MARKER} markers.`
    );
    process.exit(1);
  }

  const apps = discoverApps();
  const table = generateTable(apps);

  const updated =
    readme.substring(0, startIdx + START_MARKER.length) +
    "\n\n" +
    table +
    "\n\n" +
    readme.substring(endIdx);

  writeFileSync(readmePath, updated, "utf-8");
  console.log(`README.md updated with ${apps.length} app(s).`);
}

main();
