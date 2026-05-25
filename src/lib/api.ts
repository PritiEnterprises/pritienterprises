export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data as T;
}

export function apiError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
