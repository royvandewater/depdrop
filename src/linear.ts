import assert from "node:assert";
import { z } from "zod";
import type { Alert, Tracker } from "./sync.ts";

const TeamsSchema = z.object({ teams: z.object({ nodes: z.array(z.object({ id: z.string() })) }) });
const AttachmentsSchema = z.object({
  attachmentsForURL: z.object({ nodes: z.array(z.object({ id: z.string() })) }),
});
const IssueCreateSchema = z.object({
  issueCreate: z.object({ success: z.boolean(), issue: z.object({ id: z.string() }).nullish() }),
});
const AttachmentCreateSchema = z.object({ attachmentCreate: z.object({ success: z.boolean() }) });

const priorities: Record<string, number> = { critical: 1, high: 2, medium: 3, low: 4 };

const describeAlert = (alert: Alert) =>
  [
    `**${alert.summary}**`,
    "",
    `- Repository: ${alert.repository}`,
    `- Package: ${alert.packageName} (${alert.ecosystem})`,
    `- Manifest: ${alert.manifestPath}`,
    `- Severity: ${alert.severity}`,
    `- Vulnerable versions: ${alert.vulnerableVersionRange}`,
    `- Patched version: ${alert.patchedVersion ?? "none"}`,
    `- Advisory: [${alert.ghsaId}](https://github.com/advisories/${alert.ghsaId})`,
    ...(alert.cveId ? [`- CVE: ${alert.cveId}`] : []),
    "",
    `Dependabot alert: ${alert.url}`,
  ].join("\n");

export const createLinearTracker = async ({
  apiKey,
  teamKey,
  fetch,
}: {
  apiKey: string;
  teamKey: string;
  fetch: typeof globalThis.fetch;
}): Promise<Tracker> => {
  const request = async <T>(schema: z.ZodType<T>, query: string, variables: object) => {
    const response = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: { authorization: apiKey, "content-type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });
    assert(
      response.ok,
      new Error(`Linear request failed: ${response.status} ${response.statusText}`),
    );
    const body = z
      .object({ data: z.unknown(), errors: z.array(z.unknown()).nullish() })
      .parse(await response.json());
    assert(!body.errors, new Error(`Linear request failed: ${JSON.stringify(body.errors)}`));
    return schema.parse(body.data);
  };

  const { teams } = await request(
    TeamsSchema,
    `query Team($key: String!) { teams(filter: { key: { eq: $key } }) { nodes { id } } }`,
    { key: teamKey },
  );
  const team = teams.nodes[0];
  assert(team, new Error(`Linear team not found: ${teamKey}`));

  return {
    async hasTicketFor(alert) {
      const { attachmentsForURL } = await request(
        AttachmentsSchema,
        `query Attachments($url: String!) { attachmentsForURL(url: $url) { nodes { id } } }`,
        { url: alert.url },
      );
      return attachmentsForURL.nodes.length > 0;
    },

    async createTicket(alert) {
      const priority = priorities[alert.severity];
      assert(priority, new Error(`Unknown severity: ${alert.severity}`));
      const { issueCreate } = await request(
        IssueCreateSchema,
        `mutation CreateIssue($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id } } }`,
        {
          input: {
            teamId: team.id,
            title: `[${alert.repository}] ${alert.packageName}: ${alert.summary}`,
            description: describeAlert(alert),
            priority,
          },
        },
      );
      assert(issueCreate.success && issueCreate.issue, new Error("Linear issueCreate failed"));

      const { attachmentCreate } = await request(
        AttachmentCreateSchema,
        `mutation CreateAttachment($input: AttachmentCreateInput!) { attachmentCreate(input: $input) { success } }`,
        {
          input: {
            issueId: issueCreate.issue.id,
            url: alert.url,
            title: `Dependabot alert #${alert.number}`,
            subtitle: alert.repository,
          },
        },
      );
      assert(attachmentCreate.success, new Error("Linear attachmentCreate failed"));
    },
  };
};
