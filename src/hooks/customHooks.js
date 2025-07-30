import { useState, useEffect } from 'react';

export function useDebounce(val, delay = 500) {
  const [debounced, setDebounced] = useState(val);

  useEffect(() => {
    const h = setTimeout(() => setDebounced(val), delay);
    return () => clearTimeout(h);
  }, [val, delay]);

  return debounced;
}
