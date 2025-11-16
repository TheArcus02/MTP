import { Router } from 'express';
import { login, register } from './auth.controller';
import { loginSchema, registerSchema } from './auth.validators';
import { validate } from '../../shared/middleware/validationMiddleware';
import { asyncMiddleware } from '../../shared/middleware/async-middleware';

const router = Router();

router.post('/register', validate(registerSchema), asyncMiddleware(register));
router.post('/login', validate(loginSchema), asyncMiddleware(login));

export default router;
