/**
 * 阿里云百炼 DashScope SDK 封装
 * 文档：https://help.aliyun.com/zh/model-studio/developer-reference/use-qwen-by-calling-api
 * 智能体API：https://help.aliyun.com/zh/model-studio/developer-reference/agentruntime
 */

import axios from "axios";

// DashScope API 基础 URL
const DASHSCOPE_API_BASE = "https://dashscope.aliyuncs.com/api/v1";

// DashScope 配置接口
export interface DashScopeConfig {
  apiKey: string;
  appId?: string;
}

// 消息接口
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// 智能体调用参数
export interface AgentCallParams {
  appId: string;
  messages: ChatMessage[];
  userId?: string;
  sessionId?: string;
  stream?: boolean;
}

// 智能体响应接口
export interface AgentResponse {
  requestId: string;
  output: {
    text: string;
    finishReason: string;
  };
  usage: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
  };
}

// 流式响应事件
export interface StreamEvent {
  event: "message" | "error" | "done";
  data?: string;
  error?: string;
}

/**
 * DashScope 服务类
 */
export class DashScopeService {
  private config: DashScopeConfig;

  constructor(config: DashScopeConfig) {
    this.config = config;
  }

  /**
   * 调用智能体应用（非流式）
   */
  async callAgent(params: AgentCallParams): Promise<AgentResponse | null> {
    try {
      // 使用智能体专用端点
      const url = `${DASHSCOPE_API_BASE}/apps/${params.appId}/completion`;

      const response = await axios.post(
        url,
        {
          input: {
            messages: params.messages,
          },
          parameters: {
            result_format: "message",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
            "X-DashScope-SSE": "disable",
          },
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 400,
          proxy: false, // 禁用代理
          httpAgent: undefined,
          httpsAgent: undefined,
        },
      );

      if (response.data.code) {
        console.error("DashScope API 错误:", response.data);
        return null;
      }

      return {
        requestId: response.data.request_id,
        output: {
          text: response.data.output.choices[0].message.content,
          finishReason: response.data.output.choices[0].finish_reason,
        },
        usage: {
          totalTokens: response.data.usage.total_tokens,
          inputTokens: response.data.usage.input_tokens,
          outputTokens: response.data.usage.output_tokens,
        },
      };
    } catch (error: any) {
      console.error(
        "调用 DashScope Agent 失败:",
        error.response?.data || error,
      );
      return null;
    }
  }

  /**
   * 调用智能体应用（流式）
   */
  async *callAgentStream(
    params: AgentCallParams,
  ): AsyncGenerator<StreamEvent, void, unknown> {
    try {
      console.log("[DashScope] 准备调用流式 API");
      console.log("[DashScope] appId:", params.appId);
      console.log("[DashScope] messages count:", params.messages.length);

      // 使用智能体专用端点
      const url = `${DASHSCOPE_API_BASE}/apps/${params.appId}/completion`;
      console.log("[DashScope] URL:", url);

      const response = await axios.post(
        url,
        {
          input: {
            messages: params.messages,
          },
          parameters: {
            result_format: "message",
            incremental_output: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
            "X-DashScope-SSE": "enable",
            Accept: "text/event-stream",
          },
          responseType: "stream",
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 400,
          proxy: false, // 禁用代理
          httpAgent: undefined,
          httpsAgent: undefined,
        },
      );

      console.log("[DashScope] 响应状态:", response.status);
      console.log("[DashScope] 响应头:", response.headers);

      // 如果是错误状态，读取错误信息
      if (response.status >= 400) {
        let errorData = "";
        for await (const chunk of response.data) {
          errorData += chunk.toString();
        }
        console.error("[DashScope] API 错误响应体:", errorData);
        yield {
          event: "error",
          error: `API error ${response.status}: ${errorData}`,
        };
        return;
      }

      // 处理 SSE 流
      const stream = response.data;
      let buffer = "";
      let currentEvent = "";

      console.log("[DashScope] 开始读取流数据...");
      for await (const chunk of stream) {
        console.log("[DashScope] 收到数据块，长度:", chunk.length);
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue; // 跳过空行

          console.log("[DashScope] 处理行:", trimmedLine.substring(0, 100));

          // 处理 event: 行
          if (trimmedLine.startsWith("event:")) {
            currentEvent = trimmedLine.substring(6).trim();
            console.log("[DashScope] 事件类型:", currentEvent);
            continue;
          }

          // 处理 data: 行
          if (trimmedLine.startsWith("data:")) {
            const data = trimmedLine.substring(5).trim();

            if (data === "[DONE]") {
              console.log("[DashScope] 收到 DONE 信号");
              yield { event: "done" };
              return;
            }

            try {
              const json = JSON.parse(data);
              console.log(
                "[DashScope] 解析 JSON:",
                JSON.stringify(json).substring(0, 200),
              );

              // 检查错误
              if (json.code) {
                console.log("[DashScope] API 返回错误:", json.message);
                yield { event: "error", error: json.message };
                return;
              }

              // 智能体应用的响应格式：output.text
              const content = json.output?.text || "";
              const finishReason = json.output?.finish_reason;

              console.log("[DashScope] content:", content);
              console.log("[DashScope] finishReason:", finishReason);

              // 先发送内容（如果有的话）
              if (content) {
                console.log(
                  "[DashScope] 提取到内容，准备 yield:",
                  content.substring(0, 50),
                );
                yield { event: "message", data: content };
                console.log("[DashScope] 已 yield message 事件");
              }

              // 再检查是否结束
              if (finishReason === "stop") {
                console.log("[DashScope] 收到 finish_reason: stop，准备结束");
                yield { event: "done" };
                console.log("[DashScope] 已 yield done 事件");
                return;
              }
            } catch (e) {
              console.log(
                "[DashScope] JSON 解析失败:",
                e,
                "数据:",
                data.substring(0, 100),
              );
              // 忽略解析错误
            }
          }
        }
      }
      console.log("[DashScope] 流数据读取完成");
    } catch (error: any) {
      console.error(
        "[DashScope] 调用失败:",
        error.response?.data || error.message || error,
      );
      console.error("[DashScope] 错误详情:", error);
      yield { event: "error", error: error.message };
    }
  }

  /**
   * 创建流式响应（用于 Next.js API）
   */
  async createStreamResponse(params: AgentCallParams): Promise<ReadableStream> {
    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        const service = new DashScopeService({
          apiKey: params.appId, // 临时使用
        });

        try {
          for await (const event of service.callAgentStream(params)) {
            if (event.event === "message" && event.data) {
              controller.enqueue(encoder.encode(`data: ${event.data}\n\n`));
            } else if (event.event === "error") {
              controller.enqueue(
                encoder.encode(`data: [ERROR] ${event.error}\n\n`),
              );
              controller.close();
              break;
            } else if (event.event === "done") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              break;
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }
}

/**
 * 从环境变量获取 DashScope 配置
 */
export function getDashScopeConfig(): DashScopeConfig | null {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const appId = process.env.DASHSCOPE_APP_ID;

  if (!apiKey) {
    console.error("缺少 DASHSCOPE_API_KEY 环境变量");
    return null;
  }

  return {
    apiKey,
    appId,
  };
}

/**
 * 创建 DashScope 服务实例
 */
export function createDashScopeService(): DashScopeService | null {
  const config = getDashScopeConfig();
  if (!config) {
    return null;
  }

  return new DashScopeService(config);
}
