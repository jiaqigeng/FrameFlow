"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { WorkspaceIcon } from "./workspace-icon";

function libraryUrl(query: string) {
  return query ? `/library?${new URLSearchParams({ q: query })}` : "/library";
}

function SearchField({ query = "" }: { query?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(query);
  const [shortcut, setShortcut] = useState("Ctrl K");

  useEffect(() => { setDraft(query); }, [query, pathname]);
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setShortcut("⌘ K");
    function focusSearch(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && !document.querySelector("dialog[open]")) {
        event.preventDefault();
        input.current?.focus();
        input.current?.select();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  function updateDraft(value: string) {
    setDraft(value);
    if (pathname === "/library") window.history.replaceState(null, "", libraryUrl(value));
  }

  return (
    <form role="search" className="workspace-search" action="/library" onSubmit={(event) => {
      event.preventDefault();
      router.push(libraryUrl(draft.trim()));
    }}>
      <button type="submit" aria-label="Search library"><WorkspaceIcon name="search" /></button>
      <input ref={input} type="search" name="q" value={draft} onChange={(event) => updateDraft(event.target.value)}
        aria-label="Search videos and scenes" aria-keyshortcuts="Control+k Meta+k" placeholder="Search videos and scenes" autoComplete="off" />
      {draft ? (
        <button type="button" aria-label="Clear search" onClick={() => { updateDraft(""); input.current?.focus(); }}>
          <WorkspaceIcon name="close" />
        </button>
      ) : <kbd aria-hidden="true">{shortcut}</kbd>}
    </form>
  );
}

function SearchWithQuery() {
  const params = useSearchParams();
  return <SearchField query={params.get("q") ?? ""} />;
}

export function WorkspaceSearch() {
  return <Suspense fallback={<SearchField />}><SearchWithQuery /></Suspense>;
}
