/**
 * 管理后台 API - 用户管理（单个用户操作）
 * 路由：PATCH/DELETE /api/admin/users/[id]
 */

import { NextRequest } from "next/server";
import { withAdmin, successResponse, errorResponse } from "@/app/lib/api-utils";
import { db } from "@/app/lib/db";

export const runtime = "nodejs";

/**
 * 更新用户信息（状态、角色等）
 */
export const PATCH = withAdmin(
  async (request: NextRequest, { params, user }: any) => {
    try {
      const userId = params?.id;
      const body = await request.json();

      if (!userId) {
        return errorResponse("用户ID不能为空", 400);
      }

      // 获取目标用户
      const targetUser = await db.getUserById(userId);
      if (!targetUser) {
        return errorResponse("用户不存在", 404);
      }

      // 处理角色更新
      if (body.role !== undefined) {
        // 只有超级管理员可以修改角色
        if (user.role !== "super_admin") {
          return errorResponse("需要超级管理员权限才能修改用户角色", 403);
        }

        const newRole = body.role;

        if (newRole === "user") {
          // 移除管理员权限
          await db.removeAdmin(userId);
        } else if (newRole === "admin" || newRole === "super_admin") {
          // 添加或更新管理员权限
          const existingAdmin = await db.getAdminByUserId(userId);
          if (existingAdmin) {
            // 更新现有管理员角色
            await db.removeAdmin(userId);
          }
          await db.createAdmin(userId, newRole);
        } else {
          return errorResponse("无效的角色类型", 400);
        }
      }

      // 处理其他字段更新（如 is_active）
      const updateData: any = {};
      if (body.is_active !== undefined) {
        updateData.is_active = body.is_active;
      }
      if (body.name !== undefined) {
        updateData.name = body.name;
      }
      if (body.email !== undefined) {
        updateData.email = body.email;
      }

      // 更新用户基本信息
      if (Object.keys(updateData).length > 0) {
        await db.updateUser(userId, updateData);
      }

      // 获取更新后的用户信息
      const updatedUser = await db.getUserById(userId);
      const role = await db.getAdminRole(userId);

      return successResponse({
        user: {
          ...updatedUser,
          role: role || "user",
        },
      });
    } catch (error) {
      console.error("更新用户失败:", error);
      return errorResponse("服务器内部错误", 500);
    }
  },
);

/**
 * 删除用户（软删除或硬删除）
 */
export const DELETE = withAdmin(
  async (request: NextRequest, { params, user }: any) => {
    try {
      const userId = params?.id;

      if (!userId) {
        return errorResponse("用户ID不能为空", 400);
      }

      // 只有超级管理员可以删除用户
      if (user.role !== "super_admin") {
        return errorResponse("需要超级管理员权限才能删除用户", 403);
      }

      // 不能删除自己
      if (userId === user.userId) {
        return errorResponse("不能删除当前登录的管理员账号", 400);
      }

      // 检查用户是否存在
      const targetUser = await db.getUserById(userId);
      if (!targetUser) {
        return errorResponse("用户不存在", 404);
      }

      // 这里实现软删除（禁用账号）而不是真正删除
      await db.updateUser(userId, { is_active: false });

      return successResponse({ message: "用户已禁用" });
    } catch (error) {
      console.error("删除用户失败:", error);
      return errorResponse("服务器内部错误", 500);
    }
  },
);
