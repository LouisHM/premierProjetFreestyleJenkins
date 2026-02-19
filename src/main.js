import "./style.css";
import { releaseHealth } from "./utils/releaseHealth";

const metrics = {
  tests: 96,
  coverage: 89,
  issues: 2,
  build: "2m 14s"
};

const health = releaseHealth(metrics);

const checks = [
  { label: "Tests", value: `${metrics.tests}%`, hint: "Tests automatises verts" },
  { label: "Coverage", value: `${metrics.coverage}%`, hint: "Rapport Vitest + V8" },
  { label: "Issues", value: `${metrics.issues}`, hint: "Defauts critiques Sonar" },
  { label: "Build", value: metrics.build, hint: "Temps moyen Jenkins" }
];

const app = document.querySelector("#app");

app.innerHTML = `
  <main class="page">
    <section class="hero glass">
      <p class="eyebrow">TP1 DEVOPS</p>
      <h1>CI/CD Control Room</h1>
      <p>
        Mini interface Node.js pour valider rapidement un pipeline Jenkins
        avec build, tests, SonarQube et publication Nexus.
      </p>
      <div class="badge" style="--badge:${health.color}">
        Release Health: <strong>${health.score}/100 - ${health.status}</strong>
      </div>
    </section>

    <section class="grid">
      ${checks
        .map(
          (check) => `
            <article class="card glass">
              <h2>${check.label}</h2>
              <p class="value">${check.value}</p>
              <p class="hint">${check.hint}</p>
            </article>
          `
        )
        .join("")}
    </section>
  </main>
`;
