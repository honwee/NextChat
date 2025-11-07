/**
 * PostgreSQL 数据库客户端（直连方式）
 * 使用 pg 库直接连接 Supabase PostgreSQL 数据库
 */

import { Pool, PoolClient, QueryResult } from "pg";

// 数据库类型定义
export interface User {
  id: string;
  feishu_user_id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Admin {
  id: string;
  user_id: string;
  role: "admin" | "super_admin";
  created_at: Date;
}

export interface Session {
  id: string;
  user_id: string;
  jwt_token: string;
  expires_at: Date;
  created_at: Date;
}

export interface Agent {
  id: string;
  name: string;
  dashscope_app_id: string;
  description: string | null;
  system_prompt: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Conversation {
  id: string;
  user_id: string;
  agent_id: string | null;
  title: string | null;
  model: string | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokens: number | null;
  created_at: Date;
}

export interface FeishuConfig {
  id: string;
  app_id: string;
  app_secret: string;
  redirect_uri: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

// 数据库连接池配置
const poolConfig = {
  host: process.env.SUPABASE_DB_HOST || "47.101.205.3",
  port: parseInt(process.env.SUPABASE_DB_PORT || "5432"),
  user: process.env.SUPABASE_DB_USER || "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  database: process.env.SUPABASE_DB_NAME || "lumichat",
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 空闲连接超时时间
  connectionTimeoutMillis: 2000, // 连接超时时间
};

// 全局连接池实例
let pool: Pool | null = null;

/**
 * 获取数据库连接池（单例模式）
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(poolConfig);

    // 错误处理
    pool.on("error", (err) => {
      console.error("数据库连接池错误:", err);
    });

    console.log("✅ 数据库连接池已创建");
  }

  return pool;
}

/**
 * 执行 SQL 查询
 */
export async function query<T = any>(
  text: string,
  params?: any[],
): Promise<QueryResult<T>> {
  const client = getPool();
  try {
    return await client.query<T>(text, params);
  } catch (error) {
    console.error("数据库查询错误:", error);
    throw error;
  }
}

/**
 * 执行事务
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 数据库操作类
 */
export class DatabaseService {
  // ==================== 用户操作 ====================

  async createUser(data: {
    feishu_user_id: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  }): Promise<User | null> {
    try {
      const result = await query<User>(
        `INSERT INTO users (feishu_user_id, name, email, avatar_url)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          data.feishu_user_id,
          data.name || null,
          data.email || null,
          data.avatar_url || null,
        ],
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("创建用户失败:", error);
      return null;
    }
  }

  async getUserByFeishuId(feishuUserId: string): Promise<User | null> {
    try {
      const result = await query<User>(
        "SELECT * FROM users WHERE feishu_user_id = $1",
        [feishuUserId],
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("获取用户失败:", error);
      return null;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await query<User>("SELECT * FROM users WHERE id = $1", [
        userId,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("获取用户失败:", error);
      return null;
    }
  }

  async updateUser(
    userId: string,
    data: Partial<Omit<User, "id" | "created_at" | "updated_at">>,
  ): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    if (fields.length === 0) {
      return null;
    }

    values.push(userId);

    try {
      const result = await query<User>(
        `UPDATE users SET ${fields.join(", ")}, updated_at = NOW()
         WHERE id = $${paramIndex}
         RETURNING *`,
        values,
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("更新用户失败:", error);
      return null;
    }
  }

  async listUsers(limit = 50, offset = 0): Promise<User[]> {
    try {
      const result = await query<User>(
        "SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        [limit, offset],
      );
      return result.rows;
    } catch (error) {
      console.error("获取用户列表失败:", error);
      return [];
    }
  }

  async getUserCount(): Promise<number> {
    try {
      const result = await query<{ count: string }>(
        "SELECT COUNT(*) as count FROM users",
      );
      return parseInt(result.rows[0]?.count || "0");
    } catch (error) {
      console.error("获取用户总数失败:", error);
      return 0;
    }
  }

  // ==================== 管理员操作 ====================

  async isAdmin(userId: string): Promise<boolean> {
    try {
      const result = await query("SELECT id FROM admins WHERE user_id = $1", [
        userId,
      ]);
      return result.rows.length > 0;
    } catch (error) {
      console.error("检查管理员失败:", error);
      return false;
    }
  }

  async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      const result = await query(
        "SELECT id FROM admins WHERE user_id = $1 AND role = $2",
        [userId, "super_admin"],
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("检查超级管理员失败:", error);
      return false;
    }
  }

  async getAdminRole(userId: string): Promise<"super_admin" | "admin" | null> {
    try {
      const result = await query<{ role: "super_admin" | "admin" }>(
        "SELECT role FROM admins WHERE user_id = $1",
        [userId],
      );
      return result.rows[0]?.role || null;
    } catch (error) {
      console.error("获取管理员角色失败:", error);
      return null;
    }
  }

  async addAdmin(
    userId: string,
    role: "admin" | "super_admin" = "admin",
  ): Promise<Admin | null> {
    try {
      const result = await query<Admin>(
        "INSERT INTO admins (user_id, role) VALUES ($1, $2) RETURNING *",
        [userId, role],
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("添加管理员失败:", error);
      return null;
    }
  }

  async removeAdmin(userId: string): Promise<boolean> {
    try {
      await query("DELETE FROM admins WHERE user_id = $1", [userId]);
      return true;
    } catch (error) {
      console.error("删除管理员失败:", error);
      return false;
    }
  }

  // ==================== 会话操作 ====================

  async createSession(
    userId: string,
    jwtToken: string,
    expiresAt: Date,
  ): Promise<Session | null> {
    try {
      const result = await query<Session>(
        "INSERT INTO sessions (user_id, jwt_token, expires_at) VALUES ($1, $2, $3) RETURNING *",
        [userId, jwtToken, expiresAt],
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("创建会话失败:", error);
      return null;
    }
  }

  async getSessionByToken(jwtToken: string): Promise<Session | null> {
    try {
      const result = await query<Session>(
        "SELECT * FROM sessions WHERE jwt_token = $1 AND expires_at > NOW()",
        [jwtToken],
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("获取会话失败:", error);
      return null;
    }
  }

  async deleteSession(jwtToken: string): Promise<boolean> {
    try {
      await query("DELETE FROM sessions WHERE jwt_token = $1", [jwtToken]);
      return true;
    } catch (error) {
      console.error("删除会话失败:", error);
      return false;
    }
  }

  async cleanExpiredSessions(): Promise<number> {
    try {
      const result = await query(
        "DELETE FROM sessions WHERE expires_at < NOW()",
      );
      return result.rowCount || 0;
    } catch (error) {
      console.error("清理过期会话失败:", error);
      return 0;
    }
  }

  // ==================== 智能体操作 ====================

  async getAgents(includeInactive = false): Promise<Agent[]> {
    try {
      const sql = includeInactive
        ? "SELECT * FROM agents ORDER BY created_at DESC"
        : "SELECT * FROM agents WHERE is_active = true ORDER BY created_at DESC";

      const result = await query<Agent>(sql);
      return result.rows;
    } catch (error) {
      console.error("获取智能体列表失败:", error);
      return [];
    }
  }

  async getAgentById(agentId: string): Promise<Agent | null> {
    try {
      const result = await query<Agent>("SELECT * FROM agents WHERE id = $1", [
        agentId,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("获取智能体失败:", error);
      return null;
    }
  }

  async createAgent(data: {
    name: string;
    dashscope_app_id: string;
    description?: string;
    system_prompt?: string;
    is_active?: boolean;
    created_by?: string;
  }): Promise<Agent | null> {
    try {
      const result = await query<Agent>(
        `INSERT INTO agents (name, dashscope_app_id, description, system_prompt, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.name,
          data.dashscope_app_id,
          data.description || null,
          data.system_prompt || null,
          data.is_active !== undefined ? data.is_active : true,
          data.created_by || null,
        ],
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("创建智能体失败:", error);
      return null;
    }
  }

  async updateAgent(
    agentId: string,
    data: Partial<Omit<Agent, "id" | "created_at" | "updated_at">>,
  ): Promise<Agent | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    if (fields.length === 0) {
      return null;
    }

    values.push(agentId);

    try {
      const result = await query<Agent>(
        `UPDATE agents SET ${fields.join(", ")}, updated_at = NOW()
         WHERE id = $${paramIndex}
         RETURNING *`,
        values,
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("更新智能体失败:", error);
      return null;
    }
  }

  async deleteAgent(agentId: string): Promise<boolean> {
    try {
      await query("UPDATE agents SET is_active = false WHERE id = $1", [
        agentId,
      ]);
      return true;
    } catch (error) {
      console.error("删除智能体失败:", error);
      return false;
    }
  }

  // ==================== 对话操作 ====================

  async createConversation(data: {
    user_id: string;
    agent_id?: string;
    title?: string;
    model?: string;
  }): Promise<Conversation | null> {
    try {
      const result = await query<Conversation>(
        `INSERT INTO conversations (user_id, agent_id, title, model)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          data.user_id,
          data.agent_id || null,
          data.title || null,
          data.model || null,
        ],
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("创建对话失败:", error);
      return null;
    }
  }

  async getConversationsByUserId(
    userId: string,
    limit = 50,
    offset = 0,
  ): Promise<Conversation[]> {
    try {
      const result = await query<Conversation>(
        `SELECT * FROM conversations
         WHERE user_id = $1 AND is_deleted = false
         ORDER BY updated_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      );
      return result.rows;
    } catch (error) {
      console.error("获取对话列表失败:", error);
      return [];
    }
  }

  async getAllConversations(limit = 100, offset = 0): Promise<Conversation[]> {
    try {
      const result = await query<Conversation>(
        `SELECT * FROM conversations
         WHERE is_deleted = false
         ORDER BY updated_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      return result.rows;
    } catch (error) {
      console.error("获取所有对话列表失败:", error);
      return [];
    }
  }

  async getConversationById(
    conversationId: string,
  ): Promise<Conversation | null> {
    try {
      const result = await query<Conversation>(
        "SELECT * FROM conversations WHERE id = $1",
        [conversationId],
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("获取对话失败:", error);
      return null;
    }
  }

  async updateConversation(
    conversationId: string,
    data: Partial<Omit<Conversation, "id" | "created_at" | "updated_at">>,
  ): Promise<Conversation | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(data).forEach(([key, value]) => {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    if (fields.length === 0) {
      return null;
    }

    values.push(conversationId);

    try {
      const result = await query<Conversation>(
        `UPDATE conversations SET ${fields.join(", ")}, updated_at = NOW()
         WHERE id = $${paramIndex}
         RETURNING *`,
        values,
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("更新对话失败:", error);
      return null;
    }
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      await query("UPDATE conversations SET is_deleted = true WHERE id = $1", [
        conversationId,
      ]);
      return true;
    } catch (error) {
      console.error("删除对话失败:", error);
      return false;
    }
  }

  async getConversationCount(): Promise<number> {
    try {
      const result = await query<{ count: string }>(
        "SELECT COUNT(*) as count FROM conversations WHERE is_deleted = false",
      );
      return parseInt(result.rows[0]?.count || "0");
    } catch (error) {
      console.error("获取对话总数失败:", error);
      return 0;
    }
  }

  // ==================== 消息操作 ====================

  async createMessage(data: {
    conversation_id: string;
    role: "user" | "assistant" | "system";
    content: string;
    tokens?: number;
  }): Promise<Message | null> {
    try {
      const result = await query<Message>(
        `INSERT INTO messages (conversation_id, role, content, tokens)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [data.conversation_id, data.role, data.content, data.tokens || null],
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("创建消息失败:", error);
      return null;
    }
  }

  async getMessagesByConversationId(
    conversationId: string,
  ): Promise<Message[]> {
    try {
      const result = await query<Message>(
        "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
        [conversationId],
      );
      return result.rows;
    } catch (error) {
      console.error("获取消息列表失败:", error);
      return [];
    }
  }

  async getMessageCount(): Promise<number> {
    try {
      const result = await query<{ count: string }>(
        "SELECT COUNT(*) as count FROM messages",
      );
      return parseInt(result.rows[0]?.count || "0");
    } catch (error) {
      console.error("获取消息总数失败:", error);
      return 0;
    }
  }

  // ==================== 飞书配置操作 ====================

  async getActiveFeishuConfig(): Promise<FeishuConfig | null> {
    try {
      const result = await query<FeishuConfig>(
        "SELECT * FROM feishu_configs WHERE is_active = true LIMIT 1",
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("获取飞书配置失败:", error);
      return null;
    }
  }

  async updateFeishuConfig(data: {
    app_id: string;
    app_secret: string;
    redirect_uri: string;
  }): Promise<FeishuConfig | null> {
    try {
      // 先将所有配置设为非活跃
      await query("UPDATE feishu_configs SET is_active = false");

      // 插入新配置
      const result = await query<FeishuConfig>(
        `INSERT INTO feishu_configs (app_id, app_secret, redirect_uri, is_active)
         VALUES ($1, $2, $3, true)
         RETURNING *`,
        [data.app_id, data.app_secret, data.redirect_uri],
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("更新飞书配置失败:", error);
      return null;
    }
  }

  // ==================== 系统配置操作 ====================

  async getSystemConfig(key: string): Promise<string | null> {
    try {
      const result = await query<{ value: string }>(
        "SELECT value FROM system_configs WHERE key = $1",
        [key],
      );
      return result.rows[0]?.value || null;
    } catch (error) {
      console.error("获取系统配置失败:", error);
      return null;
    }
  }

  async setSystemConfig(
    key: string,
    value: string,
    description?: string,
  ): Promise<boolean> {
    try {
      await query(
        `INSERT INTO system_configs (key, value, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET value = $2, description = COALESCE($3, system_configs.description), updated_at = NOW()`,
        [key, value, description || null],
      );
      return true;
    } catch (error) {
      console.error("设置系统配置失败:", error);
      return false;
    }
  }

  async getAllSystemConfigs(): Promise<SystemConfig[]> {
    try {
      const result = await query<SystemConfig>(
        "SELECT * FROM system_configs ORDER BY key",
      );
      return result.rows;
    } catch (error) {
      console.error("获取所有系统配置失败:", error);
      return [];
    }
  }

  // ==================== 统计信息 ====================

  async getStatistics(): Promise<{
    userCount: number;
    conversationCount: number;
    messageCount: number;
    activeAgentCount: number;
  }> {
    try {
      const [userCount, conversationCount, messageCount, agentResult] =
        await Promise.all([
          this.getUserCount(),
          this.getConversationCount(),
          this.getMessageCount(),
          query<{ count: string }>(
            "SELECT COUNT(*) as count FROM agents WHERE is_active = true",
          ),
        ]);

      return {
        userCount,
        conversationCount,
        messageCount,
        activeAgentCount: parseInt(agentResult.rows[0]?.count || "0"),
      };
    } catch (error) {
      console.error("获取统计信息失败:", error);
      return {
        userCount: 0,
        conversationCount: 0,
        messageCount: 0,
        activeAgentCount: 0,
      };
    }
  }
}

// 导出单例实例
export const db = new DatabaseService();

// 关闭数据库连接池（用于优雅关闭）
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("✅ 数据库连接池已关闭");
  }
}
