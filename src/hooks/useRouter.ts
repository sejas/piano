import { useState, useEffect, useCallback } from "react";

interface Route {
  path: string;
  params: Record<string, string>;
}

function matchRoute(pathname: string): Route {
  // /song/:id/edit
  const editMatch = pathname.match(/^\/song\/([^/]+)\/edit$/);
  if (editMatch) {
    return { path: "song-edit", params: { id: editMatch[1] } };
  }

  // /song/:id
  const songMatch = pathname.match(/^\/song\/([^/]+)$/);
  if (songMatch) {
    return { path: "song", params: { id: songMatch[1] } };
  }

  // /new
  if (pathname === "/new") {
    return { path: "new", params: {} };
  }

  // /settings
  if (pathname === "/settings") {
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
    window.history.pushState(null, "", path);
    setRoute(matchRoute(path));
  }, []);

  return { ...route, navigate };
}
