"use client";

import { useEffect, useRef } from "react";
import type LType from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapStop {
  id: number;
  title: string;
  address_detail: string | null;
  latitude: number;
  longitude: number;
  meal_group?: string;
  distance_km?: number;
}

interface RouteMapProps {
  stops: MapStop[];
  onRouteInfo?: (info: { distanceKm: number; durationMin: number } | null) => void;
}

export default function RouteMap({ stops, onRouteInfo }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const layerGroupRef = useRef<LType.LayerGroup | null>(null);
  const onRouteInfoRef = useRef(onRouteInfo);

  useEffect(() => {
    onRouteInfoRef.current = onRouteInfo;
  }, [onRouteInfo]);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!containerRef.current || mapRef.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [10.7769, 106.7009],
        zoom: 13,
      });

      const esriLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri",
          maxZoom: 19,
        },
      );

      const osmDeLayer = L.tileLayer(
        "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
        {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 18,
        },
      );

      esriLayer.addTo(map);
      L.control
        .layers(
          {
            "Bản đồ đường phố (Esri)": esriLayer,
            "OpenStreetMap": osmDeLayer,
          },
          undefined,
          { position: "topright" },
        )
        .addTo(map);

      const group = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerGroupRef.current = group;
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function renderStopsAndRoute() {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      const group = layerGroupRef.current;
      if (!active || !map || !group) return;

      group.clearLayers();

      if (stops.length === 0) {
        onRouteInfoRef.current?.(null);
        return;
      }

      const bounds = L.latLngBounds([]);

      stops.forEach((stop, index) => {
        const icon = L.divIcon({
          className: "custom-route-marker",
          html: `<div style="width:32px;height:32px;border-radius:9999px;background:${
            index === 0 ? "#ea580c" : "#0f172a"
          };color:#fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.35);">${
            index + 1
          }</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const popupEl = document.createElement("div");
        popupEl.style.minWidth = "160px";
        popupEl.style.fontFamily = "sans-serif";
        const titleEl = document.createElement("strong");
        titleEl.style.color = "#0f172a";
        titleEl.style.fontSize = "13px";
        titleEl.textContent = `${index + 1}. ${stop.title}`;
        const addrEl = document.createElement("div");
        addrEl.style.color = "#475569";
        addrEl.style.fontSize = "12px";
        addrEl.style.marginTop = "4px";
        addrEl.textContent = stop.address_detail || "";
        popupEl.appendChild(titleEl);
        popupEl.appendChild(addrEl);

        const marker = L.marker([stop.latitude, stop.longitude], {
          icon,
        }).bindPopup(popupEl);

        marker.addTo(group);
        bounds.extend([stop.latitude, stop.longitude]);
      });

      if (stops.length === 1) {
        map.setView([stops[0].latitude, stops[0].longitude], 15);
        onRouteInfoRef.current?.(null);
        return;
      }

      const coordsParam = stops
        .map((s) => `${s.longitude},${s.latitude}`)
        .join(";");

      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`,
        );
        const data = await res.json();
        if (!active) return;

        const route = data?.routes?.[0];
        if (route?.geometry?.coordinates?.length) {
          const latLngs: [number, number][] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng],
          );

          L.polyline(latLngs, {
            color: "#ea580c",
            weight: 5,
            opacity: 0.9,
          }).addTo(group);

          latLngs.forEach((pt) => bounds.extend(pt));
          onRouteInfoRef.current?.({
            distanceKm: Number((route.distance / 1000).toFixed(2)),
            durationMin: Math.max(1, Math.round(route.duration / 60)),
          });
        } else {
          L.polyline(
            stops.map((s) => [s.latitude, s.longitude]),
            { color: "#ea580c", weight: 4, dashArray: "6 8" },
          ).addTo(group);
          onRouteInfoRef.current?.(null);
        }
      } catch {
        if (!active) return;
        L.polyline(
          stops.map((s) => [s.latitude, s.longitude]),
          { color: "#ea580c", weight: 4, dashArray: "6 8" },
        ).addTo(group);
        onRouteInfoRef.current?.(null);
      }

      map.fitBounds(bounds, { padding: [45, 45] });
    }

    const timer = setTimeout(renderStopsAndRoute, 50);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [stops]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div ref={containerRef} className="h-full w-full z-0" />
    </div>
  );
}
