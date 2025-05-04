/* ========================================================================== */
/* Archivo: frontend/src/hooks/useCopyToClipboard.js                         */
/* ========================================================================== */

import { useState, useCallback } from 'react';

/**
 * Hook para copiar texto al portapapeles.
 * @returns {[boolean, (text: string) => Promise<void>]} - Estado 'copied' y función 'copy'.
 */
function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (textToCopy) => {
    if (!navigator.clipboard) {
      console.warn('Clipboard API not available');
      return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500); // Resetear después de 1.5s
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopied(false);
    }
  }, []);

  return [copied, copy];
}

export default useCopyToClipboard;

