"use client";

import { useEffect, useState } from "react";
import { getInjuries } from "../../services/api";

export default function DashboardPage() {
  const [injuries, setInjuries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInjuries() {
      try {
        const data = await getInjuries();
        setInjuries(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchInjuries();
  }, []);

  if (loading) {
    return <p>Loading injuries...</p>;
  }

  return (
    <main>
      <h1>Dashboard</h1>

      {injuries.length === 0 ? (
        <p>No injuries found</p>
      ) : (
        injuries.map((injury) => (
          <div key={injury.id}>
            <h2>{injury.name}</h2>
            <p>Area: {injury.bodyArea}</p>
            <p>Side: {injury.side}</p>
            <p>Status: {injury.status}</p>
          </div>
        ))
      )}
    </main>
  );
}
