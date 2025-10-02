// server/index.js
const fastify = require('fastify')({ logger: true });
const { Pool } = require('pg');

// --- Настройка подключения к БД ---
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'R2002ruzikR', // Твой пароль
  port: 5432,
});

// --- CORS ---
fastify.register(require('@fastify/cors'), {
  origin: 'http://localhost:3000',
});

// =================================================================
//  ЭНДПОИНТЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ (Users)
// =================================================================

// POST /users: Регистрация пользователя
fastify.post('/users', async (request, reply) => {
  try {
    const { username, email, password } = request.body;
    const password_hash = password; // Временная заглушка

    const newUserQuery = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, created_at;
    `;
    const result = await pool.query(newUserQuery, [username, email, password_hash]);
    reply.code(201).send(result.rows[0]);
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Failed to create user', details: err.message });
  }
});

// GET /users/:id: Получение пользователя по ID
fastify.get('/users/:id', async (request, reply) => {
    try {
        const { id } = request.params;
        const getUserQuery = `SELECT id, username, email, created_at FROM users WHERE id = $1;`;
        const result = await pool.query(getUserQuery, [id]);
        if (result.rows.length === 0) {
            return reply.code(404).send({ error: 'User not found' });
        }
        reply.send(result.rows[0]);
    } catch(err) {
        fastify.log.error(err);
        reply.code(500).send({ error: 'Failed to retrieve user', details: err.message });
    }
});


// =================================================================
//  ЭНДПОИНТЫ ДЛЯ ЛЕГЕНД (Legends)
// =================================================================

// POST /legends: Создание новой легенды
fastify.post('/legends', async (request, reply) => {
  try {
    const { user_id, title, description, longitude, latitude } = request.body;
    const location = `POINT(${longitude} ${latitude})`;
    const newLegendQuery = `
      INSERT INTO legends (user_id, title, description, location)
      VALUES ($1, $2, $3, ST_GeogFromText($4))
      RETURNING *;
    `;
    const result = await pool.query(newLegendQuery, [user_id, title, description, location]);
    reply.code(201).send(result.rows[0]);
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Failed to create legend', details: err.message });
  }
});

// GET /legends: Получение списка всех легенд
fastify.get('/legends', async (request, reply) => {
  try {
    const getLegendsQuery = `SELECT id, user_id, title, description, ST_AsText(location) as location, created_at FROM legends;`;
    const result = await pool.query(getLegendsQuery);
    reply.send(result.rows);
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Failed to retrieve legends', details: err.message });
  }
});

// GET /legends/:id: Получение одной легенды
fastify.get('/legends/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    const getLegendQuery = `SELECT id, user_id, title, description, ST_AsText(location) as location, created_at FROM legends WHERE id = $1;`;
    const result = await pool.query(getLegendQuery, [id]);
    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Legend not found' });
    }
    reply.send(result.rows[0]);
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Failed to retrieve legend', details: err.message });
  }
});

// DELETE /legends/:id: Удаление легенды
fastify.delete('/legends/:id', async (request, reply) => {
  try {
    const { id } = request.params;
    const deleteLegendQuery = `DELETE FROM legends WHERE id = $1 RETURNING *;`;
    const result = await pool.query(deleteLegendQuery, [id]);
    if (result.rowCount === 0) {
      return reply.code(404).send({ error: 'Legend not found' });
    }
    reply.send({ message: 'Legend deleted successfully', deletedLegend: result.rows[0] });
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Failed to delete legend', details: err.message });
  }
});


// =================================================================
//  НОВЫЕ ЭНДПОИНТЫ ДЛЯ ДОСТИЖЕНИЙ (Achievements)
// =================================================================

// POST /achievements: Создание нового достижения
fastify.post('/achievements', async (request, reply) => {
    try {
        const { name, description, icon_url } = request.body;
        const newAchievementQuery = `
            INSERT INTO achievements (name, description, icon_url)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const result = await pool.query(newAchievementQuery, [name, description, icon_url]);
        reply.code(201).send(result.rows[0]);
    } catch (err) {
        fastify.log.error(err);
        reply.code(500).send({ error: 'Failed to create achievement', details: err.message });
    }
});

// GET /achievements: Получение списка всех достижений
fastify.get('/achievements', async (request, reply) => {
    try {
        const result = await pool.query('SELECT * FROM achievements;');
        reply.send(result.rows);
    } catch (err) {
        fastify.log.error(err);
        reply.code(500).send({ error: 'Failed to retrieve achievements', details: err.message });
    }
});


// =================================================================
//  НОВЫЕ ЭНДПОИНТЫ ДЛЯ ЖАЛОБ (Reports)
// =================================================================

// POST /reports: Создание новой жалобы
fastify.post('/reports', async (request, reply) => {
    try {
        const { user_id, legend_id, reason } = request.body;
        const newReportQuery = `
            INSERT INTO reports (user_id, legend_id, reason)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const result = await pool.query(newReportQuery, [user_id, legend_id, reason]);
        reply.code(201).send(result.rows[0]);
    } catch (err) {
        fastify.log.error(err);
        reply.code(500).send({ error: 'Failed to create report', details: err.message });
    }
});

// GET /reports: Получение списка всех жалоб
fastify.get('/reports', async (request, reply) => {
    try {
        const result = await pool.query('SELECT * FROM reports;');
        reply.send(result.rows);
    } catch (err) {
        fastify.log.error(err);
        reply.code(500).send({ error: 'Failed to retrieve reports', details: err.message });
    }
});


// --- Запуск сервера ---
const start = async () => {
  try {
    await fastify.listen({ port: 3001 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();