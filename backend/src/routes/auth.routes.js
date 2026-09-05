import * as authController from "../controllers/authController.js"
import Router from "@koa/router";
import { verifyToken } from "../middleware/auth.middleware.js"

const authRoutes = new Router({ prefix: '/auth' });

authRoutes.post('/register', authController.createUser);
authRoutes.post('/login', authController.login);
authRoutes.get('/refresh-token', verifyToken, authController.refreshToken)

export default authRoutes;