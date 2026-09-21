const nacl = require('tweetnacl');
const keypair = nacl.sign.keyPair();
console.log('Public Key (Base64):', Buffer.from(keypair.publicKey).toString('base64'));
console.log('Secret Key (Base64):', Buffer.from(keypair.secretKey).toString('base64'));
