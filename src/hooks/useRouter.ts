import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, ""); // e.g. "/piano" or ""

interface Route {
  path: string;
  params: Record<string, string>;
}

function stripBase(pathname: string): string {
  if (BASE && pathname.startsWith(BASE)) {
    return pathname.slice(BASE.length) || "/";
  }
  return pathname;
}

function matchRoute(pathname: string): Route {
  const p = stripBase(pathname);

  // /song/:id/edit
  const editMatch = p.match(/^\/song\/([^/]+)\/edit$/);
  if (editMatch) {
    return { path: "song-edit", params: { id: editMatch[1] } };
  }

  // /song/:id
  const songMatch = p.match(/^\/song\/([^/]+)$/);
  if (songMatch) {
    return { path: "song", params: { id: songMatch[1] } };
  }

  // /new
  if (p === "/new") {
    return { path: "new", params: {} };
  }

  // /settings
  if (p === "/settings") {
    return { path: "settings", params: {} };
  }

  // / (browse)
  return { path: "browse", params: {} };
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() =>
    matchRoute(window.location.pathname),
  );

  useEffect(() => {
    const onPopState = () => {
      setRoute(matchRoute(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((path: string) => {
    const fullPath = BASE + path;
    window.history.pushState(null, "", fullPath);
    setRoute(matchRoute(fullPath));
  }, []);

  return { ...route, navigate };
}
