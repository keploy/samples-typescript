import { useEffect, useState } from "react";
import { api } from "./api";

/** Loads one API path when the component mounts, and again when the path changes. */
export function useApi<T>(path: string): { data: T | null; error: string } {
  const [state, setState] = useState<{ data: T | null; error: string }>({ data: null, error: "" });
  useEffect(() => {
    let current = true;
    api<T>(path).then(
      (data) => current && setState({ data, error: "" }),
      (err: Error) => current && setState({ data: null, error: err.message }),
    );
    return () => {
      current = false;
    };
  }, [path]);
  return state;
}
