import { beforeEach, describe, expect, it } from "vitest";
import { createLinearTracker } from "./linear.ts";
import type { Alert, Tracker } from "./sync.ts";

const alert = (number: number): Alert => ({
  url: `https://github.com/acme/widgets/security/dependabot/${number}`,
  repository: "acme/widgets",
  number,
  packageName: "lodash",
  ecosystem: "npm",
  severity: "high",
  summary: "Prototype pollution in lodash",
  ghsaId: "GHSA-xxxx-yyyy-zzzz",
  cveId: "CVE-2026-0001",
  manifestPath: "package.json",
  vulnerableVersionRange: "< 4.17.21",
  patchedVersion: "4.17.21",
});

type Issue = { id: string; teamId: string; title: string; description: string; priority: number };
type Attachment = { issueId: string; url: string; title: string };

class FakeLinear {
  teams = [{ id: "team-sec", key: "SEC" }];
  issues: Issue[] = [];
  attachments: Attachment[] = [];

  fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (headers.get("authorization") !== "lin_api_secret") {
      return new Response("Unauthorized", { status: 401 });
    }
    const { query, variables } = JSON.parse(String(init?.body));
    return Response.json({ data: this.resolve(query, variables) });
  }) as typeof fetch;

  resolve(query: string, variables: Record<string, any>) {
    if (query.includes("teams(")) {
      return { teams: { nodes: this.teams.filter((t) => t.key === variables.key) } };
    }
    if (query.includes("attachmentsForURL(")) {
      return {
        attachmentsForURL: {
          nodes: this.attachments.filter((a) => a.url === variables.url).map(() => ({ id: "a" })),
        },
      };
    }
    if (query.includes("issueCreate(")) {
      const issue = { id: `issue-${this.issues.length + 1}`, ...variables.input };
      this.issues.push(issue);
      return { issueCreate: { success: true, issue: { id: issue.id } } };
    }
    if (query.includes("attachmentCreate(")) {
      this.attachments.push(variables.input);
      return { attachmentCreate: { success: true } };
    }
    throw new Error(`Unexpected query: ${query}`);
  }
}

describe("createLinearTracker", () => {
  let linear: FakeLinear;
  let tracker: Tracker;

  beforeEach(async () => {
    linear = new FakeLinear();
    tracker = await createLinearTracker({
      apiKey: "lin_api_secret",
      teamKey: "SEC",
      fetch: linear.fetch,
    });
  });

  describe("when no ticket exists for the alert", () => {
    let hasTicket: boolean;

    beforeEach(async () => {
      hasTicket = await tracker.hasTicketFor(alert(1));
    });

    it("reports no ticket", () => {
      expect(hasTicket).toBe(false);
    });
  });

  describe("after creating a ticket for the alert", () => {
    let hasTicket: boolean;
    let hasOtherTicket: boolean;

    beforeEach(async () => {
      await tracker.createTicket(alert(1));
      hasTicket = await tracker.hasTicketFor(alert(1));
      hasOtherTicket = await tracker.hasTicketFor(alert(2));
    });

    it("reports the ticket exists", () => {
      expect(hasTicket).toBe(true);
    });

    it("creates the issue on the team", () => {
      expect(linear.issues).toEqual([
        expect.objectContaining({
          teamId: "team-sec",
          title: "[acme/widgets] lodash: Prototype pollution in lodash",
          priority: 2,
        }),
      ]);
    });

    it("links the alert to the issue", () => {
      expect(linear.attachments).toEqual([
        expect.objectContaining({ issueId: "issue-1", url: alert(1).url }),
      ]);
    });

    it("does not report a ticket for a different alert", () => {
      expect(hasOtherTicket).toBe(false);
    });
  });
});
