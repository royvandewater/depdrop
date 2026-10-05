import { describe, expect, it } from "vitest";
import { parseCliArgs } from "./args.ts";

describe("parseCliArgs", () => {
  describe("with no arguments", () => {
    const args = parseCliArgs([]);

    it("is not help or dry run", () => {
      expect(args).toEqual({ help: false, dryRun: false });
    });
  });

  describe("with --help", () => {
    const args = parseCliArgs(["--help"]);

    it("requests help", () => {
      expect(args).toEqual({ help: true, dryRun: false });
    });
  });

  describe("with -h", () => {
    const args = parseCliArgs(["-h"]);

    it("requests help", () => {
      expect(args).toEqual({ help: true, dryRun: false });
    });
  });

  describe("with --dry-run", () => {
    const args = parseCliArgs(["--dry-run"]);

    it("requests a dry run", () => {
      expect(args).toEqual({ help: false, dryRun: true });
    });
  });

  describe("with an unknown flag", () => {
    const parse = () => parseCliArgs(["--bogus"]);

    it("throws", () => {
      expect(parse).toThrow(/bogus/);
    });
  });
});
