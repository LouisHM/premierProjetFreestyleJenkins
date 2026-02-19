export function releaseHealth({ tests, coverage, issues }) {
  const score = Math.max(
    0,
    Math.min(100, Math.round(tests * 0.5 + coverage * 0.4 - issues * 3))
  );

  if (score >= 85) {
    return { score, status: "Excellent", color: "#16a34a" };
  }

  if (score >= 65) {
    return { score, status: "Stable", color: "#f59e0b" };
  }

  return { score, status: "At Risk", color: "#dc2626" };
}
