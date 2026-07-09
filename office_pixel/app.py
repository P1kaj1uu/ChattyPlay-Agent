import os
import time
import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).parent.resolve()
ASSETS_DIR = BASE_DIR / "assets"
INDEX_FILE = BASE_DIR / "index.html"
CONFIG_FILE = BASE_DIR / "config.json"

PORT = int(os.environ.get("PORT", 7860))

app = FastAPI(title="OpenClaw Virtual Office")


def load_config() -> dict:
    try:
        with open(CONFIG_FILE, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"[Config] Could not load config.json: {e}")
        return {"title": "OpenClaw Virtual Office", "agents": []}


CONFIG = load_config()
AGENTS = CONFIG.get("agents", [])
START_TIME = 0


TASK_POOL = [
    "修复线上Bug",
    "编写单元测试",
    "代码审查与合并请求",
    "设计数据库表结构",
    "开发新API接口",
    "前端页面切版与适配",
    "搭建开发环境与依赖",
    "性能压测与调优",
    "撰写接口文档",
    "部署测试环境",
    "重构旧模块代码",
    "排查内存泄漏问题",
    "实现用户认证与权限模块",
    "对接第三方支付接口",
    "优化SQL查询性能",
    "配置CI/CD流水线",
    "编写集成测试用例",
    "升级依赖库版本",
    "处理跨域与安全策略",
    "设计缓存策略与Redis接入",
    "实现消息队列消费者",
    "开发定时任务脚本",
    "搭建微服务网关",
    "编写Dockerfile与容器化部署",
    "实现日志收集与监控告警",
    "设计分布式锁方案",
    "开发文件上传与处理功能",
    "实现数据导出报表功能",
    "优化前端首屏加载速度",
    "处理并发冲突与事务管理",
    "编写架构设计文档",
    "进行技术选型与评估",
    "搭建本地开发环境",
    "维护公共组件库",
    "实现WebSocket实时通信",
    "配置Nginx反向代理",
    "编写数据库迁移脚本",
    "实现搜索功能与索引优化",
    "开发管理后台仪表盘",
    "处理异常与全局错误拦截",
    "实现多语言国际化",
    "配置日志分级与存储",
    "编写运维部署手册",
]

STATUS_CYCLE = ["busy", "online", "busy", "idle", "online", "idle", "offline"]


def _now_ms() -> int:
    return int(time.time() * 1000)


def _task_for(agent_id: int, tick: int) -> str:
    idx = (agent_id + tick) % len(TASK_POOL)
    return TASK_POOL[idx]


def build_status() -> dict:
    now = _now_ms()
    agents_out = []

    for i, agent in enumerate(AGENTS):
        step_len = 45
        offset = i * 13
        tick = (now // 1000 // step_len) + offset
        status = STATUS_CYCLE[tick % len(STATUS_CYCLE)]

        if status == "busy":
            last_active = (now // 1000) % 2          # 0-1 min
        elif status == "online":
            last_active = 2 + ((now // 1000) % 8)    # 2-9 min
        elif status == "idle":
            last_active = 10 + ((now // 1000) % 40)  # 10-49 min
        else:
            last_active = 61 + ((now // 1000) % 30)

        if status == "offline":
            task = "尚未建立 session"
            tokens = 0
        else:
            task = _task_for(i, tick)
            tokens = 1200 + (i * 537) + (tick * 89 % 4000)

        agents_out.append({
            "id": agent.get("id", f"agent-{i}"),
            "name": agent.get("name", "Agent"),
            "sprite": agent.get("sprite", "agent-boss"),
            "role": agent.get("role", ""),
            "status": status,
            "task": task,
            "lastActive": last_active,
            "session": f"oc_demo_{agent.get('id', i)}",
            "tokens": tokens,
        })

    return {
        "title": CONFIG.get("title", "OpenClaw Virtual Office"),
        "timestamp": now,
        "agents": agents_out,
    }


@app.get("/api/status")
def api_status():
    """Current agent status (polled by the dashboard)."""
    return JSONResponse(build_status())


@app.get("/")
def index():
    return FileResponse(INDEX_FILE)


app.mount("", StaticFiles(directory=str(BASE_DIR)), name="root")


if __name__ == "__main__":
    import uvicorn
    print(f"   http://0.0.0.0:{PORT}")
    print(f"   Agents: {len(AGENTS)} configured (simulated data)\n")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
