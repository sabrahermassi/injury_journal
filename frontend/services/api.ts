const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

export interface Injury {
  id: number;
  name: string;
  bodyArea: string;
  side: string | null;
  startDate: string;
  cause: string | null;
  description: string | null;
  status: string | null;
  createdAt: string;
}

export interface Symptom {
  id: number;
  date: string;
  painLevel: number;
  location: string | null;
  trigger: string | null;
  duration: string | null;
  notes: string | null;
}

export interface Treatment {
  id: number;
  name: string;
  provider: string | null;
  date: string;
  cost: number | null;
  outcome: string | null;
  followUpDueAt: string | null;
}

export interface TreatmentOutcome {
  id: number;
  recordedAt: string;
  status: string;
  reliefDays: number | null;
  painLevel: number | null;
  notes: string | null;
  treatmentId: number;
}

export interface MedicalVisit {
  id: number;
  doctor: string | null;
  clinic: string | null;
  date: string;
  notes: string | null;
}

export interface TimelineEvent {
  id: number;
  type: string;
  date: string;
  description: string;
  result: string | null;
}

export interface CurrentUser {
  id: number;
  email: string;
}

function getCsrfToken(): string | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  return sessionStorage.getItem("csrfToken");
}

// There is no GET /api/auth/me — the only place the backend returns the
// user's own record is the login response. Stashed alongside the CSRF token
// so the UI has something real to show instead of a placeholder name; a hard
// refresh with no re-login clears it, and callers should treat null as "we
// don't know", not "signed out".
export function getCurrentUser(): CurrentUser | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem("currentUser");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

export async function authFetch(url: string, options: RequestInit = {}) {
  const csrfToken = getCsrfToken();

  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...options.headers,
    },
  });
}

export async function registerUser(email: string, password: string) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    credentials: "include",
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
    credentials: "include",
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

  const data = await response.json();

  if (typeof sessionStorage !== "undefined") {
    if (data.csrfToken) {
      sessionStorage.setItem("csrfToken", data.csrfToken);
    }

    if (data.user) {
      sessionStorage.setItem("currentUser", JSON.stringify(data.user));
    }
  }

  return data;
}

export async function logoutUser() {
  const response = await authFetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }

  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem("csrfToken");
    sessionStorage.removeItem("currentUser");
  }
}

export async function getInjuries(): Promise<Injury[]> {
  const response = await authFetch(`${API_URL}/api/injuries`);

  if (!response.ok) {
    throw new Error("Failed to fetch injuries");
  }

  return response.json();
}

export async function getInjury(id: string): Promise<Injury> {
  const response = await authFetch(`${API_URL}/api/injuries/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch injury");
  }

  return response.json();
}

export async function createInjury(injury: {
  name: string;
  bodyArea: string;
  side: string | null;
  startDate: string;
  cause: string | null;
  description: string | null;
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

export async function updateInjury(id: number, injury: Partial<Injury>) {
  const response = await authFetch(`${API_URL}/api/injuries/${id}`, {
    method: "PUT",
    body: JSON.stringify(injury),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(error);
    throw new Error("Failed to update injury");
  }

  return response.json();
}

export async function deleteInjury(id: number) {
  const response = await authFetch(`${API_URL}/api/injuries/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete injury");
  }
}

export async function getSymptoms(injuryId: number): Promise<Symptom[]> {
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

export async function updateSymptom(id: number, symptom: Partial<Symptom>) {
  const response = await authFetch(`${API_URL}/api/symptoms/${id}`, {
    method: "PUT",
    body: JSON.stringify(symptom),
  });

  if (!response.ok) {
    throw new Error("Failed to update symptom");
  }

  return response.json();
}

export async function deleteSymptom(id: number) {
  const response = await authFetch(`${API_URL}/api/symptoms/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete symptom");
  }
}

export async function getTreatments(injuryId: number): Promise<Treatment[]> {
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
    followUpDueAt?: string;
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

export async function updateTreatment(
  id: number,
  treatment: Partial<Treatment>,
) {
  const response = await authFetch(`${API_URL}/api/treatments/${id}`, {
    method: "PUT",
    body: JSON.stringify(treatment),
  });

  if (!response.ok) {
    throw new Error("Failed to update treatment");
  }

  return response.json();
}

export async function deleteTreatment(id: number) {
  const response = await authFetch(`${API_URL}/api/treatments/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete treatment");
  }
}

export async function getTreatmentOutcomes(
  treatmentId: number,
): Promise<TreatmentOutcome[]> {
  const response = await authFetch(
    `${API_URL}/api/treatments/${treatmentId}/outcomes`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch treatment outcomes");
  }

  return response.json();
}

export async function createTreatmentOutcome(
  treatmentId: number,
  outcome: {
    status: string;
    reliefDays?: number;
    painLevel?: number;
    notes?: string;
  },
) {
  const response = await authFetch(
    `${API_URL}/api/treatments/${treatmentId}/outcomes`,
    {
      method: "POST",
      body: JSON.stringify(outcome),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(error);
    throw new Error("Failed to record treatment outcome");
  }

  return response.json();
}

export async function deleteTreatmentOutcome(id: number) {
  const response = await authFetch(`${API_URL}/api/treatment-outcomes/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete treatment outcome");
  }
}

export async function getMedicalVisits(
  injuryId: number,
): Promise<MedicalVisit[]> {
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

export async function updateMedicalVisit(
  id: number,
  visit: Partial<MedicalVisit>,
) {
  const response = await authFetch(`${API_URL}/api/visits/${id}`, {
    method: "PUT",
    body: JSON.stringify(visit),
  });

  if (!response.ok) {
    throw new Error("Failed to update medical visit");
  }

  return response.json();
}

export async function deleteMedicalVisit(id: number) {
  const response = await authFetch(`${API_URL}/api/visits/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete medical visit");
  }
}

export async function getTimelineEvents(
  injuryId: number,
): Promise<TimelineEvent[]> {
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

export async function updateTimelineEvent(
  id: number,
  event: Partial<TimelineEvent>,
) {
  const response = await authFetch(`${API_URL}/api/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error("Failed to update timeline event");
  }

  return response.json();
}

export async function deleteTimelineEvent(id: number) {
  const response = await authFetch(`${API_URL}/api/events/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete timeline event");
  }
}
