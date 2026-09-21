import nacl from 'tweetnacl';

// Public key distributed with the scanner app
const PUBLIC_KEY_B64 = 'JIvydJ18hJStSZdkb96FrvhbiTL2Ce54OZvyeTbH3Jk=';
const EVENT_ID = 'GCC2026';

function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * verifySignedTicket
 * Decodes and verifies the cryptographic signature of a QR payload.
 * Returns { valid: boolean, data: object, error: string }
 */
export function verifySignedTicket(base64Payload) {
  try {
    const jsonStr = atob(base64Payload);
    const payload = JSON.parse(jsonStr);

    // 1. Structural Check
    if (!payload.v || !payload.tid || !payload.uid || !payload.sig) {
      return { valid: false, error: 'MALFORMED_PAYLOAD' };
    }

    // 2. Event & Expiry Check
    if (payload.eid !== EVENT_ID) {
      return { valid: false, error: 'WRONG_EVENT' };
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      return { valid: false, error: 'TICKET_EXPIRED' };
    }

    // 3. Signature Verification
    const signature = base64ToUint8Array(payload.sig);
    const publicKey = base64ToUint8Array(PUBLIC_KEY_B64);

    // Create canonical data for verification (must match signing order)
    const { sig, ...dataWithoutSig } = payload;
    const dataToVerify = JSON.stringify(dataWithoutSig, Object.keys(dataWithoutSig).sort());

    // Convert string to Uint8Array for nacl
    const encoder = new TextEncoder();
    const message = encoder.encode(dataToVerify);

    const isValid = nacl.sign.detached.verify(message, signature, publicKey);

    if (!isValid) {
      return { valid: false, error: 'INVALID_SIGNATURE' };
    }

    return { valid: true, data: payload };
  } catch (err) {
    console.error('QR Verification Error:', err);
    return { valid: false, error: 'DECODE_ERROR' };
  }
}
