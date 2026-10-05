import { readFile } from "node:fs/promises";
import { z } from "zod";

const ConfigSchema = z.object({
  githubOrg: z.string(),
  githubToken: z.string(),
  linearApiKey: z.string(),
  linearTeamKey: z.string(),
});

export type Config = z.infer<typeof ConfigSchema>;

export const loadConfig = async (path: string): Promise<Config> =>
  ConfigSchema.parse(JSON.parse(await readFile(path, "utf8")));
