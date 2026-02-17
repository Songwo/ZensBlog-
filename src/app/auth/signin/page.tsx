"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Github } from "lucide-react";

export default function SignInPage() {
  const [callbackUrl, setCallbackUrl] = useState("/");
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [githubAvailable, setGithubAvailable] = useState(true);
  const [checkingGithub, setCheckingGithub] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("callbackUrl");
    if (target) setCallbackUrl(target);

    const authError = params.get("error");
    if (authError === "github_callback_failed") {
      setError("GitHub 登录失败：服务器当前无法稳定连接 GitHub，请稍后重试或使用管理员登录。");
    } else if (authError === "auth_failed" || authError) {
      setError("登录流程异常，请稍后重试。");
    }
  }, []);

  useEffect(() => {
    (async () => {
      setCheckingGithub(true);
      try {
        const res = await fetch("/api/auth/github-status", { cache: "no-store" });
        const data = (await res.json()) as { available?: boolean };
        setGithubAvailable(Boolean(data.available));
      } catch {
        setGithubAvailable(false);
      } finally {
        setCheckingGithub(false);
      }
    })();
  }, []);

  async function githubSignIn() {
    if (!githubAvailable) return;
    setError("");
    setLoading(true);
    try {
      await signIn("github", { callbackUrl: callbackUrl || "/" });
    } catch (err) {
      console.error("[GitHub SignIn Error]", err);
      setError("GitHub 登录失败，请稍后重试");
      setLoading(false);
    }
  }

  async function credentialsSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error || !result?.ok) {
        setError(result?.error ? `登录失败：${result.error}` : "登录失败，请检查账号密码");
        console.error("[Credentials SignIn Failed]", result);
        setLoading(false);
        return;
      }
      router.push(result?.url || callbackUrl);
      router.refresh();
    } catch (err) {
      console.error("[Credentials SignIn Error]", err);
      setError("登录失败，请稍后重试");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#eceff5] bg-white/75 p-8 backdrop-blur-xl shadow-[0_12px_36px_rgba(17,24,39,0.08)]">
        <h1 className="text-2xl font-bold text-[#141414]">登录 ZEN::LAB</h1>
        <p className="text-sm text-[#64748b] mt-2">使用 GitHub 登录参与社区发帖、评论与徽章体系。</p>

        <button
          type="button"
          onClick={githubSignIn}
          disabled={loading || !githubAvailable || checkingGithub}
          className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#24292e] text-sm font-medium !text-white transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[#2c3137] disabled:opacity-50"
        >
          <Github size={16} aria-hidden="true" />
          {checkingGithub ? "检测 GitHub 连接..." : loading ? "跳转中..." : githubAvailable ? "使用 GitHub 登录" : "GitHub 当前不可用"}
        </button>
        {!checkingGithub && !githubAvailable && (
          <p className="mt-2 text-xs text-amber-600">当前服务器到 GitHub 网络不稳定，建议先使用管理员登录。</p>
        )}

        <div className="my-6 text-center text-xs text-[#94a3b8]">或使用管理员账号</div>

        <form onSubmit={credentialsSignIn} className="space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="管理员用户名"
            className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-sm"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
            className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-sm"
            required
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg border border-[#f2a3c4] bg-[#fff0f6] py-2.5 text-sm font-medium text-[#a61e5d] hover:bg-[#ffe8f1] disabled:opacity-50"
          >
            管理员登录
          </button>
        </form>
      </div>
    </div>
  );
}
