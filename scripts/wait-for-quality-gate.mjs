import { readFile } from "node:fs/promises";

const REPORT_TASK_PATH = ".scannerwork/report-task.txt";
const POLL_INTERVAL_MS = Number.parseInt(process.env.SONAR_POLL_INTERVAL_MS ?? "5000", 10);
const TIMEOUT_MS = Number.parseInt(process.env.SONAR_QG_TIMEOUT_MS ?? "600000", 10);

function parsePropertiesFile(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        if (separatorIndex === -1) {
          return [line, ""];
        }

        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
      })
  );
}

function getAuthHeaders(token) {
  return {
    Authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}`
  };
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    headers: getAuthHeaders(token)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SonarQube API request failed (${response.status} ${response.statusText}) for ${url}\n${body}`);
  }

  return response.json();
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const token = process.env.SONAR_TOKEN ?? process.env.SONAR_AUTH_TOKEN;
  if (!token) {
    throw new Error("SONAR_TOKEN is not set.");
  }

  const reportTaskContent = await readFile(REPORT_TASK_PATH, "utf8");
  const reportTask = parsePropertiesFile(reportTaskContent);
  const serverUrl = process.env.SONAR_HOST_URL ?? reportTask.serverUrl;
  const ceTaskId = reportTask.ceTaskId;

  if (!serverUrl) {
    throw new Error("Unable to determine SonarQube server URL.");
  }

  if (!ceTaskId) {
    throw new Error(`Unable to find ceTaskId in ${REPORT_TASK_PATH}.`);
  }

  const deadline = Date.now() + TIMEOUT_MS;
  const ceTaskUrl = new URL("/api/ce/task", serverUrl);
  ceTaskUrl.searchParams.set("id", ceTaskId);

  console.log(`Waiting for SonarQube Compute Engine task ${ceTaskId}`);

  while (Date.now() < deadline) {
    const taskResponse = await fetchJson(ceTaskUrl, token);
    const task = taskResponse.task;

    if (!task?.status) {
      throw new Error("SonarQube task response did not include a task status.");
    }

    console.log(`Current CE task status: ${task.status}`);

    if (task.status === "SUCCESS") {
      if (!task.analysisId) {
        throw new Error("SonarQube task completed but no analysisId was returned.");
      }

      const qualityGateUrl = new URL("/api/qualitygates/project_status", serverUrl);
      qualityGateUrl.searchParams.set("analysisId", task.analysisId);

      const qualityGateResponse = await fetchJson(qualityGateUrl, token);
      const projectStatus = qualityGateResponse.projectStatus;

      if (!projectStatus?.status) {
        throw new Error("SonarQube quality gate response did not include a project status.");
      }

      console.log(`Quality Gate status: ${projectStatus.status}`);

      if (projectStatus.status !== "OK") {
        throw new Error(`Quality Gate failed with status '${projectStatus.status}'.`);
      }

      return;
    }

    if (task.status === "FAILED" || task.status === "CANCELED") {
      throw new Error(`SonarQube Compute Engine task ended with status '${task.status}'.`);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out after ${TIMEOUT_MS} ms while waiting for SonarQube Quality Gate.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
