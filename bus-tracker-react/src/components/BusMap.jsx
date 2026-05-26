import { useEffect, useRef } from 'react';
import CONFIG from '../config/config';
import { createSvgBusIcon } from '../utils/mapMarkers';
import { L, createTileLayer, initLeafletDefaults } from '../utils/leafletSetup';

initLeafletDefaults();

const BusMap = ({ center, zoom = 12, markers = [], onMapLoad, className = 'map-container', style = {} }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) {
            return;
        }

        const defaultCenter = CONFIG.MAP_DEFAULT_CENTER;
        const mapCenter = center || defaultCenter;

        const map = L.map(mapRef.current, {
            center: [mapCenter.lat, mapCenter.lng],
            zoom,
            zoomControl: true,
        });

        createTileLayer(CONFIG.MAP_TILE_URL, CONFIG.MAP_TILE_ATTRIBUTION).addTo(map);

        markersLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        if (onMapLoad) {
            onMapLoad(map);
        }

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            markersLayerRef.current = null;
        };
    }, [onMapLoad, zoom]);

    useEffect(() => {
        if (!markersLayerRef.current) {
            return;
        }

        markersLayerRef.current.clearLayers();

        markers.forEach((markerData) => {
            const latLng = [markerData.lat, markerData.lng];
            let icon;

            if (markerData.icon?.url) {
                const size = markerData.icon.scaledSize || { width: 40, height: 40 };
                icon = L.icon({
                    iconUrl: markerData.icon.url,
                    iconSize: [size.width, size.height],
                    iconAnchor: [size.width / 2, size.height / 2],
                    popupAnchor: [0, -size.height / 2],
                });
            } else if (markerData.color) {
                icon = createSvgBusIcon(markerData.color);
            }

            const marker = L.marker(latLng, icon ? { icon } : undefined);

            if (markerData.title) {
                marker.bindTooltip(markerData.title, { direction: 'top' });
            }

            if (markerData.infoWindow || markerData.popup) {
                marker.bindPopup(markerData.infoWindow || markerData.popup);
            }

            marker.addTo(markersLayerRef.current);
        });
    }, [markers]);

    useEffect(() => {
        if (mapInstanceRef.current && center) {
            mapInstanceRef.current.setView([center.lat, center.lng], mapInstanceRef.current.getZoom(), {
                animate: true,
            });
        }
    }, [center]);

    return (
        <div
            ref={mapRef}
            className={className}
            style={{ width: '100%', height: '500px', ...style }}
        />
    );
};

export default BusMap;
