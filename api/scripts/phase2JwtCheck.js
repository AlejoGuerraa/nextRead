/**
 * Phase 2 JWT purpose checks. Run: node scripts/phase2JwtCheck.js
 */
const jwt = require('jsonwebtoken');
const {
  TOKEN_TYPES,
  ALGORITHM,
  ISSUER,
  AUDIENCE,
  sign_access_token,
  verify_access_token,
  sign_temporal_token,
  verify_temporal_token,
} = require('../utils/jwtTokens');

let failed = 0;
function assert(name, condition) {
  if (!condition) {
    failed += 1;
    console.error('FAIL:', name);
    return;
  }
  console.log('OK  :', name);
}

const access = sign_access_token(12);
const recovery = sign_temporal_token({ id: 12 }, TOKEN_TYPES.RECOVERY, '15m');
const emailChange = sign_temporal_token({ id: 12, newEmail: 'a@b.com' }, TOKEN_TYPES.EMAIL_CHANGE, '15m');
const accountDelete = sign_temporal_token({ id: 12 }, TOKEN_TYPES.ACCOUNT_DELETE, '15m');

assert('access verifies', verify_access_token(access).id === 12);
assert('access type', verify_access_token(access).type === TOKEN_TYPES.ACCESS);

let recoveryAsAccess = false;
try { verify_access_token(recovery); recoveryAsAccess = true; } catch (_e) { /* expected */ }
assert('recovery ≠ access', recoveryAsAccess === false);

let emailAsAccess = false;
try { verify_access_token(emailChange); emailAsAccess = true; } catch (_e) { /* expected */ }
assert('email-change ≠ access', emailAsAccess === false);

let deleteAsAccess = false;
try { verify_access_token(accountDelete); deleteAsAccess = true; } catch (_e) { /* expected */ }
assert('account-delete ≠ access', deleteAsAccess === false);

let recoveryAsEmail = false;
try { verify_temporal_token(recovery, TOKEN_TYPES.EMAIL_CHANGE); recoveryAsEmail = true; } catch (_e) { /* expected */ }
assert('recovery ≠ email-change', recoveryAsEmail === false);

let emailAsDelete = false;
try { verify_temporal_token(emailChange, TOKEN_TYPES.ACCOUNT_DELETE); emailAsDelete = true; } catch (_e) { /* expected */ }
assert('email-change ≠ account-delete', emailAsDelete === false);

assert('recovery verifies', verify_temporal_token(recovery, TOKEN_TYPES.RECOVERY).id === 12);
assert('delete verifies', verify_temporal_token(accountDelete, TOKEN_TYPES.ACCOUNT_DELETE).id === 12);

const noneAlg = jwt.sign({ id: 12, type: TOKEN_TYPES.ACCESS }, process.env.SECRET, { algorithm: 'none' });
let noneAccepted = false;
try { verify_access_token(noneAlg); noneAccepted = true; } catch (_e) { /* expected */ }
assert('alg none rejected', noneAccepted === false);

const wrongSecret = jwt.sign(
  { id: 12, type: TOKEN_TYPES.ACCESS },
  'otro-secreto',
  { algorithm: ALGORITHM, issuer: ISSUER, audience: AUDIENCE, expiresIn: '8h' }
);
let wrongAccepted = false;
try { verify_access_token(wrongSecret); wrongAccepted = true; } catch (_e) { /* expected */ }
assert('wrong secret rejected', wrongAccepted === false);

const expired = jwt.sign(
  { id: 12, type: TOKEN_TYPES.ACCESS },
  process.env.SECRET,
  { algorithm: ALGORITHM, issuer: ISSUER, audience: AUDIENCE, expiresIn: -1 }
);
let expiredAccepted = false;
try { verify_access_token(expired); expiredAccepted = true; } catch (_e) { /* expected */ }
assert('expired rejected', expiredAccepted === false);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll phase 2 JWT checks passed');
