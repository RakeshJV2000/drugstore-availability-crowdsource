"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap, Marker } from "maplibre-gl";

export type MapMarker = { lat: number; lng: number; label?: string };

type Props = {
  center: { lat: number; lng: number } | null;
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
  enablePick?: boolean;
  onPick?: (pos: { lat: number; lng: number }) => void;
};

export default function Map({ center, zoom = 12, markers = [], className, enablePick = false, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markerObjsRef = useRef<Marker[]>([]);
  const pickMarkerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
    const style = `https://api.maptiler.com/maps/streets/style.json?key=${key}`;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: center ? [center.lng, center.lat] : [0, 0],
      zoom: center ? zoom : 2,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;
    const clickHandler = (e: any) => {
      if (!enablePick || !onPick) return;
      const { lng, lat } = e.lngLat || {};
      if (typeof lng !== 'number' || typeof lat !== 'number') return;
      if (pickMarkerRef.current) pickMarkerRef.current.remove();
      const pm = new maplibregl.Marker({ color: '#2563eb' }).setLngLat([lng, lat]).addTo(map);
      pickMarkerRef.current = pm;
      onPick({ lat, lng });
    };
    map.on('click', clickHandler);
    return () => {
      map.off('click', clickHandler);
      if (pickMarkerRef.current) { pickMarkerRef.current.remove(); pickMarkerRef.current = null; }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    map.setZoom(zoom);
    map.setCenter([center.lng, center.lat]);
  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Clear existing markers
    markerObjsRef.current.forEach(m => m.remove());
    markerObjsRef.current = [];
    // Add new markers
    markers.forEach((m) => {
      const marker = new maplibregl.Marker()
        .setLngLat([m.lng, m.lat])
        .setPopup(m.label ? new maplibregl.Popup({ offset: 12 }).setText(m.label) : undefined)
        .addTo(map);
      markerObjsRef.current.push(marker);
    });
  }, [markers]);

  return <div ref={containerRef} className={className ?? "w-full h-96 rounded-md border"} />;
}
