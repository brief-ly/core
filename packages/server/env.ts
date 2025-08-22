const envKeys = [
  "BUN_PUBLIC_SERVER_URL",
  "BUN_VERSION",
  "JWT_SECRET",
  "DB_URI",
  "PORT",
  "PRIVY_APP_SECRET",
  "ADMIN_SECRET",
  "BUN_PUBLIC_PRIVY_APP_ID",
  "PVT_KEY",
  "GOOGLE_API_KEY",
] as const;

type ENV = Record<(typeof envKeys)[number], string>;

let env: ENV = {} as any;

export function ensureEnv() {
  for (const key of envKeys) {
    if (!Bun.env[key]) {
      throw new Error(`Environment variable ${key} is not set`);
    }
  }

  env = Object.fromEntries(envKeys.map((key) => [key, Bun.env[key]])) as ENV;
}
const isProd =
  process.env["NODE_ENV"] === "production" ||
  process.env["NODE_ENV"] === "prod";
ensureEnv();

export { env, isProd };
