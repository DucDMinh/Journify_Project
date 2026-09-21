import 'dotenv/config';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { env } from './config/env.js';

const app = new Koa();

app.use(cors({
    origin: (ctx) => {
        const requestOrigin = ctx.get('Origin');
        return env.corsOrigins.includes(requestOrigin) ? requestOrigin : '';
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.use(errorHandler);
app.use(bodyParser());
app.use(routes.routes()).use(routes.allowedMethods());

app.listen(env.port, () => {
    console.log(`Backend đang chạy tại http://localhost:${env.port}`);
});
