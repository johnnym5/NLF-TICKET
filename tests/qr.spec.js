import { describe, it, expect } from 'vitest';
import nacl from 'tweetnacl';

// The same public key as in src/utils/qr-verify.js
const PUBLIC_KEY_B64 = 'JIvydJ18hJStSZdkb96FrvhbiTL2Ce54OZvyeTbH3Jk=';
// The secret key generated in gen_keys.cjs
const SECRET_KEY_B64 = 'oQP18t/04sTS+oXkmvGU+qPvwWV1HabcdvedYFUg+EEki/J0nXyElK1Jl2Rv3oWu+FuJMvYJ7ng5m/J5NsfcmQ==';
const EVENT_ID = 'GCC2026';

function signPass(payload, secretKeyB64) {
  const secretKey = Buffer.from(secretKeyB64, 'base64');
  const dataToSign = JSON.stringify(payload, Object.keys(payload).sort());
  const signature = nacl.sign.detached(Buffer.from(dataToSign), secretKey);
  payload.sig = Buffer.from(signature).toString('base64');
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyPass(base64Payload, publicKeyB64) {
  try {
    const jsonStr = Buffer.from(base64Payload, 'base64').toString();
    const payload = JSON.parse(jsonStr);
    const signature = Buffer.from(payload.sig, 'base64');
    const publicKey = Buffer.from(publicKeyB64, 'base64');
    const { sig, ...dataWithoutSig } = payload;
    const dataToVerify = JSON.stringify(dataWithoutSig, Object.keys(dataWithoutSig).sort());
    return nacl.sign.detached.verify(Buffer.from(dataToVerify), signature, publicKey);
  } catch (e) {
    return false;
  }
}

describe('Cryptographic QR Security', () => {
  it('Should verify a valid signed QR', () => {
    const payload = {
      v: 1,
      tid: 'GCC-2026-ABCDEF',
      uid: 'user123',
      t: 'REGULAR',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      eid: EVENT_ID,
      kid: 'v1'
    };
    const b64 = signPass(payload, SECRET_KEY_B64);
    expect(verifyPass(b64, PUBLIC_KEY_B64)).to.be.true;
  });

  it('Should fail if ticket ID is modified', () => {
    const payload = {
      v: 1,
      tid: 'GCC-2026-ABCDEF',
      uid: 'user123',
      t: 'REGULAR',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      eid: EVENT_ID,
      kid: 'v1'
    };
    const b64 = signPass(payload, SECRET_KEY_B64);

    // Tamper
    const jsonStr = Buffer.from(b64, 'base64').toString();
    const tamperedPayload = JSON.parse(jsonStr);
    tamperedPayload.tid = 'GCC-2026-HACKED';
    const tamperedB64 = Buffer.from(JSON.stringify(tamperedPayload)).toString('base64');

    expect(verifyPass(tamperedB64, PUBLIC_KEY_B64)).to.be.false;
  });

  it('Should fail if tier is modified', () => {
    const payload = {
      v: 1,
      tid: 'GCC-2026-ABCDEF',
      uid: 'user123',
      t: 'REGULAR',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      eid: EVENT_ID,
      kid: 'v1'
    };
    const b64 = signPass(payload, SECRET_KEY_B64);

    const tamperedPayload = JSON.parse(Buffer.from(b64, 'base64').toString());
    tamperedPayload.t = 'VIP_PLATINUM';
    const tamperedB64 = Buffer.from(JSON.stringify(tamperedPayload)).toString('base64');

    expect(verifyPass(tamperedB64, PUBLIC_KEY_B64)).to.be.false;
  });

  it('Should fail with invalid signature', () => {
    const payload = {
      v: 1,
      tid: 'GCC-2026-ABCDEF',
      uid: 'user123',
      t: 'REGULAR',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      eid: EVENT_ID,
      kid: 'v1',
      sig: 'not-a-valid-signature'
    };
    const b64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    expect(verifyPass(b64, PUBLIC_KEY_B64)).to.be.false;
  });

  it('Should fail if expired', () => {
    // Note: The verifyPass helper above doesn't check exp, but our app code does.
    // In actual app code:
    function appVerify(b64) {
        const jsonStr = Buffer.from(b64, 'base64').toString();
        const p = JSON.parse(jsonStr);
        if (p.exp < Math.floor(Date.now() / 1000)) return false;
        return verifyPass(b64, PUBLIC_KEY_B64);
    }

    const payload = {
      v: 1,
      tid: 'GCC-2026-ABCDEF',
      uid: 'user123',
      t: 'REGULAR',
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      eid: EVENT_ID,
      kid: 'v1'
    };
    const b64 = signPass(payload, SECRET_KEY_B64);
    expect(appVerify(b64)).to.be.false;
  });
});
