import { beforeEach, describe, expect, it } from "vitest";
import { fetchOpenAlerts } from "./github.ts";
import type { Alert } from "./sync.ts";

const rawAlert = (number: number) => ({
  number,
  state: "open",
  html_url: `https://github.com/acme/widgets/security/dependabot/${number}`,
  repository: { full_name: "acme/widgets" },
  dependency: {
    package: { name: "lodash", ecosystem: "npm" },
    manifest_path: "package.json",
  },
  security_advisory: {
    ghsa_id: "GHSA-xxxx-yyyy-zzzz",
    cve_id: null,
    summary: "Prototype pollution in lodash",
    severity: "high",
  },
  security_vulnerability: {
    vulnerable_version_range: "< 4.17.21",
    first_patched_version: { identifier: "4.17.21" },
  },
});

const expectedAlert = (number: number): Alert => ({
  url: `https://github.com/acme/widgets/security/dependabot/${number}`,
  repository: "acme/widgets",
  number,
  packageName: "lodash",
  ecosystem: "npm",
  severity: "high",
  summary: "Prototype pollution in lodash",
  ghsaId: "GHSA-xxxx-yyyy-zzzz",
  cveId: null,
  manifestPath: "package.json",
  vulnerableVersionRange: "< 4.17.21",
  patchedVersion: "4.17.21",
});

const fakeGitHub = (pages: Record<string, { body: unknown; next?: string }>): typeof fetch =>
  (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (headers.get("authorization") !== "Bearer secret-token") {
      return new Response("Unauthorized", { status: 401 });
    }
    const page = pages[input.toString()];
    if (!page) return new Response("Not Found", { status: 404 });
    return new Response(JSON.stringify(page.body), {
      status: 200,
      headers: page.next ? { link: `<${page.next}>; rel="next"` } : {},
    });
  }) as typeof fetch;

const firstPage = "https://api.github.com/orgs/acme/dependabot/alerts?state=open&per_page=100";
const secondPage =
  "https://api.github.com/orgs/acme/dependabot/alerts?state=open&per_page=100&after=abc";

describe("fetchOpenAlerts", () => {
  describe("when the org has a single page of alerts", () => {
    let alerts: Alert[];

    beforeEach(async () => {
      alerts = await fetchOpenAlerts({
        org: "acme",
        token: "secret-token",
        fetch: fakeGitHub({ [firstPage]: { body: [rawAlert(1)] } }),
      });
    });

    it("returns the alerts", () => {
      expect(alerts).toEqual([expectedAlert(1)]);
    });
  });
});
