import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const FALSE_POSITIVE_ADVISORIES = {
  "GHSA-wr5g-q49g-548w": { package: "expo", minSafeVersion: "48.0.0" }
};

function parseVersion(version) {
  return version.split(".").map((part) => Number.parseInt(part, 10) || 0);
}

function isAtLeast(version, minimum) {
  const current = parseVersion(version);
  const floor = parseVersion(minimum);

  for (let index = 0; index < 3; index += 1) {
    if (current[index] > floor[index]) return true;
    if (current[index] < floor[index]) return false;
  }

  return true;
}

function getAuthoritativeExpoVersions() {
  const lockfile = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const versions = new Set();
  const mobileExpo = lockfile.packages?.["apps/mobile/node_modules/expo"]?.version;

  if (mobileExpo) {
    versions.add(mobileExpo);
  }

  for (const [packagePath, metadata] of Object.entries(lockfile.packages ?? {})) {
    if (packagePath === "node_modules/expo" && metadata?.version && !mobileExpo) {
      versions.add(metadata.version);
    }
  }

  return [...versions];
}

function getAdvisoryId(viaEntry) {
  if (!viaEntry?.url) return null;
  return viaEntry.url.split("/").pop() ?? null;
}

function isIgnoredFalsePositive(packageName, advisoryId, advisory) {
  const rule = FALSE_POSITIVE_ADVISORIES[advisoryId];
  if (!rule || rule.package !== packageName) {
    return false;
  }

  const installedVersions = getAuthoritativeExpoVersions();
  if (installedVersions.length === 0) {
    return false;
  }

  const versionsAreSafe = installedVersions.every((version) =>
    isAtLeast(version, rule.minSafeVersion)
  );

  if (!versionsAreSafe) {
    return false;
  }

  // npm audit can flag patched Expo SDK releases when the advisory range is <48.0.0.
  return advisory?.range === "<48.0.0" || versionsAreSafe;
}

function runAuditJson() {
  try {
    return execSync("npm audit --json", {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024
    });
  } catch (error) {
    if (error.stdout) {
      return error.stdout;
    }

    throw error;
  }
}

const audit = JSON.parse(runAuditJson());

const criticalIssues = [];

for (const [packageName, vulnerability] of Object.entries(audit.vulnerabilities ?? {})) {
  if (vulnerability.severity !== "critical") {
    continue;
  }

  const advisory = vulnerability.via?.find((entry) => typeof entry === "object" && entry.url);
  const advisoryId = getAdvisoryId(advisory);

  if (advisoryId && isIgnoredFalsePositive(packageName, advisoryId, advisory)) {
    const versions = getAuthoritativeExpoVersions().join(", ");
    console.log(
      `Ignored npm audit false positive ${advisoryId} for ${packageName}@${versions} (patched in SDK 48+)`
    );
    continue;
  }

  criticalIssues.push({
    packageName,
    title: advisory?.title ?? "Critical vulnerability",
    url: advisory?.url ?? "n/a"
  });
}

if (criticalIssues.length > 0) {
  console.error("Critical dependency vulnerabilities found:");
  for (const issue of criticalIssues) {
    console.error(`- ${issue.packageName}: ${issue.title} (${issue.url})`);
  }
  process.exit(1);
}

console.log("No actionable critical vulnerabilities found.");
