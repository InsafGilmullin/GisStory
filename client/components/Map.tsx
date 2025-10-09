'use client'; // Директива для Next.js, указывающая, что это клиентский компонент

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Обязательно импортируем стили Leaflet
import L from 'leaflet'; // Импортируем 'L' для кастомных иконок
import { useState, useEffect } from 'react';

// --- ИСПРАВЛЕНИЕ ДЛЯ ИКОНОК ---
// Next.js может некорректно работать с путями к иконкам Leaflet по умолчанию.
// Этот код исправляет это, явно указывая пути.
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: iconRetinaUrl.src,
        iconUrl: iconUrl.src,
        shadowUrl: shadowUrl.src,
    });
}, []);
// ------------------------------------

// Определяем тип для данных легенды (лучше вынести в отдельный файл .ts)
interface Legend {
    id: number;
    title: string;
    coordinates: [number, number];
}

const Map = () => {
    // Состояние для хранения легенд
    const [legends, setLegends] = useState<Legend[]>([]);

    // Загрузка данных с бэкенда при монтировании компонента
    useEffect(() => {
        // Замените URL на адрес вашего бэкенда
        fetch('http://localhost:3001/legends') // Предполагаем, что сервер на порту 3001
            .then((res) => res.json())
            .then((data) => {
                setLegends(data);
            })
            .catch((error) => console.error('Ошибка при загрузке легенд:', error));
    }, []); // Пустой массив зависимостей означает, что эффект выполнится один раз

    return (
        <MapContainer
            center={[55.751244, 37.618423]} // Начальные координаты (центр Москвы)
            zoom={10} // Начальный зум
            style={{ height: '100vh', width: '100%' }} // Растягиваем карту на весь экран
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Отображаем маркеры для каждой легенды */}
            {legends.map((legend) => (
                <Marker key={legend.id} position={legend.coordinates}>
                    <Popup>{legend.title}</Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default Map;