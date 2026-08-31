const { z } = require('zod');
const { positiveIntId, paginationQuerySchema } = require('./commonSchemas');

const emailSchema = z.object({
  email: z.string().trim().email().max(255),
}).strict();

const notificationSchema = z.object({
  mensaje: z.string().trim().min(1).max(500),
}).strict();

const idParamSchema = z.object({
  id: positiveIntId,
}).strict();

const idUsuarioParamSchema = z.object({
  idUsuario: positiveIntId,
}).strict();

const idLibroParamSchema = z.object({
  idLibro: positiveIntId,
}).strict();

const idResenaParamSchema = z.object({
  idResena: positiveIntId,
}).strict();

const targetIdParamSchema = z.object({
  targetId: positiveIntId,
}).strict();

const listNameParamSchema = z.object({
  nombre: z.string().trim().min(1).max(200),
}).strict();

const listActionParamsSchema = z.object({
  tipo: z.enum(['favoritos', 'enLectura', 'paraLeer', 'leido']),
  idLibro: positiveIntId,
}).strict();

const customListBookParamsSchema = z.object({
  nombre: z.string().trim().min(1).max(200),
  idLibro: positiveIntId,
}).strict();

const recommendationParamsSchema = z.object({
  idUsuario: positiveIntId,
  idLibro: positiveIntId,
}).strict();

const searchQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
}).strict();

const userSearchQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  termino: z.string().trim().max(100).optional(),
}).strict();

const checkEmailQuerySchema = z.object({
  correo: z.string().trim().email().max(255),
}).strict();

const checkUsernameQuerySchema = z.object({
  usuario: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario contiene caracteres no permitidos'),
}).strict();

const decadeQuerySchema = z.object({
  decade: z.string().trim().regex(/^(\d{4})s?$/, 'Formato de década inválido').refine((value) => {
    const year = Number(value.replace('s', ''));
    return year >= 1000 && year <= 2100;
  }, 'Década fuera de rango').optional(),
}).strict();

const followListQuerySchema = z.object({
  estado: z.enum(['aceptado', 'enviado', 'rechazado', 'all']).optional(),
}).strict();

const confirmEmailQuerySchema = z.object({
  token: z.string().trim().min(1).max(2048),
}).strict();

module.exports = {
  emailSchema,
  notificationSchema,
  positiveIntId,
  idParamSchema,
  idUsuarioParamSchema,
  idLibroParamSchema,
  idResenaParamSchema,
  targetIdParamSchema,
  listNameParamSchema,
  listActionParamsSchema,
  customListBookParamsSchema,
  recommendationParamsSchema,
  searchQuerySchema,
  userSearchQuerySchema,
  checkEmailQuerySchema,
  checkUsernameQuerySchema,
  decadeQuerySchema,
  followListQuerySchema,
  confirmEmailQuerySchema,
  paginationQuerySchema,
};
