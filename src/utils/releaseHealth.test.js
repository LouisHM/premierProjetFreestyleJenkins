import { describe, expect, it } from "vitest";
import { releaseHealth } from "./releaseHealth";

describe("releaseHealth", () => {
  it("retourne un statut Excellent pour un score eleve", () => {
    const result = releaseHealth({ tests: 100, coverage: 100, issues: 0 });

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.status).toBe("Excellent");
  });

  it("retourne un statut Stable pour un score moyen", () => {
    const result = releaseHealth({ tests: 90, coverage: 85, issues: 2 });

    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(result.score).toBeLessThan(85);
    expect(result.status).toBe("Stable");
  });

  it("borne le score entre 0 et 100", () => {
    const low = releaseHealth({ tests: 0, coverage: 0, issues: 100 });
    const high = releaseHealth({ tests: 200, coverage: 200, issues: 0 });

    expect(low.score).toBe(0);
    expect(high.score).toBe(100);
  });
});
