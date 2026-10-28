/**
 * Where a page's Back link goes: the in-app page the person came from, when it is one of the
 * dashboard's own, else the page's parent. Every in-app link click records its origin in
 * sessionStorage; PageHead reads it once.
 */

export type BackDestination = { href: string; label: string };

const KNOWN_PAGES: BackDestination[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/care", label: "Care" },
  { href: "/dashboard/appointments", label: "Appointments" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/lab-tests", label: "Lab tests" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/resources", label: "Resources" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/doctor-dashboard", label: "Today" },
  { href: "/doctor-dashboard/patients", label: "Patients" },
  { href: "/doctor-dashboard/schedule", label: "Schedule" },
];
const STORAGE_KEY = "medistry-from";

if (typeof window !== "undefined") {
  document.addEventListener(
    "click",
    (event) => {
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const to = new URL(link.href, window.location.href);
      if (to.origin !== window.location.origin || to.pathname === window.location.pathname) return;
      try {
        sessionStorage.setItem(STORAGE_KEY, window.location.pathname.replace(/\/$/, "") || "/");
      } catch {
        // storage blocked: Back keeps the page's own parent
      }
    },
    true,
  );
}

/** The page the last in-app link was tapped on, if it is a known dashboard page. */
export function readBackDestination(): BackDestination | null {
  if (typeof window === "undefined") return null;
  let path: string | null = null;
  try {
    path = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  const here = window.location.pathname.replace(/\/$/, "");
  const hit = KNOWN_PAGES.find((page) => page.href === path);
  return hit && hit.href !== here ? hit : null;
}
