import Fastify from 'fastify';
import { env } from './env';
import salasRoutes from './routes/salas.routes';
import espRoutes from './routes/esp.routes';
import salaResumoRoute from './routes/salas.resumo.route';

const app = Fastify({ logger: true });

app.register(salasRoutes, { prefix: '/salas' });
app.register(espRoutes, { prefix: '/esp' });
app.register(salaResumoRoute, { prefix: '/salas' });

app.listen({ port: env.PORT, host: '0.0.0.0' })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
