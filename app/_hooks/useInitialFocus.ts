import { useEffect, useRef } from "react";

/** Focus once when a screen opens; typing and rerenders never steal focus. */
export function useInitialFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}
