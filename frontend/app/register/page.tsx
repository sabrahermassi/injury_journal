"use client";

import { useState, useEffect } from "react";
import type { SubmitEventHandler } from "react";
import { registerUser } from "../../services/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AuthLayout } from "@/components/auth-layout";
import { AuthField, AuthPasswordField } from "@/components/auth-field";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
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
    setMessage("Creating account...");

    try {
      const user = await registerUser(email, password);

      setMessage(`User created: ${user.email}`);

      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch {
      setMessage("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // The design has no sign-up frame — only "Web · sign in". This mirrors it
  // so the two screens are one flow rather than two visual languages.
  return (
    <AuthLayout
      title="Start your record"
      subtitle="A few seconds now, and the next appointment has something to go on."
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
          autoComplete="new-password"
          hint="At least 8 characters."
        />

        <Button
          type="submit"
          disabled={loading}
          className="mt-2.5 h-14 rounded-full text-[15px] font-semibold"
        >
          {loading ? "Creating account..." : "Create account"}
        </Button>

        <p aria-live="polite" className="min-h-5 text-center text-sm text-muted-foreground">
          {message}
        </p>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-accent-foreground hover:text-foreground"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
