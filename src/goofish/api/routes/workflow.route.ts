/**
 * 发货流程 API 路由
 */

import { Hono } from "hono";

import {
  getWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
} from "../../db/index";

export function createWorkflowRoutes() {
  const app = new Hono();

  // 获取所有流程
  app.get("/", (c) => {
    const workflows = getWorkflows();
    return c.json({ workflows });
  });

  // 获取单个流程
  app.get("/:id", (c) => {
    const id = parseInt(c.req.param("id"));
    const workflow = getWorkflowById(id);
    if (!workflow) {
      return c.json({ error: "流程不存在" }, 404);
    }
    return c.json({ workflow });
  });

  // 创建流程
  app.post("/", async (c) => {
    const body = await c.req.json();
    const { name, description, definition, isDefault } = body;

    if (!name || !definition) {
      return c.json({ error: "缺少必要参数" }, 400);
    }

    const id = createWorkflow({ name, description, definition, isDefault });
    return c.json({ success: true, id });
  });

  // 更新流程
  app.put("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const success = updateWorkflow(id, body);
    if (!success) {
      return c.json({ error: "更新失败" }, 400);
    }
    return c.json({ success: true });
  });

  // 删除流程
  app.delete("/:id", (c) => {
    const id = parseInt(c.req.param("id"));
    const success = deleteWorkflow(id);
    if (!success) {
      return c.json({ error: "删除失败，默认流程不能删除" }, 400);
    }
    return c.json({ success: true });
  });

  // 设为默认流程
  app.post("/:id/default", (c) => {
    const id = parseInt(c.req.param("id"));
    const success = updateWorkflow(id, { isDefault: true });
    if (!success) {
      return c.json({ error: "设置失败" }, 400);
    }
    return c.json({ success: true });
  });

  return app;
}
