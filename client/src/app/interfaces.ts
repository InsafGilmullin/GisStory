// client/src/app/interfaces.ts

// Описываем структуру GeoJSON, которую возвращает наш API
export interface StoryFeature extends GeoJSON.Feature {
  geometry: GeoJSON.Point;
  properties: {
    title: string;
    description: string;
  };
}