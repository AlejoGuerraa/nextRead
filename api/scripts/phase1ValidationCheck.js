/**
 * Phase 1 validation checks. Run: node scripts/phase1ValidationCheck.js
 */
const { positiveIntId, paginationQuerySchema, assetRefSchema } = require('../schemas/commonSchemas');
const { registerSchema, loginSchema } = require('../schemas/authSchemas');
const { editarPerfilSchema } = require('../schemas/userSchemas');
const { guardarPuntuacionSchema } = require('../schemas/bookSchemas');
const {
  idParamSchema,
  searchQuerySchema,
  decadeQuerySchema,
  followListQuerySchema,
  listActionParamsSchema,
  recommendationParamsSchema,
} = require('../schemas/busquedaSchemas');
const { escape_like } = require('../utils/querySafety');

let failed = 0;

function assert(name, condition) {
  if (!condition) {
    failed += 1;
    console.error('FAIL:', name);
    return;
  }
  console.log('OK  :', name);
}

function expectFail(name, result) {
  assert(name, result.success === false);
}

function expectPass(name, result) {
  assert(name, result.success === true);
}

expectFail('id abc', idParamSchema.safeParse({ id: 'abc' }));
expectFail('id -1', idParamSchema.safeParse({ id: '-1' }));
expectFail('id 0', idParamSchema.safeParse({ id: '0' }));
expectFail('id 1.5', idParamSchema.safeParse({ id: '1.5' }));
expectFail('id SQL', idParamSchema.safeParse({ id: '1 OR 1=1' }));
expectFail('id huge', idParamSchema.safeParse({ id: '999999999999999999999999' }));
expectFail('id scientific', idParamSchema.safeParse({ id: '1e10' }));
expectPass('id 12', idParamSchema.safeParse({ id: '12' }));
assert('id 12 is number', idParamSchema.parse({ id: '12' }).id === 12);

expectFail('register rol', registerSchema.safeParse({
  nombre: 'Ana', apellido: 'Perez', correo: 'a@b.com', usuario: 'ana_1',
  contrasena: 'Password1', fecha_nacimiento: '2000-01-01', rol: 'Admin',
}));
expectFail('register unknown', registerSchema.safeParse({
  nombre: 'Ana', apellido: 'Perez', correo: 'a@b.com', usuario: 'ana_1',
  contrasena: 'Password1', fecha_nacimiento: '2000-01-01', activo: 1,
}));
expectFail('register huge name', registerSchema.safeParse({
  nombre: 'A'.repeat(300), apellido: 'Perez', correo: 'a@b.com', usuario: 'ana_1',
  contrasena: 'Password1', fecha_nacimiento: '2000-01-01',
}));
expectFail('login bad email', loginSchema.safeParse({ correo: 'not-an-email', contrasena: 'x' }));
expectFail('profile id field', editarPerfilSchema.safeParse({ id: 1, nombre: 'Ana' }));
expectFail('profile javascript url', editarPerfilSchema.safeParse({ banner: 'javascript:alert(1)' }));
expectPass('profile relative banner', editarPerfilSchema.safeParse({ banner: '/banners/bannerSol.jpg' }));
expectFail('review extra field', guardarPuntuacionSchema.safeParse({ puntuacion: 5, likes: 99 }));
expectFail('review score 9', guardarPuntuacionSchema.safeParse({ puntuacion: 9 }));
expectPass('review score 4', guardarPuntuacionSchema.safeParse({ puntuacion: 4 }));

expectFail('search huge', searchQuerySchema.safeParse({ search: 'x'.repeat(101) }));
expectFail('search unknown filter', searchQuerySchema.safeParse({ search: 'a', orderBy: 'titulo; DROP TABLE' }));
expectFail('decade invalid', decadeQuerySchema.safeParse({ decade: '1960 OR 1=1' }));
expectFail('decade year too high', decadeQuerySchema.safeParse({ decade: '9999s' }));
expectPass('decade 1960s', decadeQuerySchema.safeParse({ decade: '1960s' }));
expectFail('follow estado sql', followListQuerySchema.safeParse({ estado: 'aceptado; DROP' }));
expectPass('follow estado', followListQuerySchema.safeParse({ estado: 'aceptado' }));
expectFail('limit huge', paginationQuerySchema.safeParse({ limit: 999999999 }));
expectFail('offset negative', paginationQuerySchema.safeParse({ offset: -1 }));
expectPass('pagination ok', paginationQuerySchema.safeParse({ limit: 20, offset: 0 }));

expectFail('tipo lista extra', listActionParamsSchema.safeParse({ tipo: 'hack', idLibro: '3' }));
expectPass('tipo lista', listActionParamsSchema.safeParse({ tipo: 'leido', idLibro: '3' }));
expectPass('recommendation params', recommendationParamsSchema.safeParse({ idUsuario: '1', idLibro: '2' }));
expectFail('recommendation missing book', recommendationParamsSchema.safeParse({ idUsuario: '1' }));

assert('like escape', escape_like('100%_off') === '100\\%\\_off');
assert('asset relative', assetRefSchema.safeParse('/iconos/LogoDefault1.jpg').success);
assert('asset js rejected', assetRefSchema.safeParse('javascript:alert(1)').success === false);
assert('positiveInt number', positiveIntId.safeParse(8).success);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll phase 1 schema checks passed');
