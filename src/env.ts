import 'dotenv/config';

export const env = {
  PORT: Number(process.env.PORT ?? 3333),
};
