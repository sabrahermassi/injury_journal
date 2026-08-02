"use client";

import { useState, useEffect } from "react";
import type { SubmitEventHandler } from "react";
import { loginUser } from "../../services/api";
import { saveToken } from "../../services/utils";
import { useRouter } from "next/navigation";

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
    setMessage("Logging User...");
    try {
      const data = await loginUser(email, password);

      saveToken(data.token);
      router.push("/dashboard");
    } catch {
      setMessage("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
        </div>

        <button type="submit" disabled={loading}>
          Login
        </button>
      </form>

      <p>{message}</p>
    </main>
  );
}
