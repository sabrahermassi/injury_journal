"use client";

import { useState } from "react";
import type { SubmitEventHandler } from "react";
import { registerUser } from "../../services/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    try {
      const user = await registerUser(email, password);

      setMessage(`User created: ${user.email}`);
    } catch {
      setMessage("Registration failed");
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

        <button type="submit">Register</button>
      </form>

      <p>{message}</p>
    </main>
  );
}
