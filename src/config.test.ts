import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { loadConfig, type Config } from "./config.ts";

describe("loadConfig", () => {
  let path: string;

  beforeEach(async () => {
    path = join(await mkdtemp(join(tmpdir(), "depdrop-")), "config.json");
  });

  describe("when the config file is complete", () => {
    let config: Config;

    beforeEach(async () => {
      await writeFile(
        path,
        JSON.stringify({
          githubOrg: "acme",
          githubToken: "gh-token",
          linearApiKey: "lin-key",
          linearTeamKey: "SEC",
        }),
      );
      config = await loadConfig(path);
    });

    it("returns the config", () => {
      expect(config).toEqual({
        githubOrg: "acme",
        githubToken: "gh-token",
        linearApiKey: "lin-key",
        linearTeamKey: "SEC",
      });
    });
  });

  describe("when the config file is missing a field", () => {
    let result: Promise<Config>;

    beforeEach(async () => {
      await writeFile(path, JSON.stringify({ githubOrg: "acme", githubToken: "gh-token" }));
      result = loadConfig(path);
      result.catch(() => {});
    });

    it("rejects", async () => {
      await expect(result).rejects.toThrow(/linearApiKey/);
    });
  });
});
