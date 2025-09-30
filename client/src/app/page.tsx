// client/app/page.tsx
'use client'; // Эта директива важна для использования хуков в Next.js App Router

import { useState, useEffect } from 'react';

export default function Home() {
  // Состояние для хранения сообщения от сервера
  const [message, setMessage] = useState('Loading...');

  // useEffect выполнится один раз после загрузки страницы
  useEffect(() => {
    // Делаем запрос к нашему бэкенду на Fastify
    fetch('http://localhost:3001/')
      .then((res) => res.json())
      .then((data) => {
        // Когда данные получены, обновляем сообщение
        setMessage(data.hello);
      })
      .catch((err) => {
        console.error('Failed to fetch from server:', err);
        setMessage('Failed to load data from server.');
      });
  }, []); // Пустой массив зависимостей означает, что эффект выполнится только один раз

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Message from backend:</h1>
      <p className="mt-4 text-2xl p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {message}
      </p>
    </main>
  );
}