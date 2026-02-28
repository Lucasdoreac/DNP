import { PGPEngine } from "../crypto/pgp-engine.js";

/**
 * Middleware de Validação
 *
 * Sem PGP + SealedHash válidos, a porta fica FECHADA
 */
export async function validateSignedRequest(
  payload: string,
  signature: string,
  publicKey: string,
  expectedSealedHash: string
): Promise<{ valid: boolean; error?: string }> {

  // 1. Validar assinatura PGP
  const signatureValid = await PGPEngine.verify(payload, signature, publicKey);
  if (!signatureValid) {
    return { valid: false, error: "Invalid PGP signature" };
  }

  // 2. Validar que o payload inclui o SealedHash esperado
  // (Garante que a mensagem veio deste hardware específico)
  if (!payload.includes(expectedSealedHash)) {
    return {
      valid: false,
      error: "SealedHash mismatch - hardware origin validation failed"
    };
  }

  // ✅ Tudo validado
  return { valid: true };
}
