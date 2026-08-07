import { getToken } from "./utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

export async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export async function registerUser(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error("Registration failed");
  }

  return response.json();
}

export async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  return response.json();
}

export async function getInjuries() {
  const response = await authFetch(`${API_URL}/api/injuries`);

  if (!response.ok) {
    throw new Error("Failed to fetch injuries");
  }

  return response.json();
}

export async function getInjury(id: string) {
  const response = await authFetch(`${API_URL}/api/injuries/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch injury");
  }

  return response.json();
}

export async function createInjury(injury: {
  name: string;
  bodyArea: string;
  side: string;
  startDate: string;
  cause: string;
  description: string;
  status: string;
}) {
  const response = await authFetch(`${API_URL}/api/injuries`, {
    method: "POST",
    body: JSON.stringify(injury),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Backend error:", error);
    throw new Error(error);
  }

  return response.json();
}

export async function getSymptoms(injuryId: number) {
  const response = await authFetch(
    `${API_URL}/api/injuries/${injuryId}/symptoms`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch symptoms");
  }

  return response.json();
}

export async function createSymptom(
  injuryId: number,
  symptom: {
    date: string;
    painLevel: number;
    location: string;
    trigger?: string;
    duration?: string;
    notes?: string;
  },
) {
  const response = await authFetch(
    `${API_URL}/api/injuries/${injuryId}/symptoms`,
    {
      method: "POST",
      body: JSON.stringify(symptom),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(error);
    throw new Error("Failed to create symptom");
  }

  return response.json();
}

export async function getTreatments(injuryId: number) {
  const response = await authFetch(
    `${API_URL}/api/injuries/${injuryId}/treatments`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch treatments");
  }

  return response.json();
}

export async function createTreatment(
  injuryId: number,
  treatment: {
    name: string;
    date: string;
    provider?: string;
    cost?: number;
    outcome?: string;
  },
) {
  const response = await authFetch(
    `${API_URL}/api/injuries/${injuryId}/treatments`,
    {
      method: "POST",
      body: JSON.stringify(treatment),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(error);
    throw new Error("Failed to create treatment");
  }

  return response.json();
}

export async function getMedicalVisits(injuryId: number) {
  const response = await authFetch(
    `${API_URL}/api/injuries/${injuryId}/visits`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch medical visits");
  }

  return response.json();
}

export async function createMedicalVisit(
  injuryId: number,
  visit: {
    doctor: string;
    clinic?: string;
    date: string;
    notes?: string;
  },
) {
  const response = await authFetch(
    `${API_URL}/api/injuries/${injuryId}/visits`,
    {
      method: "POST",
      body: JSON.stringify(visit),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(error);
    throw new Error("Failed to create medical visit");
  }

  return response.json();
}

export async function getTimelineEvents(injuryId: number) {
  const response = await authFetch(
    `${API_URL}/api/injuries/${injuryId}/events`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch timeline events");
  }

  return response.json();
}

export async function createTimelineEvent(
  injuryId: number,
  event: {
    type: string;
    date: string;
    description: string;
    result?: string;
  },
) {
  const response = await authFetch(
    `${API_URL}/api/injuries/${injuryId}/events`,
    {
      method: "POST",
      body: JSON.stringify(event),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(error);
    throw new Error("Failed to create timeline event");
  }

  return response.json();
}
