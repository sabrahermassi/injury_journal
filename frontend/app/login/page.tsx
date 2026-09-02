"use client";

import { useState, useEffect } from "react";
import type { SubmitEventHandler } from "react";
import { loginUser } from "../../services/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AuthLayout } from "@/components/auth-layout";
import { AuthField, AuthPasswordField } from "@/components/auth-field";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    setLoading(true);

    try {
      await loginUser(email, password);

      router.push("/dashboard");
    } catch {
      setMessage("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Your journal is right where you left it."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />

        <AuthPasswordField
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        {/* The design's frame also has "Keep me signed in", "Forgot
            password?", and Apple/Google buttons under an "or" divider. None
            of the three exists: the session length is fixed by the login
            cookie, there is no password-reset route, and there is no OAuth
            provider wired up — backend/src/routes.js has exactly
            /auth/login, /auth/register and /auth/logout. They are left out
            rather than shipped as controls that go nowhere. */}

        <Button
          type="submit"
          disabled={loading}
          className="mt-2.5 h-14 rounded-full text-[15px] font-semibold"
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>

        <p aria-live="polite" className="min-h-5 text-center text-sm text-destructive">
          {message}
        </p>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-accent-foreground hover:text-foreground"
          >
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
