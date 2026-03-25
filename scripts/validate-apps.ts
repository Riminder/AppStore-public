import { readdirSync, existsSync, readFileSync, statSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import Ajv from "ajv";

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

const RESERVED_FILES = new Set([
  "README.md",
  "CONTRIBUTING.md",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  ".gitignore",
  ".gitattributes",
  "LICENSE",
  "app.schema.json",
]);

const REQUIRED_FILES = ["app.json", "README.md", ".env.example"];
const PREVIEW_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
]);

const SECRET_PATTERNS = [
  /ask_[a-f0-9]{20,}/gi,
  /sk-[a-zA-Z0-9]{20,}/g,
  /secret_key\s*[:=]\s*["'][^"']{10,}["']/gi,
  /api_key\s*[:=]\s*["'][^"']{10,}["']/gi,
];

const TEXT_EXTENSIONS = new Set([
  ".json",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".html",
  ".css",
  ".yaml",
  ".yml",
  ".toml",
  ".env",
  ".md",
  ".txt",
  ".sh",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".swift",
  ".dart",
  ".rb",
  ".php",
  ".vue",
  ".svelte",
]);

function discoverAppFolders(): string[] {
  const entries = readdirSync(ROOT, { withFileTypes: true });
  return entries
    .filter((e) => {
      if (!e.isDirectory()) return false;
      if (e.name.startsWith(".")) return false;
      if (RESERVED.has(e.name)) return false;
      return true;
    })
    .map((e) => e.name);
}

function checkRequiredFiles(folder: string): string[] {
  const errors: string[] = [];
  for (const file of REQUIRED_FILES) {
    const filePath = join(ROOT, folder, file);
    if (!existsSync(filePath)) {
      errors.push(`Missing required file: ${file}`);
    }
  }
  return errors;
}

function checkPreviewAsset(folder: string): string[] {
  const assetsDir = join(ROOT, folder, "assets");
  if (!existsSync(assetsDir) || !statSync(assetsDir).isDirectory()) {
    return ["Missing 'assets/' directory with at least one preview image."];
  }

  const files = readdirSync(assetsDir);
  const hasPreview = files.some((f) => {
    const ext = f.substring(f.lastIndexOf(".")).toLowerCase();
    return PREVIEW_EXTENSIONS.has(ext);
  });

  if (!hasPreview) {
    return [
      `No preview image found in assets/. Expected one of: ${[...PREVIEW_EXTENSIONS].join(", ")}`,
    ];
  }
  return [];
}

function validateManifest(
  folder: string,
  schema: object
): { errors: string[] } {
  const manifestPath = join(ROOT, folder, "app.json");
  const errors: string[] = [];

  if (!existsSync(manifestPath)) {
    return { errors: ["app.json not found (already reported)."] };
  }

  let manifest: Record<string, unknown>;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch (e) {
    return {
      errors: [`app.json is not valid JSON: ${(e as Error).message}`],
      slug: null,
    };
  }

  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);
  const valid = validate(manifest);

  if (!valid && validate.errors) {
    for (const err of validate.errors) {
      errors.push(`Schema: ${err.instancePath || "/"} ${err.message}`);
    }
  }

  return { errors };
}

function scanForSecrets(folder: string): string[] {
  const errors: string[] = [];
  const appDir = join(ROOT, folder);

  function walkDir(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        walkDir(fullPath);
      } else if (entry.isFile()) {
        const ext = entry.name.substring(entry.name.lastIndexOf(".")).toLowerCase();
        // Only scan text files, skip .env.example
        if (entry.name === ".env.example") continue;
        if (entry.name === ".env") {
          errors.push(
            `Found .env file at ${fullPath.replace(ROOT + "/", "")}. Only .env.example is allowed.`
          );
          continue;
        }
        if (!TEXT_EXTENSIONS.has(ext)) continue;

        const content = readFileSync(fullPath, "utf-8");
        const relativePath = fullPath.replace(ROOT + "/", "");
        for (const pattern of SECRET_PATTERNS) {
          pattern.lastIndex = 0;
          const match = pattern.exec(content);
          if (match) {
            errors.push(
              `Possible secret detected in ${relativePath}: "${match[0].substring(0, 12)}..."`
            );
          }
        }
      }
    }
  }

  walkDir(appDir);
  return errors;
}

function main() {
  console.log("=== HrFlow App Store Validator ===\n");

  const schemaPath = join(ROOT, "schemas", "app.schema.json");
  if (!existsSync(schemaPath)) {
    console.error("ERROR: schemas/app.schema.json not found.");
    process.exit(1);
  }
  const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));

  const folders = discoverAppFolders();
  if (folders.length === 0) {
    console.log("No app submissions found.");
    process.exit(0);
  }

  console.log(`Found ${folders.length} app(s): ${folders.join(", ")}\n`);

  let totalErrors = 0;

  for (const folder of folders) {
    console.log(`--- Validating: ${folder} ---`);
    const errors: string[] = [];

    errors.push(...checkRequiredFiles(folder));
    errors.push(...checkPreviewAsset(folder));

    const { errors: manifestErrors } = validateManifest(folder, schema);
    errors.push(...manifestErrors);

    errors.push(...scanForSecrets(folder));

    if (errors.length === 0) {
      console.log("  PASS\n");
    } else {
      for (const err of errors) {
        console.log(`  FAIL: ${err}`);
      }
      console.log();
      totalErrors += errors.length;
    }
  }

  console.log("=== Summary ===");
  console.log(`Apps: ${folders.length}`);
  console.log(`Errors: ${totalErrors}`);

  if (totalErrors > 0) {
    console.log("\nValidation FAILED.");
    process.exit(1);
  } else {
    console.log("\nAll apps passed validation.");
    process.exit(0);
  }
}

main();
