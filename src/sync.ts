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
  createTicket(alert: Alert): Promise<void>;
}

export const syncAlerts = async ({ alerts, tracker }: { alerts: Alert[]; tracker: Tracker }) => {
  for (const alert of alerts) {
    await tracker.createTicket(alert);
  }
};
