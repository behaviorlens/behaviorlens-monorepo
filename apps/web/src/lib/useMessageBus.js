import { useEffect, useRef } from 'react';

/**
 * Listens for window.postMessage events from allowed origins and dispatches
 * them by `event.data.type` to the matching handler in `on`.
 *
 *   useMessageBus({ allowedOrigins: [window.location.origin], on: { 'bl:seek': data => … } })
 */
export const useMessageBus = ({ allowedOrigins = [window.location.origin], on = {} }) => {
  const handlersRef = useRef(on);
  handlersRef.current = on;
  const originsKey = allowedOrigins.join('|');

  useEffect(() => {
    const origins = new Set(originsKey.split('|'));
    const listener = event => {
      if (!origins.has(event.origin)) {
        return;
      }
      const type = event.data?.type;
      const handler = type ? handlersRef.current[type] : undefined;
      if (handler) {
        handler(event.data, event);
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [originsKey]);
};
