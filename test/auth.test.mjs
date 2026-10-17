import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { computeAuthHash } from '../js/account.js';

test('auth_hash Mastertool sözleşmesiyle (PBKDF2-SHA256) uyuşur', async () => {
  const kdf = { alg: 'PBKDF2-SHA256', iter: 1000, salt: Buffer.from('0123456789abcdef').toString('base64') };
  const pw = 'Gizli-Şifre!42';
  const js = await computeAuthHash(pw, kdf);
  const py = execFileSync('python3', ['-I', '-c', `
import hashlib,base64,sys
pw=sys.argv[1].encode(); salt=base64.b64decode(sys.argv[2]); it=int(sys.argv[3])
master=hashlib.pbkdf2_hmac('sha256',pw,salt,it,32)
print(base64.b64encode(hashlib.pbkdf2_hmac('sha256',master,pw,1,32)).decode())`, pw, kdf.salt, String(kdf.iter)]).toString().trim();
  assert.equal(js, py);
  assert.equal(js, await computeAuthHash(pw, kdf));
  assert.notEqual(js, await computeAuthHash(pw + 'x', kdf));
});
