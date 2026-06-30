import crypto from "crypto";

const SECRET = process.env.JWT_SECRET || "cpng_crime_reporting_png_secret_key_12345";

export interface SessionData {
  username: string;
  role: "admin" | "viewer" | "officer";
}

export function signSession(username: string, role: string): string {
  const payload = `${username}:${role}`;
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}:${signature}`;
}

export function verifySession(cookieValue: string | undefined): SessionData | null {
  if (!cookieValue) return null;

  const parts = cookieValue.split(":");
  if (parts.length !== 3) return null;

  const [username, role, signature] = parts;
  const payload = `${username}:${role}`;
  
  const expectedSignature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("hex");

  if (signature === expectedSignature) {
    return {
      username,
      role: role as any,
    };
  }

  return null;
}
