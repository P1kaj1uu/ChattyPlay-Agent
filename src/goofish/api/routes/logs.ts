import { Hono } from "hono";
import fs from "fs";
import path from "path";

const logsDir = path.join(process.cwd(), "logs");

export function createLogsRoutes() {
  const app = new Hono();

  // 根路径 - 返回日志信息
  app.get("/", (c) => {
    try {
      if (!fs.existsSync(logsDir)) {
        return c.json({
          message: "日志目录不存在",
          logsDir,
          endpoints: {
            "/api/logs/dates": "获取所有日志日期列表",
            "/api/logs/current": "获取当前运行的日志",
            "/api/logs/files/:date": "获取指定日期的日志文件列表",
            "/api/logs/content/:date/:file": "获取指定日志文件内容",
          },
        });
      }

      const entries = fs.readdirSync(logsDir, { withFileTypes: true });
      const dates = entries
        .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
        .map((e) => e.name)
        .sort((a, b) => b.localeCompare(a));

      return c.json({
        message: "Goofish 日志 API",
        logsDir,
        availableDates: dates.slice(0, 5),
        totalCount: dates.length,
        endpoints: {
          "/api/logs/dates": "获取所有日志日期列表",
          "/api/logs/current": "获取当前运行的日志",
          "/api/logs/files/:date": "获取指定日期的日志文件列表",
          "/api/logs/content/:date/:file": "获取指定日志文件内容",
        },
      });
    } catch (error) {
      return c.json({ error: "获取日志信息失败" }, 500);
    }
  });

  // 获取日志日期列表
  app.get("/dates", (c) => {
    try {
      if (!fs.existsSync(logsDir)) {
        return c.json({ dates: [] });
      }
      const entries = fs.readdirSync(logsDir, { withFileTypes: true });
      const dates = entries
        .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
        .map((e) => e.name)
        .sort((a, b) => b.localeCompare(a));
      return c.json({ dates });
    } catch {
      return c.json({ error: "获取日志日期失败" }, 500);
    }
  });

  // 获取指定日期的日志文件列表
  app.get("/files/:date", (c) => {
    try {
      const date = c.req.param("date");
      const dayDir = path.join(logsDir, date);
      if (!fs.existsSync(dayDir)) {
        return c.json({ files: [] });
      }
      const files = fs
        .readdirSync(dayDir)
        .filter((f) => f.endsWith(".log"))
        .map((f) => {
          const stat = fs.statSync(path.join(dayDir, f));
          return { name: f, size: stat.size, mtime: stat.mtimeMs };
        })
        .sort((a, b) => b.mtime - a.mtime);
      return c.json({ files });
    } catch {
      return c.json({ error: "获取日志文件列表失败" }, 500);
    }
  });

  // 获取日志文件内容
  app.get("/content/:date/:file", (c) => {
    try {
      const date = c.req.param("date");
      const file = c.req.param("file");
      const level = c.req.query("level");
      const limit = c.req.query("limit") || "500";
      const filePath = path.join(logsDir, date, file);

      if (!fs.existsSync(filePath)) {
        return c.json({ error: "日志文件不存在" }, 404);
      }

      const content = fs.readFileSync(filePath, "utf-8");
      let lines = content.split("\n").filter((l) => l.trim());

      if (level && level !== "ALL") {
        lines = lines.filter((l) => l.includes(`| ${level} `));
      }

      const maxLines = parseInt(limit, 10) || 500;
      const total = lines.length;
      lines = lines.slice(-maxLines);

      return c.json({ lines, total, filtered: total > maxLines });
    } catch {
      return c.json({ error: "读取日志文件失败" }, 500);
    }
  });

  // 获取当前运行日志（实时）
  app.get("/current", (c) => {
    try {
      const level = c.req.query("level");
      const limit = c.req.query("limit") || "100";

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const dayDir = path.join(logsDir, dateStr);

      if (!fs.existsSync(dayDir)) {
        return c.json({ lines: [], total: 0, file: null });
      }

      const files = fs
        .readdirSync(dayDir)
        .filter((f) => f.endsWith(".log"))
        .map((f) => ({
          name: f,
          mtime: fs.statSync(path.join(dayDir, f)).mtimeMs,
        }))
        .sort((a, b) => b.mtime - a.mtime);

      if (files.length === 0) {
        return c.json({ lines: [], total: 0, file: null });
      }

      const latestFile = files[0].name;
      const filePath = path.join(dayDir, latestFile);
      const content = fs.readFileSync(filePath, "utf-8");
      let lines = content.split("\n").filter((l) => l.trim());

      if (level && level !== "ALL") {
        lines = lines.filter((l) => l.includes(`| ${level} `));
      }

      const maxLines = parseInt(limit, 10) || 100;
      const total = lines.length;
      lines = lines.slice(-maxLines);

      return c.json({ lines, total, file: latestFile, date: dateStr });
    } catch {
      return c.json({ error: "读取当前日志失败" }, 500);
    }
  });

  return app;
}
