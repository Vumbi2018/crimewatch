import { QueryClient, QueryFunction } from "@tanstack/react-query";

const DEFAULT_API_DOMAIN = "crimewatch.lamtoninvestments.com";

/**
 * Gets the base URL for the Express API server (e.g., "http://localhost:3000")
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  const host = process.env.EXPO_PUBLIC_DOMAIN || DEFAULT_API_DOMAIN;

  if (host.startsWith("http://") || host.startsWith("https://")) {
    return new URL(host).href;
  }

  const useHttp =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes("10.0.2.2") ||
    host.startsWith("169.254");
  const protocol = useHttp ? "http" : "https";
  return new URL(`${protocol}://${host}`).href;
}

export function apiUrl(route: string): string {
  return new URL(route, getApiUrl()).toString();
}

export async function readJsonResponse<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";

  if (!text) {
    return null as never;
  }

  if (!contentType.includes("application/json")) {
    const preview = text.replace(/\s+/g, " ").slice(0, 140);
    throw new Error(
      `Server returned ${contentType || "non-JSON"} from ${res.url}. ${preview}`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Server returned invalid JSON from ${res.url}.`);
  }
}
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const url = apiUrl(route);

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = apiUrl(queryKey.join("/") as string);

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as never;
    }

    await throwIfResNotOk(res);
    return await readJsonResponse(res);
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
