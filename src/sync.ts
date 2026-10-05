export type Alert = {
  url: string;
  repository: string;
  number: number;
  packageName: string;
  ecosystem: string;
  severity: string;
  summary: string;
  ghsaId: string;
  cveId: string | null | undefined;
  manifestPath: string;
  vulnerableVersionRange: string;
  patchedVersion: string | null | undefined;
};

export interface Tracker {
  hasTicketFor(alert: Alert): Promise<boolean>;
  createTicket(alert: Alert): Promise<void>;
}

export const syncAlerts = async ({ alerts, tracker }: { alerts: Alert[]; tracker: Tracker }) => {
  const created: Alert[] = [];
  for (const alert of alerts) {
    if (await tracker.hasTicketFor(alert)) continue;
    await tracker.createTicket(alert);
    created.push(alert);
  }
  return created;
};
