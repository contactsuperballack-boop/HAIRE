// Browser-side POST through the proxy. Returns parsed JSON or throws an Error with a readable message.
export async function post<T = unknown>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/proxy/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as { message?: string | string[]; issues?: { path: string; message: string }[] };
  if (!res.ok) {
    const issue = data.issues?.[0];
    const message = issue ? `${issue.path || 'Request'}: ${issue.message}` : Array.isArray(data.message) ? data.message[0] : data.message;
    throw new Error(message || `Something went wrong (${res.status})`);
  }
  return data as T;
}
