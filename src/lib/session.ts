import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const secret = process.env.SESSION_SECRET;

if (!secret) {
  throw new Error("SESSION_SECRET is not defined");
}

const secretKey = new TextEncoder().encode(secret);

export type SessionPayload = {
  userId: number;
  username: string;
  name: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey);

  const cookieStore = await cookies();

  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secretKey);

    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();

  cookieStore.delete("session");
}

export async function requireRole(
  role: "STUDENT" | "TEACHER" | "ADMIN"
) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== role) {
    if (session.role === "STUDENT") {
      redirect("/student");
    }

    if (session.role === "TEACHER") {
      redirect("/teacher");
    }

    if (session.role === "ADMIN") {
      redirect("/admin");
    }

    redirect("/login");
  }

  return session;
}