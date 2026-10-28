"use client";

/**
 * Loads data from a service function and tracks loading and error state. The one way pages load
 * data, so every screen handles "loading", "failed" and "loaded" the same way.
 *
 *   const plans = useApiResource("plans", listPlans);
 *   const slots = useApiResource(`slots-${date}`, () => listAvailableSlots(day));
 *
 * `key` names what is loaded: when it changes, the data loads again. Pass null to wait (for
 * example until a doctor is chosen).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, errorMessage } from "@/lib/http/apiClient";

export function useApiResource<T>(key: string | null, load: () => Promise<T>) {
  const [version, setVersion] = useState(0);
  const requestKey = key === null ? null : `${key}#${version}`;
  const [result, setResult] = useState<{
    key: string | null;
    data: T | null;
    error: string | null;
    missingEndpoint: boolean;
  }>({ key: null, data: null, error: null, missingEndpoint: false });

  const latestLoad = useRef(load);
  useEffect(() => {
    latestLoad.current = load;
  });

  useEffect(() => {
    if (requestKey === null) return;
    let cancelled = false;
    latestLoad
      .current()
      .then(
        (data) =>
          !cancelled &&
          setResult({
            key: requestKey,
            data,
            error: null,
            missingEndpoint: false,
          }),
      )
      .catch(
        (caught) =>
          !cancelled &&
          setResult((previous) => ({
            key: requestKey,
            data: previous.data,
            error: errorMessage(caught),
            missingEndpoint:
              caught instanceof ApiError && caught.isMissingEndpoint,
          })),
      );
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);
  const setData = useCallback(
    (data: T) => setResult((previous) => ({ ...previous, data })),
    [],
  );

  return {
    data: result.data,
    error: result.key === requestKey ? result.error : null,
    /** True when the backend answered 404: the endpoint is documented in docs/backend/ but not built yet. */
    missingEndpoint: result.key === requestKey && result.missingEndpoint,
    loading: requestKey !== null && result.key !== requestKey,
    reload,
    setData,
  };
}
