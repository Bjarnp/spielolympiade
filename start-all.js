const { spawn } = require("child_process");
const path = require("path");

const rootDir = __dirname;
const backendDir = path.join(rootDir, "spielolympiade-backend");
const frontendDir = path.join(rootDir, "spielolympiade-frontend");

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const dockerCommand = isWindows ? "docker.exe" : "docker";

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
    windowsHide: false,
    ...options,
  });

  child.on("exit", (code, signal) => {
    if (code !== 0 && signal !== "SIGTERM") {
      console.error(
        `Process exited unexpectedly: ${command} ${args.join(" ")} (${code ?? signal})`,
      );
    }
  });

  return child;
}

function startDb() {
  console.log("Starting PostgreSQL database...");
  return run(dockerCommand, ["compose", "up", "-d", "db"], { cwd: rootDir });
}

function prepareBackend() {
  console.log("Preparing database schema and seed data...");
  return run(npmCommand, ["run", "prisma:init"], { cwd: backendDir });
}

function startBackend() {
  console.log("Starting backend...");
  return run(npmCommand, ["run", "dev"], { cwd: backendDir });
}

function startFrontend() {
  console.log("Starting frontend...");
  return run(npmCommand, ["run", "start"], { cwd: frontendDir });
}

const children = [];

function stopAll(signal = "SIGINT") {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
  process.exit(0);
}

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));

const dbProcess = startDb();
children.push(dbProcess);

let backendProcess;
let frontendProcess;

dbProcess.on("exit", (code) => {
  if (code !== 0) {
    console.error("Database failed to start. Aborting.");
    stopAll("SIGTERM");
    return;
  }

  const setupProcess = prepareBackend();
  children.push(setupProcess);

  setupProcess.on("exit", (setupCode) => {
    if (setupCode !== 0) {
      console.error("Database preparation failed. Aborting.");
      stopAll("SIGTERM");
      return;
    }

    backendProcess = startBackend();
    frontendProcess = startFrontend();
    children.push(backendProcess, frontendProcess);
  });
});
