import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ejecuta `fetcher(signal)` al montar y cada vez que cambian `deps`.
 * Cancela la petición anterior para evitar respuestas desordenadas.
 * @returns {{ data: any, loading: boolean, error: Error | null, refetch: () => void }}
 */
export function useFetch(fetcher, deps = []) {
  const [estado, setEstado] = useState({ data: null, loading: true, error: null });
  const [version, setVersion] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    setEstado((previo) => ({ ...previo, loading: true, error: null }));

    fetcherRef.current(controller.signal)
      .then((data) => setEstado({ data, loading: false, error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setEstado((previo) => ({ data: previo.data, loading: false, error }));
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  return { ...estado, refetch };
}
