import { prisma } from "@/lib/prisma";
import { generateHandle } from "@/lib/handle";

// These imports require @auth0/nextjs-auth0 to be installed.
// For App Router, `getSession` can be used on the server.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getSession } from "@auth0/nextjs-auth0";

export type SessionUser = {
  id: string;
  handle?: string | null;
};

export async function getOrCreateSessionUser(): Promise<SessionUser | null> {
  try {
    const session = await getSession();
    if (!session?.user) return null;
    const sub: string | undefined = (session.user as any).sub;
    const email: string | undefined = (session.user as any).email;
    if (!sub) return null;

    let user = await prisma.user.findUnique({ where: { authSub: sub } });
    if (!user) {
      const handle = generateHandle(sub);
      user = await prisma.user.create({
        data: {
          authProvider: "AUTH0",
          authSub: sub,
          email,
          handle,
        },
      });
    }
    return { id: user.id, handle: user.handle };
  } catch {
    return null;
  }
}

export async function requireSessionUser(): Promise<SessionUser> {
  const u = await getOrCreateSessionUser();
  if (!u) throw Object.assign(new Error("Unauthorized"), { status: 401 });
  return u;
}

