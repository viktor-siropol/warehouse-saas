import { existsSync, readFileSync } from "node:fs";

import { spawnSync } from "node:child_process";

import path from "node:path";

import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);

const scriptsDirectory = path.dirname(scriptPath);

const root = path.resolve(scriptsDirectory, "..");

function fail(message) {
  console.error(`\n❌ ${message}\n`);

  process.exit(1);
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: root,

    encoding: "utf8",
  });

  if (result.status !== 0) {
    fail(result.stderr || `git ${args.join(" ")} failed`);
  }

  return result.stdout;
}

function normalizePath(file) {
  return file.replaceAll("\\", "/");
}

function isForbiddenEnvironmentFile(file) {
  const basename = file.split("/").at(-1);

  if (basename === ".env") {
    return true;
  }

  if (basename?.startsWith(".env.") && !basename.endsWith(".example")) {
    return true;
  }

  return false;
}

function isGeneratedPath(file) {
  return (
    file === "node_modules" ||
    file.startsWith("node_modules/") ||
    file.includes("/node_modules/") ||
    file === ".next" ||
    file.startsWith(".next/") ||
    file.includes("/.next/") ||
    file === "dist" ||
    file.startsWith("dist/") ||
    file.includes("/dist/") ||
    file === "coverage" ||
    file.startsWith("coverage/") ||
    file.includes("/coverage/")
  );
}

function main() {
  const packageLockPath = path.join(root, "package-lock.json");

  if (!existsSync(packageLockPath)) {
    fail("package-lock.json is missing. CI requires a committed npm lockfile.");
  }

  const packageJsonPath = path.join(root, "package.json");

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

  if (packageJson.packageManager !== "npm@11.19.0") {
    fail("package.json must pin packageManager to npm@11.19.0");
  }

  if (packageJson.engines?.node !== "24.21.0") {
    fail("package.json must pin Node to 24.21.0");
  }

  const nvmrcPath = path.join(root, ".nvmrc");

  if (!existsSync(nvmrcPath)) {
    fail(".nvmrc is missing");
  }

  const nvmrc = readFileSync(nvmrcPath, "utf8").trim();

  if (nvmrc !== "24.21.0") {
    fail(`.nvmrc must contain 24.21.0. Received: ${nvmrc}`);
  }

  const trackedFiles = runGit(["ls-files"])
    .split(/\r?\n/u)
    .filter(Boolean)
    .map(normalizePath);

  const forbiddenFiles = trackedFiles.filter(
    (file) =>
      isForbiddenEnvironmentFile(file) ||
      file.endsWith(".tsbuildinfo") ||
      isGeneratedPath(file) ||
      /^verify-step-\d+\.mjs$/u.test(file),
  );

  if (forbiddenFiles.length > 0) {
    fail(
      [
        "Forbidden generated/private files are tracked:",
        "",
        ...forbiddenFiles,
      ].join("\n"),
    );
  }

  const whitespaceResult = spawnSync("git", ["diff", "--check"], {
    cwd: root,

    encoding: "utf8",
  });

  if (whitespaceResult.status !== 0) {
    fail(
      whitespaceResult.stdout ||
        whitespaceResult.stderr ||
        "git diff --check failed",
    );
  }

  console.log("✅ Repository hygiene check passed");

  console.log("✅ package-lock.json exists");

  console.log("✅ Node/npm toolchain is pinned");

  console.log("✅ no tracked private env files");

  console.log("✅ no tracked *.tsbuildinfo");

  console.log("✅ no tracked build output");

  console.log("✅ no tracked verify-step-X scripts");

  console.log("✅ git diff --check passed");
}

main();
