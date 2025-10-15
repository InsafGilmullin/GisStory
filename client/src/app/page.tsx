// client/src/app/page.tsx
'use client' // Добавляем эту директиву

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MapLoader from './components/MapLoader';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  username: string;
  email: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedUser: User = jwtDecode(token);
        setUser(decodedUser);
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <main>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, display: 'flex', gap: '10px' }}>
        {user ? (
          <>
            <span className="text-white bg-gray-700 p-2 rounded">Привет, {user.username}!</span>
            <Link href="/create" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              + Добавить историю
            </Link>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              Выйти
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              Войти
            </Link>
            <Link href="/register" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
              Регистрация
            </Link>
          </>
        )}
      </div>
      <MapLoader />
    </main>
  );
}