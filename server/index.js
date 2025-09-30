// server/index.js
const fastify = require('fastify')({ logger: true });
const { Pool } = require('pg');

// Настройка подключения к нашей базе данных в Docker
const pool = new Pool({
  user: 'postgres', // пользователь по умолчанию
  host: 'localhost',
  database: 'postgres', // база данных по умолчанию
  password: 'R2002ruzikR', // ТВОЙ ПАРОЛЬ, который ты указал в команде docker run
  port: 5432,
});

// Добавляем поддержку CORS, чтобы фронтенд мог делать запросы
fastify.register(require('@fastify/cors'), {
  origin: 'http://localhost:3000', // Разрешаем запросы только с нашего фронтенда
});

// Старый маршрут
fastify.get('/', async (request, reply) => {
  return { hello: 'from server' };
});

// Новый маршрут для проверки подключения к БД
fastify.get('/db-test', async (request, reply) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()'); // Запрашиваем текущее время у БД
    client.release(); // Возвращаем клиента в пул
    return { time: result.rows[0].now };
  } catch (err) {
    reply.code(500).send({ error: 'Database connection failed', details: err.message });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();