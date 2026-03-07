/**
 * 数据库迁移和表结构初始化
 */

import { db } from './connection'
import { createLogger } from '../core/logger'

const logger = createLogger('Db:Migration')

// 安全添加列（如果不存在）
function safeAddColumn(table: string, column: string, type: string) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
  } catch {
    // 列已存在，忽略
  }
}

// 创建账号相关表
function createAccountTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      cookies TEXT NOT NULL,
      user_id TEXT,
      nickname TEXT,
      avatar TEXT,
      enabled INTEGER DEFAULT 1,
      remark TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  safeAddColumn('accounts', 'avatar', 'TEXT')

  db.exec(`
    CREATE TABLE IF NOT EXISTS account_status (
      account_id TEXT PRIMARY KEY,
      connected INTEGER DEFAULT 0,
      last_heartbeat TEXT,
      last_token_refresh TEXT,
      error_message TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `)
}

// 创建消息相关表
function createMessageTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT NOT NULL,
      chat_id TEXT,
      sender_id TEXT,
      sender_name TEXT,
      content TEXT,
      raw TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `)
}

// 创建对话相关表
function createConversationTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      account_id TEXT NOT NULL,
      chat_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_avatar TEXT,
      last_message TEXT,
      last_time INTEGER DEFAULT 0,
      unread INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (account_id, chat_id)
    )
  `)

  safeAddColumn('conversations', 'account_id', "TEXT DEFAULT ''")

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversation_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT NOT NULL,
      chat_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      content TEXT NOT NULL,
      msg_time TEXT,
      msg_id TEXT,
      direction TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)

  safeAddColumn('conversation_messages', 'msg_id', 'TEXT')
  safeAddColumn('conversation_messages', 'account_id', "TEXT DEFAULT ''")

  // 创建索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_conv_msg_account_chat 
    ON conversation_messages(account_id, chat_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_conv_msg_created_at 
    ON conversation_messages(created_at)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_conversations_last_time 
    ON conversations(last_time DESC)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_conversations_account 
    ON conversations(account_id)`)
}

// 创建自动回复表
function createAutoReplyTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autoreply_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      priority INTEGER DEFAULT 0,
      match_type TEXT NOT NULL,
      match_pattern TEXT NOT NULL,
      reply_content TEXT NOT NULL,
      account_id TEXT,
      exclude_match INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 添加 exclude_match 列（如果不存在）
  safeAddColumn('autoreply_rules', 'exclude_match', 'INTEGER DEFAULT 0')

  // 插入默认测试规则
  const testRule = db.prepare(
    'SELECT id FROM autoreply_rules WHERE match_pattern = ?'
  ).get('123')

  if (!testRule) {
    db.prepare(`
      INSERT INTO autoreply_rules (name, enabled, priority, match_type, match_pattern, reply_content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('测试规则', 1, 100, 'exact', '123', '456')
    logger.info('已创建默认测试自动回复规则')
  }
}

// 创建用户头像缓存表
function createUserAvatarTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_avatars (
      user_id TEXT PRIMARY KEY,
      display_name TEXT,
      avatar TEXT NOT NULL,
      ip_location TEXT,
      introduction TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

// 创建订单表
function createOrderTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      account_id TEXT NOT NULL,
      item_id TEXT,
      item_title TEXT,
      item_pic_url TEXT,
      price TEXT,
      buyer_user_id TEXT,
      buyer_nickname TEXT,
      chat_id TEXT,
      status INTEGER DEFAULT 0,
      status_text TEXT,
      order_time TEXT,
      pay_time TEXT,
      ship_time TEXT,
      complete_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
  `)

  // 添加 chat_id 列（如果不存在）
  safeAddColumn('orders', 'chat_id', 'TEXT')

  // 创建索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_account 
    ON orders(account_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_status 
    ON orders(status)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_updated 
    ON orders(updated_at DESC)`)
}

// 创建系统设置表
function createSettingsTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

// 创建自动发货表
function createAutoSellTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autosell_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      enabled INTEGER DEFAULT 1,
      item_id TEXT,
      account_id TEXT,
      delivery_type TEXT NOT NULL,
      delivery_content TEXT,
      api_config TEXT,
      trigger_on TEXT DEFAULT 'paid',
      workflow_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  safeAddColumn('autosell_rules', 'workflow_id', 'INTEGER')

  db.exec(`
    CREATE TABLE IF NOT EXISTS autosell_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      used_order_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      used_at TEXT,
      FOREIGN KEY (rule_id) REFERENCES autosell_rules(id) ON DELETE CASCADE
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS autosell_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id INTEGER,
      order_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      delivery_type TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'success',
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_autosell_stock_rule 
    ON autosell_stock(rule_id, used)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_autosell_logs_order 
    ON autosell_logs(order_id)`)
}

// 创建发货流程表
function createWorkflowTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      definition TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER NOT NULL,
      order_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      rule_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      current_node_id TEXT,
      waiting_for_reply INTEGER DEFAULT 0,
      expected_keywords TEXT,
      context TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
    )
  `)

  // 创建索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_workflow_exec_order 
    ON workflow_executions(order_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_workflow_exec_waiting 
    ON workflow_executions(account_id, waiting_for_reply, status)`)

  // 插入默认流程
  const defaultWorkflow = db.prepare(
    'SELECT id FROM workflows WHERE is_default = 1'
  ).get()

  if (!defaultWorkflow) {
    const defaultDef = JSON.stringify({
      nodes: [
        { id: 'trigger', type: 'trigger', name: '触发', config: {}, posX: 100, posY: 200 },
        { id: 'delivery', type: 'delivery', name: '发货', config: {}, posX: 350, posY: 200 },
        { id: 'ship', type: 'ship', name: '标记发货', config: {}, posX: 600, posY: 200 }
      ],
      connections: [
        { fromNode: 'trigger', fromOutput: 'output_1', toNode: 'delivery', toInput: 'input_1' },
        { fromNode: 'delivery', fromOutput: 'output_1', toNode: 'ship', toInput: 'input_1' }
      ]
    })
    db.prepare(`
      INSERT INTO workflows (name, description, definition, is_default, enabled)
      VALUES (?, ?, ?, 1, 1)
    `).run('默认流程', '触发 → 发货 → 标记发货', defaultDef)
    logger.info('已创建默认发货流程')
  }
}

export function runMigrations() {
  logger.info('开始数据库迁移...')

  createAccountTables()
  createMessageTables()
  createConversationTables()
  createAutoReplyTables()
  createUserAvatarTables()
  createOrderTables()
  createSettingsTables()
  createAutoSellTables()
  createWorkflowTables()

  logger.info('数据库迁移完成')
}
