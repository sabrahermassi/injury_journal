"use client";

import { useState, useEffect } from "react";
import type { SubmitEventHandler } from "react";
import { registerUser } from "../../services/api";

export default function RegisterPage() {
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
      setEmail("");
      setPassword("");
    } catch {
      setMessage("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>Create account</h1>

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
          Register
        </button>
      </form>

      <p>{message}</p>
    </main>
  );
}
