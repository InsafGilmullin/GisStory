// client/src/app/components/CreateStoryForm.tsx
'use client';

import { useState, useMemo } from 'react';
import { LatLng } from 'leaflet';
import dynamic from 'next/dynamic';

const CreateStoryForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState<LatLng | null>(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token'); // 1. Получаем токен
    if (!token) {
      setMessage('Вы не авторизованы. Пожалуйста, войдите в систему.');
      return;
    }

    if (!title || !description || !position) {
      setMessage('Пожалуйста, заполните все поля и выберите точку на карте.');
      return;
    }

    // 2. Убираем user_id из тела запроса. Бэкенд возьмет его из токена.
    const storyData = {
      title,
      description,
      longitude: position.lng,
      latitude: position.lat,
    };

    try {
      const response = await fetch('http://localhost:3001/legends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 3. Добавляем заголовок авторизации
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(storyData),
      });

      if (!response.ok) {
        throw new Error('Ошибка при отправке данных');
      }

      const result = await response.json();
      setMessage(`История "${result.title}" успешно создана и отправлена на модерацию!`);
      setTitle('');
      setDescription('');
      setPosition(null);

    } catch (error) {
      console.error(error);
      setMessage('Произошла ошибка. Попробуйте снова.');
    }
  };


  // Правильный динамический импорт компонента карты
  const CreateMap = useMemo(() => dynamic(
    () => import('./CreateMap'), 
    { 
      ssr: false, 
      loading: () => <p>Карта загружается...</p> 
    }
  ), []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Заголовок</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Описание</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Укажите место на карте</label>
        <div className="mt-1">
          {/* Теперь мы рендерим наш компонент и передаем ему функцию */}
          <CreateMap onPositionChange={setPosition} />
        </div>
        {position && (
          <p className="text-sm mt-2">Выбранные координаты: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}</p>
        )}
      </div>
      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Отправить на модерацию
      </button>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </form>
  );
};

export default CreateStoryForm;