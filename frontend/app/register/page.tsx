"use client";

import { useState, useEffect } from "react";
import type { SubmitEventHandler } from "react";
import { registerUser } from "../../services/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

import PageContainer from "@/components/PageContainer";
import AuthCard from "@/components/AuthCard";
import AuthHeader from "@/components/AuthHeader";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  return (
    <PageContainer>
      <div className="w-full max-w-md">
        <AuthHeader />

        <AuthCard title="Create your account">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>

              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>

              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              Register
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Log in
              </Link>
            </p>
          </form>

          {message && <p className="mt-4 text-center text-sm">{message}</p>}
        </AuthCard>
      </div>
    </PageContainer>
  );
}
