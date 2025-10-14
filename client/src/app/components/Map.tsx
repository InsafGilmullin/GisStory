'use client';

import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

import L, { LatLngExpression } from 'leaflet';
import { useEffect, useState } from 'react';
import type { FeatureCollection, Point } from 'geojson';

// Стили для кластеризации
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

// Описываем, какие свойства есть у наших историй
interface StoryProperties {
  title: string;
  description: string;
}

// Новый компонент для добавления GeoJSON данных на карту
const GeoJsonWithClustering = ({ data }: { data: FeatureCollection<Point, StoryProperties> }) => {
  const map = useMap(); // Получаем доступ к экземпляру карты Leaflet

  useEffect(() => {
    if (!map) return;

    // Создаем группу кластеризации
    const markerClusterGroup = L.markerClusterGroup();

    // Создаем GeoJSON слой
    const geoJsonLayer = L.geoJSON(data, {
      onEachFeature: (feature, layer) => {
        // Для каждой точки создаем Popup
        const { title, description } = feature.properties;
        const popupContent = `
          <b>${title}</b><br />
          ${description}
        `;
        layer.bindPopup(popupContent);
      }
    });

    // Добавляем GeoJSON слой в группу кластеризации
    markerClusterGroup.addLayer(geoJsonLayer);
    
    // Добавляем группу на карту
    map.addLayer(markerClusterGroup);

    // Функция для очистки при размонтировании компонента
    return () => {
      map.removeLayer(markerClusterGroup);
    };
  }, [data, map]); // Перерисовываем, если изменятся данные или карта

  return null; // Сам компонент ничего не рендерит, он только работает с картой
};


const Map = () => {
  const position: LatLngExpression = [55.751244, 37.618423]; // Центр Москвы
  const [stories, setStories] = useState<FeatureCollection<Point, StoryProperties> | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/stories');
        const data = await response.json() as FeatureCollection<Point, StoryProperties>;
        setStories(data);
      } catch (error) {
        console.error("Failed to fetch stories:", error);
      }
    };

    fetchStories();
  }, []);

  return (
    <MapContainer
      center={position}
      zoom={10}
      scrollWheelZoom={true}
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Если данные загружены, вызываем наш новый компонент */}
      {stories && <GeoJsonWithClustering data={stories} />}
    </MapContainer>
  );
};

export default Map;