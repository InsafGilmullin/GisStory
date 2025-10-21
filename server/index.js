// server/index.js
const fastify = require('fastify')({ logger: true });
const { Pool } = require('pg');
const bcrypt = require('bcrypt'); // Добавили bcrypt

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
// --- НОВАЯ СЕКЦИЯ: JWT ---
fastify.register(require('@fastify/jwt'), {
  secret: 'a-super-secret-and-long-key-for-jwt' // !! ВАЖНО: В реальном проекте этот ключ должен быть сложным и храниться в секрете
});

fastify.decorate('authenticate', async function (request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});
// =================================================================
//  ЭНДПОИНТЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ (Users)
// =================================================================

// =================================================================
//  ЭНДПОИНТЫ ДЛЯ АУТЕНТИФИКАЦИИ
// =================================================================

// POST /register: Регистрация нового пользователя (ОБНОВЛЕНО)
fastify.post('/register', async (request, reply) => {
  try {
    const { username, email, password } = request.body;

    // Хешируем пароль перед сохранением
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const newUserQuery = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email;
    `;
    const result = await pool.query(newUserQuery, [username, email, password_hash]);
    reply.code(201).send(result.rows[0]);
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Email or username already exists', details: err.message });
  }
});

// POST /login: Вход пользователя (НОВЫЙ)
fastify.post('/login', async (request, reply) => {
    try {
        const { email, password } = request.body;

        // 1. Находим пользователя по email
        const findUserQuery = `SELECT * FROM users WHERE email = $1;`;
        const result = await pool.query(findUserQuery, [email]);

        if (result.rows.length === 0) {
            return reply.code(401).send({ error: "Invalid credentials" }); // Неправильный email
        }
        const user = result.rows[0];

        // 2. Сравниваем введенный пароль с хешем в базе
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return reply.code(401).send({ error: "Invalid credentials" }); // Неправильный пароль
        }

        // 3. Если все верно, генерируем JWT-токен
        const token = fastify.jwt.sign({
            id: user.id,
            username: user.username,
            email: user.email
        });

        reply.send({ token });

    } catch (err) {
        fastify.log.error(err);
        reply.code(500).send({ error: "Login failed", details: err.message });
    }
});

// GET /users/:id: Получение пользователя по ID (этот эндпоинт можно оставить как есть, если он нужен)
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
fastify.post('/legends', {
  // Эта опция "включает" проверку JWT для данного маршрута
  preHandler: [fastify.authenticate] 
}, async (request, reply) => {
  try {
    // Теперь мы берем user_id не из тела запроса, а из проверенного токена
    const user_id = request.user.id; 
    const { title, description, longitude, latitude } = request.body;
    
    // ВАЖНО: Убедитесь, что ваша таблица `legends` использует тип `geography`
    // Если используется `geometry`, то функция будет `ST_SetSRID(ST_MakePoint($4, $5), 4326)`
    const location = `POINT(${longitude} ${latitude})`;
    const newLegendQuery = `
      INSERT INTO legends (user_id, title, description, location)
      VALUES ($1, $2, $3, ST_GeogFromText($4))
      RETURNING *;
    `;
    // Обратите внимание, что `user_id` теперь первый параметр ($1)
    const result = await pool.query(newLegendQuery, [user_id, title, description, location]);
    
    reply.code(201).send(result.rows[0]);
  } catch (err) {
    fastify.log.error(err);
    reply.code(500).send({ error: 'Failed to create legend', details: err.message });
  }
});

// GET /legends: Получение списка легенд (ОБНОВЛЕНО для работы с картой)
fastify.get('/legends', async (request, reply) => {
  try {
    const { north, south, east, west } = request.query;

    // Если координаты не переданы, отдаем все легенды, как и раньше
    if (!north || !south || !east || !west) {
      const getLegendsQuery = `SELECT id, user_id, title, ST_AsText(location) as location, created_at FROM legends;`;
      const result = await pool.query(getLegendsQuery);
      return reply.send(result.rows);
    }

    // Если координаты переданы, используем их для фильтрации
    const getLegendsInBoundsQuery = `
      SELECT id, user_id, title, ST_AsText(location) as location, created_at
      FROM legends
      WHERE location && ST_MakeEnvelope($1, $2, $3, $4, 4326);
    `;
    // ST_MakeEnvelope(west, south, east, north, 4326) - создает прямоугольник по координатам
    // && - оператор PostGIS, который проверяет "пересечение" геометрий

    const result = await pool.query(getLegendsInBoundsQuery, [west, south, east, north]);
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

// Новый эндпоинт для получения всех историй в формате GeoJSON
fastify.get('/api/stories', async (request, reply) => {
  try {
    // Используем ваш `pool` для выполнения запроса, как и в других эндпоинтах
    const { rows } = await pool.query(
      `SELECT json_build_object(
          'type', 'FeatureCollection',
          'features', json_agg(
              json_build_object(
                  'type', 'Feature',
                  'id', id,
                  'geometry', ST_AsGeoJSON(location)::json,
                  'properties', json_build_object(
                      'title', title,
                      'description', description
                  )
              )
          )
      ) AS geojson
      FROM public.legends;`
    );

    // Если в базе нет данных, rows[0].geojson будет null.
    // Возвращаем пустую FeatureCollection.
    if (!rows.length || rows[0].geojson === null) {
      return {
        type: 'FeatureCollection',
        features: [],
      };
    }

    return rows[0].geojson;
  } catch (err) {
    fastify.log.error(err);
    reply.status(500).send({ error: 'Internal Server Error', details: err.message });
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