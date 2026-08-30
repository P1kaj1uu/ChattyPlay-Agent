import path from "path";

function resolvePath(value: string): string {
  return path.isAbsolute(value) ? value : path.join(process.cwd(), value);
}

export const GOOFISH_DATA_DIR = resolvePath(
  process.env.GOOFISH_DATA_DIR || "data",
);

export const GOOFISH_LOG_DIR = resolvePath(
  process.env.GOOFISH_LOG_DIR || "logs",
);

export const GOOFISH_DB_PATH = resolvePath(
  process.env.GOOFISH_DB_PATH || path.join(GOOFISH_DATA_DIR, "goofishcbot.db"),
);
