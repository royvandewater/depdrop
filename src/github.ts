import assert from "node:assert";
import { z } from "zod";
import type { Alert } from "./sync.ts";

const AlertSchema = z.object({
  number: z.number(),
  html_url: z.string(),
  repository: z.object({ full_name: z.string() }),
  dependency: z.object({
    package: z.object({ name: z.string(), ecosystem: z.string() }),
    manifest_path: z.string(),
  }),
  security_advisory: z.object({
    ghsa_id: z.string(),
    cve_id: z.string().nullish(),
    summary: z.string(),
    severity: z.string(),
  }),
  security_vulnerability: z.object({
    vulnerable_version_range: z.string(),
    first_patched_version: z.object({ identifier: z.string() }).nullish(),
  }),
});

const toAlert = (raw: z.infer<typeof AlertSchema>): Alert => ({
  url: raw.html_url,
  repository: raw.repository.full_name,
  number: raw.number,
  packageName: raw.dependency.package.name,
  ecosystem: raw.dependency.package.ecosystem,
  severity: raw.security_advisory.severity,
  summary: raw.security_advisory.summary,
  ghsaId: raw.security_advisory.ghsa_id,
  cveId: raw.security_advisory.cve_id,
  manifestPath: raw.dependency.manifest_path,
  vulnerableVersionRange: raw.security_vulnerability.vulnerable_version_range,
  patchedVersion: raw.security_vulnerability.first_patched_version?.identifier,
});

export const fetchOpenAlerts = async ({
  org,
  token,
  fetch,
}: {
  org: string;
  token: string;
  fetch: typeof globalThis.fetch;
}): Promise<Alert[]> => {
  const url = `https://api.github.com/orgs/${org}/dependabot/alerts?state=open&per_page=100`;
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    },
  });
  assert(
    response.ok,
    new Error(`GitHub request failed: ${response.status} ${response.statusText}`),
  );
  return z
    .array(AlertSchema)
    .parse(await response.json())
    .map(toAlert);
};
