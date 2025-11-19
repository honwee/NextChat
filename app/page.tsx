import { Analytics } from "@vercel/analytics/react";
import { Home } from "./components/home";
import { getServerSideConfig } from "./config/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const serverConfig = getServerSideConfig();

export default async function App() {
  // 检查用户是否登录
  const cookieStore = cookies();
  const token = cookieStore.get("jwt_token");

  // 如果没有 token，重定向到登录页
  if (!token) {
    redirect("/login");
  }

  // 这里可以进一步验证 token 是否有效
  // 为了性能，我们只检查 token 是否存在
  // 真正的验证会在 API 中间件中进行

  return (
    <>
      <Home />
      {serverConfig?.isVercel && (
        <>
          <Analytics />
        </>
      )}
    </>
  );
}
