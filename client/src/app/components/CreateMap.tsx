// client/src/app/components/CreateMap.tsx
'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import "leaflet-defaulticon-compatibility";

// Компонент для отслеживания кликов на карте
function LocationMarker({ onPositionChange }: { onPositionChange: (pos: LatLng) => void }) {
  const [position, setPosition] = useState<LatLng | null>(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onPositionChange(e.latlng); // Передаем позицию "наверх"
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

interface CreateMapProps {
  onPositionChange: (pos: LatLng) => void;
}

const CreateMap = ({ onPositionChange }: CreateMapProps) => {
  return (
    <MapContainer
      center={[55.75, 37.61]}
      zoom={10}
      scrollWheelZoom={false}
      style={{ height: '400px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker onPositionChange={onPositionChange} />
    </MapContainer>
  );
};

export default CreateMap;