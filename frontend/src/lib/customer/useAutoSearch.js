import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

const delay = 350;

export default function useAutoSearch(state, searchUrl, validate) {
  const router = useRouter();
  const [draft, setDraft] = useState(state);
  const [pending, setPending] = useState(false);
  const editing = useRef(false);
  const inFlight = useRef(null);
  const revision = useRef(0);
  const applied = searchUrl({ ...state, page: '1' });
  const next = searchUrl({ ...draft, page: '1' });
  const error = validate(draft);

  useEffect(() => {
    const onNavigation = url => {
      if (url !== inFlight.current) editing.current = false;
    };
    router.events.on('routeChangeStart', onNavigation);
    return () => router.events.off('routeChangeStart', onNavigation);
  }, [router.events]);

  useEffect(() => {
    if (!editing.current) setDraft(state);
  }, [state, pending]);

  useEffect(() => {
    if (!editing.current || pending || error || next === applied) return;
    const timer = setTimeout(async () => {
      if (!editing.current) return;
      const sent = revision.current;
      inFlight.current = next;
      setPending(true);
      try {
        await router.replace(next, undefined, { scroll: false });
      } catch {
        // Route cancellation can happen when the user follows a link while results load.
      } finally {
        if (revision.current === sent) editing.current = false;
        inFlight.current = null;
        setPending(false);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [applied, error, next, pending, router]);

  const update = change => {
    editing.current = true;
    revision.current += 1;
    setDraft(change);
  };
  return { draft, update, pending };
}
