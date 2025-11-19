/**
 * 聊天 API - 与智能体对话
 * 路由：POST /api/chat
 */

import { NextRequest } from "next/server";
import { withAuth, errorResponse, validateParams } from "@/app/lib/api-utils";
import { db } from "@/app/lib/db";
import { createDashScopeService, ChatMessage } from "@/app/lib/dashscope";

export const runtime = "nodejs";

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    console.log("[Chat API] 开始处理聊天请求");
    console.log("[Chat API] 用户 ID:", user.userId);

    const body = await request.json();
    console.log("[Chat API] 请求体:", JSON.stringify(body));

    // 验证参数
    const validation = validateParams(body, ["conversationId", "message"]);
    if (!validation.valid) {
      console.log("[Chat API] 参数验证失败:", validation.missing);
      return errorResponse(
        `缺少必要参数: ${validation.missing?.join(", ")}`,
        400,
      );
    }

    const { conversationId, message, stream = true } = body;
    console.log("[Chat API] conversationId:", conversationId);
    console.log("[Chat API] message:", message);
    console.log("[Chat API] stream:", stream);

    // 获取对话信息
    console.log("[Chat API] 查询对话信息...");
    const conversation = await db.getConversationById(conversationId);

    if (!conversation) {
      console.log("[Chat API] 对话不存在");
      return errorResponse("对话不存在", 404);
    }

    console.log(
      "[Chat API] 找到对话:",
      conversation.id,
      "agent_id:",
      conversation.agent_id,
    );

    // 检查权限
    if (conversation.user_id !== user.userId) {
      console.log("[Chat API] 权限检查失败");
      return errorResponse("无权访问此对话", 403);
    }

    // 保存用户消息
    console.log("[Chat API] 保存用户消息...");
    await db.createMessage({
      conversation_id: conversationId,
      role: "user",
      content: message,
    });

    // 获取历史消息（最近 20 条）
    console.log("[Chat API] 获取历史消息...");
    const messages = await db.getMessagesByConversationId(conversationId);
    const recentMessages = messages.slice(-20);
    console.log("[Chat API] 历史消息数量:", recentMessages.length);

    // 构建 DashScope 消息格式
    const chatMessages: ChatMessage[] = recentMessages.map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    }));

    // 创建 DashScope 服务
    console.log("[Chat API] 创建 DashScope 服务...");
    const dashscopeService = createDashScopeService();
    if (!dashscopeService) {
      console.log("[Chat API] DashScope 配置错误");
      return errorResponse("DashScope 配置错误", 500);
    }

    // 获取智能体信息
    let agentId = conversation.agent_id;
    console.log("[Chat API] conversation.agent_id:", agentId);
    if (agentId) {
      const agent = await db.getAgentById(agentId);
      if (agent) {
        agentId = agent.dashscope_app_id;
        console.log("[Chat API] 使用智能体的 dashscope_app_id:", agentId);
      }
    } else {
      // 使用默认智能体
      agentId = process.env.DASHSCOPE_APP_ID;
      console.log("[Chat API] 使用默认 DASHSCOPE_APP_ID:", agentId);
    }

    if (!agentId) {
      console.log("[Chat API] 未配置智能体");
      return errorResponse("未配置智能体", 500);
    }

    console.log("[Chat API] 最终使用的 agentId:", agentId);

    // 流式响应
    if (stream) {
      console.log("[Chat API] 开始流式响应...");
      const encoder = new TextEncoder();
      let assistantMessage = "";

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            console.log("[Chat API] 调用 DashScope Agent Stream...");
            let eventCount = 0;
            for await (const event of dashscopeService.callAgentStream({
              appId: agentId!,
              messages: chatMessages,
            })) {
              eventCount++;
              console.log(
                `[Chat API] 收到事件 #${eventCount}:`,
                event.event,
                event.data?.substring(0, 50),
              );

              if (event.event === "message" && event.data) {
                assistantMessage += event.data;
                // 使用 JSON 编码来保护换行符
                const sseData = `data: ${JSON.stringify(event.data)}\n\n`;
                console.log(
                  "[Chat API] 发送 SSE 数据:",
                  sseData.substring(0, 100),
                );
                controller.enqueue(encoder.encode(sseData));
              } else if (event.event === "error") {
                console.error("[Chat API] 收到错误事件:", event.error);
                controller.enqueue(
                  encoder.encode(`data: [ERROR] ${event.error}\n\n`),
                );
                controller.close();
                return;
              } else if (event.event === "done") {
                console.log("[Chat API] 收到 done 事件，保存消息...");
                // 保存助手消息
                await db.createMessage({
                  conversation_id: conversationId,
                  role: "assistant",
                  content: assistantMessage,
                });

                console.log("[Chat API] 发送 DONE 信号");
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }
            }
            console.log(`[Chat API] 流结束，共收到 ${eventCount} 个事件`);
          } catch (error) {
            console.error("[Chat API] 流式响应错误:", error);
            controller.error(error);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // 非流式响应
    const response = await dashscopeService.callAgent({
      appId: agentId,
      messages: chatMessages,
    });

    if (!response) {
      return errorResponse("调用智能体失败", 500);
    }

    // 保存助手消息
    await db.createMessage({
      conversation_id: conversationId,
      role: "assistant",
      content: response.output.text,
      tokens: response.usage.totalTokens,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: response.output.text,
          usage: response.usage,
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("聊天失败:", error);
    return errorResponse("服务器内部错误", 500);
  }
});
