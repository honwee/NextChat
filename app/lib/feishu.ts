/**
 * 飞书 OAuth 2.0 SDK 封装
 * 文档：https://open.feishu.cn/document/uYjL24iN/ukzN1YjL5cTN24SO3UjN
 */

import axios from "axios";

// 飞书 API 基础 URL
const FEISHU_API_BASE = "https://open.feishu.cn/open-apis";

// 飞书配置接口
export interface FeishuConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

// 飞书用户信息接口
export interface FeishuUserInfo {
  sub: string; // 用户唯一标识
  name: string; // 用户名
  picture?: string; // 头像 URL
  email?: string; // 邮箱
  open_id: string; // Open ID
  union_id: string; // Union ID
  en_name?: string; // 英文名
  tenant_key: string; // 租户 key
  employee_no?: string; // 员工工号
  mobile?: string; // 手机号
}

// 飞书 Token 响应接口
export interface FeishuTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  scope: string;
}

/**
 * 飞书 OAuth 服务类
 */
export class FeishuOAuthService {
  private config: FeishuConfig;

  constructor(config: FeishuConfig) {
    this.config = config;
  }

  /**
   * 生成授权 URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      app_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      state: state || Math.random().toString(36).substring(7),
    });

    return `${FEISHU_API_BASE}/authen/v1/authorize?${params.toString()}`;
  }

  /**
   * 获取 App Access Token（应用级别令牌）
   */
  async getAppAccessToken(): Promise<string | null> {
    try {
      const response = await axios.post(
        `${FEISHU_API_BASE}/auth/v3/app_access_token/internal`,
        {
          app_id: this.config.appId,
          app_secret: this.config.appSecret,
        },
      );

      if (response.data.code !== 0) {
        console.error("获取 App Access Token 失败:", response.data);
        return null;
      }

      return response.data.app_access_token;
    } catch (error) {
      console.error("获取 App Access Token 异常:", error);
      return null;
    }
  }

  /**
   * 通过 Authorization Code 获取 User Access Token
   */
  async getUserAccessToken(code: string): Promise<FeishuTokenResponse | null> {
    try {
      // 先获取 App Access Token
      const appAccessToken = await this.getAppAccessToken();
      if (!appAccessToken) {
        return null;
      }

      const response = await axios.post(
        `${FEISHU_API_BASE}/authen/v1/oidc/access_token`,
        {
          grant_type: "authorization_code",
          code,
        },
        {
          headers: {
            Authorization: `Bearer ${appAccessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.code !== 0) {
        console.error("获取 User Access Token 失败:", response.data);
        return null;
      }

      return response.data.data;
    } catch (error) {
      console.error("获取 User Access Token 异常:", error);
      return null;
    }
  }

  /**
   * 刷新 User Access Token
   */
  async refreshUserAccessToken(
    refreshToken: string,
  ): Promise<FeishuTokenResponse | null> {
    try {
      // 先获取 App Access Token
      const appAccessToken = await this.getAppAccessToken();
      if (!appAccessToken) {
        return null;
      }

      const response = await axios.post(
        `${FEISHU_API_BASE}/authen/v1/oidc/refresh_access_token`,
        {
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        },
        {
          headers: {
            Authorization: `Bearer ${appAccessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.code !== 0) {
        console.error("刷新 User Access Token 失败:", response.data);
        return null;
      }

      return response.data.data;
    } catch (error) {
      console.error("刷新 User Access Token 异常:", error);
      return null;
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userAccessToken: string): Promise<FeishuUserInfo | null> {
    try {
      const response = await axios.get(
        `${FEISHU_API_BASE}/authen/v1/user_info`,
        {
          headers: {
            Authorization: `Bearer ${userAccessToken}`,
          },
        },
      );

      if (response.data.code !== 0) {
        console.error("获取用户信息失败:", response.data);
        return null;
      }

      return response.data.data;
    } catch (error) {
      console.error("获取用户信息异常:", error);
      return null;
    }
  }

  /**
   * 完整的登录流程：通过 code 获取用户信息
   */
  async loginWithCode(code: string): Promise<{
    userInfo: FeishuUserInfo;
    token: FeishuTokenResponse;
  } | null> {
    try {
      // 1. 获取 Access Token
      const tokenResponse = await this.getUserAccessToken(code);
      if (!tokenResponse) {
        return null;
      }

      // 2. 获取用户信息
      const userInfo = await this.getUserInfo(tokenResponse.access_token);
      if (!userInfo) {
        return null;
      }

      return {
        userInfo,
        token: tokenResponse,
      };
    } catch (error) {
      console.error("飞书登录流程失败:", error);
      return null;
    }
  }
}

/**
 * 从环境变量或数据库获取飞书配置
 */
export async function getFeishuConfig(): Promise<FeishuConfig | null> {
  // 优先从环境变量读取
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const redirectUri = process.env.FEISHU_REDIRECT_URI;

  if (appId && appSecret && redirectUri) {
    return {
      appId,
      appSecret,
      redirectUri,
    };
  }

  // 如果环境变量没有，从数据库读取
  try {
    const { db } = await import("./db");
    const config = await db.getActiveFeishuConfig();

    if (config) {
      return {
        appId: config.app_id,
        appSecret: config.app_secret,
        redirectUri: config.redirect_uri,
      };
    }
  } catch (error) {
    console.error("从数据库获取飞书配置失败:", error);
  }

  return null;
}

/**
 * 创建飞书 OAuth 服务实例
 */
export async function createFeishuService(): Promise<FeishuOAuthService | null> {
  const config = await getFeishuConfig();
  if (!config) {
    console.error("飞书配置不存在");
    return null;
  }

  return new FeishuOAuthService(config);
}
