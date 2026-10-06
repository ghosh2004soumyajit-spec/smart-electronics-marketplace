import { useEffect } from 'react';

/** Per-page document titles — the datasheet page header. */
export function useDocumentTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} — VoltHaus` : prev;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
