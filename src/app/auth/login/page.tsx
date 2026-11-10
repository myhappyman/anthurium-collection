import type { Metadata } from "next";

import { getSupabaseConfig } from "@/lib/supabase/config";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "관리자 로그인",
};

export default function LoginPage() {
  const isConfigured = getSupabaseConfig() !== null;

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">OWNER ACCESS</p>
        <h1>컬렉션 관리 로그인</h1>
        {isConfigured ? (
          <>
            <p>등록된 이메일로 일회용 로그인 링크를 전송합니다.</p>
            <LoginForm />
          </>
        ) : (
          <div className="setup-notice">
            <strong>Supabase 연결이 필요합니다.</strong>
            <p>
              `.env.example`을 `.env.local`로 복사하고 프로젝트 URL과 공개 키를
              설정하세요.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
