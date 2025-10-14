'use client'; // <-- Эта строка делает компонент клиентским!

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

const MapLoader = () => {
  const Map = useMemo(
    () =>
      dynamic(() => import('./Map'), {
        loading: () => <p>Карта загружается...</p>,
        ssr: false,
      }),
    []
  );

  return <Map />;
};

export default MapLoader;