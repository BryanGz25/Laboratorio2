const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
const TIEMPO_MAXIMO_MS = 60_000;

/**
 * Envía el carrito al agente de IA en n8n.
 * Respuesta esperada: { ok, data: { descripcion_comercial, recomendaciones }, error }
 * @param {{ sessionId: string, items: object[] }} solicitud
 */
export async function pedirRecomendaciones({ sessionId, items }) {
  if (!WEBHOOK_URL) {
    throw new Error('Falta configurar VITE_N8N_WEBHOOK_URL en frontend/.env');
  }

  let respuesta;
  try {
    respuesta = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, items }),
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });
  } catch (error) {
    if (error.name === 'TimeoutError') throw new Error('El agente tardó demasiado en responder. Intenta de nuevo.');
    throw new Error('No se pudo contactar al agente en n8n. Verifica que el workflow esté activo.');
  }

  const cuerpo = await respuesta.json().catch(() => null);
  if (!respuesta.ok || !cuerpo?.ok) {
    throw new Error(cuerpo?.error || `El agente respondió con error ${respuesta.status}`);
  }
  return cuerpo.data;
}
