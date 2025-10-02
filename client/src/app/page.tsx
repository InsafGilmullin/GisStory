// client/app/page.tsx
'use client'; // Обязательная директива для использования хуков (useState, useEffect)

import { useState, useEffect, FormEvent } from 'react';

// Определяем тип для объекта легенды, чтобы TypeScript знал, с какими данными мы работаем
interface Legend {
  id: string;
  title: string;
  description: string;
  location: string; // Мы получаем локацию как текст 'POINT(long lat)'
}

export default function Home() {
  // --- Состояния компонента (State) ---

  // Состояние для хранения списка легенд, полученных с сервера
  const [legends, setLegends] = useState<Legend[]>([]);
  
  // Состояния для полей в форме добавления новой легенды
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [longitude, setLongitude] = useState('');
  const [latitude, setLatitude] = useState('');
  const [error, setError] = useState<string | null>(null); // Для отображения ошибок

  // --- Функция для загрузки легенд с бэкенда ---
  const fetchLegends = async () => {
    try {
      const response = await fetch('http://localhost:3001/legends');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setLegends(data);
    } catch (err) {
      console.error("Failed to fetch legends:", err);
      setError("Не удалось загрузить легенды. Бэкенд-сервер запущен?");
    }
  };

  // --- Эффект для первоначальной загрузки данных ---
  // useEffect с пустым массивом зависимостей [] выполняется один раз, когда компонент монтируется
  useEffect(() => {
    fetchLegends();
  }, []);

  // --- Обработчик отправки формы ---
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault(); // Предотвращаем стандартную перезагрузку страницы
    setError(null);

    // !! ВАЖНО: ЗАМЕНИ ЭТОТ ID НА РЕАЛЬНЫЙ ID ПОЛЬЗОВАТЕЛЯ ИЗ ТВОЕЙ БД !!
    // Ты можешь взять его из Postman, когда создавал пользователя.
    const userId = '12b68669-f726-4eeb-959e-ba75da83756c'; // <--- ЗАМЕНИ ЗДЕСЬ

    try {
      const response = await fetch('http://localhost:3001/legends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude),
          user_id: userId, 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create legend');
      }

      // После успешного создания очищаем поля формы
      setTitle('');
      setDescription('');
      setLongitude('');
      setLatitude('');

      // И обновляем список легенд, чтобы сразу увидеть новую
      fetchLegends();

    } catch (err: any) {
      console.error("Failed to submit legend:", err);
      setError(`Ошибка при создании легенды: ${err.message}`);
    }
  };

  // --- Отображение (JSX) ---
  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-gray-50">
      
      {/* Секция для добавления новой легенды */}
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-md mb-12">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Добавить новую легенду</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
          />
          <div className="flex space-x-4">
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Долгота (Longitude)"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Широта (Latitude)"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Создать
          </button>
        </form>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>

      {/* Секция для отображения списка легенд */}
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">Все легенды</h1>
        <div className="space-y-6">
          {legends.length > 0 ? (
            legends.map((legend) => (
              <div key={legend.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-2xl font-semibold text-gray-800">{legend.title}</h3>
                <p className="text-gray-600 mt-2">{legend.description}</p>
                <p className="text-sm text-gray-400 mt-4">Координаты: {legend.location}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">Пока нет ни одной легенды. Создай первую!</p>
          )}
        </div>
      </div>
    </main>
  );
}