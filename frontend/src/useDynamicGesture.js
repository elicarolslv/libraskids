// useDynamicGesture.js
import { useRef, useCallback } from 'react';

const BUFFER_SIZE        = 30;
const MIN_FRAMES         = 15;          // mínimo de frames para enviar
const SEQUENCE_COOLDOWN  = 800;         // 800ms entre envios
const API_URL            = 'http://127.0.0.1:8000';

const DYNAMIC_LETTERS = new Set(['H', 'J', 'K', 'X', 'Y', 'Z']);

export function useDynamicGesture(onResult) {
  const frameBuffer  = useRef([]);
  const lastSentAt   = useRef(0);
  const isSending    = useRef(false);
  const currentLetterRef = useRef(null);
  const lastResultRef = useRef(null); // evita repetições muito rápidas

  const processFrame = useCallback(async (lmList, bbox, currentLetter) => {
    if (!lmList || !bbox || !currentLetter) return;

    // Se a letra alvo mudou, reseta o buffer
    if (currentLetterRef.current !== currentLetter) {
      console.log(`[DTW] Letra mudou: ${currentLetterRef.current} -> ${currentLetter}`);
      frameBuffer.current = [];
      currentLetterRef.current = currentLetter;
      lastResultRef.current = null;
    }

    const frame = { lmList, bbox };

    // Letra estática → /predict direto
    if (!DYNAMIC_LETTERS.has(currentLetter.toUpperCase())) {
      try {
        const res = await fetch(`${API_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lmList, bbox }),
        });
        const data = await res.json();
        console.log(`[STATIC] Resposta: ${data.letter} (${data.confidence})`);
        if (data.letter) onResult(data);
      } catch (err) {
        console.error('[predict] Erro:', err);
      }
      return;
    }

    // Letra dinâmica → acumula buffer
    frameBuffer.current.push(frame);
    if (frameBuffer.current.length > BUFFER_SIZE) {
      frameBuffer.current.shift();
    }

    const now = Date.now();
    const hasEnoughFrames = frameBuffer.current.length >= MIN_FRAMES;
    const cooldownOk = (now - lastSentAt.current) > SEQUENCE_COOLDOWN;

    if (hasEnoughFrames && cooldownOk && !isSending.current) {
      isSending.current = true;
      lastSentAt.current = now;

      const sequenceToSend = [...frameBuffer.current];
      // Mantém alguns frames para continuidade
      frameBuffer.current = frameBuffer.current.slice(-10);

      console.log(`[DTW] Enviando ${sequenceToSend.length} frames para letra ${currentLetter}`);

      try {
        const res = await fetch(`${API_URL}/predict-sequence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frames: sequenceToSend }),
        });
        const data = await res.json();

        console.log(`[DTW] Resposta: letra=${data.letter}, conf=${data.confidence}`);

        const resultKey = `${data.letter}_${Math.floor(now / 1000)}`;
        if (lastResultRef.current !== resultKey && data.confidence > 0.5) {
          lastResultRef.current = resultKey;
          onResult(data);
        }
      } catch (err) {
        console.error('[predict-sequence] Erro:', err);
      } finally {
        isSending.current = false;
      }
    }
  }, [onResult]);

  const clearBuffer = useCallback(() => {
    frameBuffer.current = [];
    currentLetterRef.current = null;
    lastResultRef.current = null;
    console.log('[DTW] Buffer completamente limpo');
  }, []);

  return { processFrame, clearBuffer };
}