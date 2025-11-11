import Fastify from 'fastify';
import { env } from './env';
import salasRoutes from './routes/salas.routes';
import leiturasRoutes from './routes/leituras.routes';
import pessoasRoutes from './routes/pessoas.routes';
import ocupacoesRoutes from './routes/ocupacoes.routes';
import espRoutes from './routes/esp.routes';
import dadosRoutes from './routes/dados.routes';
import salaResumoRoute from './routes/salas.resumo.route';

const app = Fastify({ logger: true });

app.register(salasRoutes, { prefix: '/salas' });
app.register(leiturasRoutes, { prefix: '/leituras' });
app.register(pessoasRoutes, { prefix: '/pessoas' });
app.register(ocupacoesRoutes, { prefix: '/ocupacoes' });
app.register(espRoutes, { prefix: '/esp' });
app.register(dadosRoutes, { prefix: '/dados' });
app.register(salaResumoRoute, { prefix: '/salas' });

app.listen({ port: env.PORT, host: '0.0.0.0' })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
