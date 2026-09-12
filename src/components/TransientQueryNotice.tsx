"use client";

import { useEffect, type ReactNode } from "react";

type TransientQueryNoticeProps = Readonly<{
  children: ReactNode;
  queryParameters: readonly string[];
}>;

export default function TransientQueryNotice({
  children,
  queryParameters,
}: TransientQueryNoticeProps) {
  useEffect(() => {
    const url = new URL(window.location.href);
    let changed = false;

    for (const parameter of queryParameters) {
      if (url.searchParams.has(parameter)) {
        url.searchParams.delete(parameter);
        changed = true;
      }
    }

    if (changed) {
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`
      );
    }
  }, [queryParameters]);

  return children;
}
