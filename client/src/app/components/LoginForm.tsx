'use client';

import { useState } from 'react';
import Link from 'next/link';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка входа');
      }

      const { token } = await response.json();
      localStorage.setItem('token', token); // Сохраняем токен
      setMessage('Вход выполнен успешно! Перенаправляем...');
      
      // Перенаправляем на главную страницу через 2 секунды
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error: any) {
      setMessage(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
      <div>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-black"
        />
      </div>
      <div>
        <label htmlFor="password">Пароль</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-black"
        />
      </div>
      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
        Войти
      </button>
      {message && <p className="mt-4 text-sm text-center">{message}</p>}
      <p className="text-center text-sm mt-4">
        Нет аккаунта?{' '}
        <Link href="/register" className="text-indigo-600 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;