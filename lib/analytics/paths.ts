/** Staff screens. Tracking must not load or send anything here. */
export function isAdminPath(pathname: string): boolean {
  const path = (pathname.split(/[?#]/)[0] || "/").replace(/\/+$/, "") || "/";
  return path === "/admin" || path.startsWith("/admin/");
}
