export function getClientIp(req: Request): string {
  // Best-effort IP extraction for rate limiting
  const xfwd = req.headers.get("x-forwarded-for");
  if (xfwd) return xfwd.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export function assertAdmin(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    const e: any = new Error("Unauthorized");
    e.status = 401;
    throw e;
  }
}

export function assertStaff(req: Request) {
  const token = req.headers.get("x-staff-token") || "";
  if (!process.env.STAFF_TOKEN || token !== process.env.STAFF_TOKEN) {
    const e: any = new Error("Forbidden");
    e.status = 403;
    throw e;
  }
}

