export type RuntimeNodeEnvironment = "development" | "test" | "production";

export type RuntimeLogFormat = "pretty" | "json";

export type RuntimeEnvironment = {
  nodeEnv: RuntimeNodeEnvironment;

  port: number;

  logFormat: RuntimeLogFormat;
};

const LOCAL_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const BOOLEAN_ENV_NAMES = [
  "OUTBOX_WORKER_ENABLED",
  "DATA_JOBS_WORKER_ENABLED",
  "DEV_SEED_ENABLED",
] as const;

const POSITIVE_INTEGER_ENV_NAMES = [
  "OUTBOX_POLL_INTERVAL_MS",
  "OUTBOX_BATCH_SIZE",
  "OUTBOX_MAX_ATTEMPTS",
  "OUTBOX_LOCK_TIMEOUT_MS",

  "DATA_JOBS_POLL_INTERVAL_MS",
  "DATA_JOBS_BATCH_SIZE",
  "DATA_JOBS_MAX_ATTEMPTS",
  "DATA_JOBS_LOCK_TIMEOUT_MS",

  "SLOW_REQUEST_MS",
  "OPERATIONS_PENDING_WARN_SECONDS",
] as const;

function parsePort(rawValue: string | undefined): number {
  if (rawValue === undefined) {
    return 3001;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw new Error(
      `PORT must be an integer between 1 and 65535. Received: ${rawValue}`,
    );
  }

  return parsed;
}

function validateOptionalBoolean(
  name: string,

  rawValue: string | undefined,
): void {
  if (rawValue === undefined) {
    return;
  }

  if (rawValue !== "true" && rawValue !== "false") {
    throw new Error(`${name} must be "true" or "false". Received: ${rawValue}`);
  }
}

function validateOptionalPositiveInteger(
  name: string,

  rawValue: string | undefined,
): void {
  if (rawValue === undefined) {
    return;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `${name} must be a positive integer. Received: ${rawValue}`,
    );
  }
}

export function validateRuntimeEnvironment(
  env: NodeJS.ProcessEnv,
): RuntimeEnvironment {
  const rawNodeEnv = (env.NODE_ENV ?? "development").trim().toLowerCase();

  if (
    rawNodeEnv !== "development" &&
    rawNodeEnv !== "test" &&
    rawNodeEnv !== "production"
  ) {
    throw new Error(
      `NODE_ENV must be development, test, or production. Received: ${rawNodeEnv}`,
    );
  }

  const nodeEnv: RuntimeNodeEnvironment = rawNodeEnv;

  const databaseUrl = env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  let parsedDatabaseUrl: URL;

  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid URL");
  }

  if (
    parsedDatabaseUrl.protocol !== "postgresql:" &&
    parsedDatabaseUrl.protocol !== "postgres:"
  ) {
    throw new Error(
      `DATABASE_URL must use postgresql:// or postgres://. Received protocol: ${parsedDatabaseUrl.protocol}`,
    );
  }

  if (
    nodeEnv === "production" &&
    LOCAL_DATABASE_HOSTS.has(parsedDatabaseUrl.hostname)
  ) {
    throw new Error(
      `Refusing to start production against a local database host: ${parsedDatabaseUrl.hostname}`,
    );
  }

  if (nodeEnv === "production" && env.DEV_SEED_ENABLED === "true") {
    throw new Error("DEV_SEED_ENABLED must never be true in production");
  }

  const rawLogFormat = env.LOG_FORMAT?.trim().toLowerCase();

  if (
    rawLogFormat !== undefined &&
    rawLogFormat !== "pretty" &&
    rawLogFormat !== "json"
  ) {
    throw new Error(
      `LOG_FORMAT must be "pretty" or "json". Received: ${rawLogFormat}`,
    );
  }

  const logFormat: RuntimeLogFormat =
    rawLogFormat ?? (nodeEnv === "production" ? "json" : "pretty");

  for (const name of BOOLEAN_ENV_NAMES) {
    validateOptionalBoolean(name, env[name]);
  }

  for (const name of POSITIVE_INTEGER_ENV_NAMES) {
    validateOptionalPositiveInteger(name, env[name]);
  }

  return {
    nodeEnv,

    port: parsePort(env.PORT),

    logFormat,
  };
}
