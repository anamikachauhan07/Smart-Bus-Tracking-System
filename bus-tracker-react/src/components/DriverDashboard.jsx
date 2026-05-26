// Driver Dashboard Component with GPS Tracking
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import showToast from '../utils/toast';
import CONFIG from '../config/config';
import { createBusIcon } from '../utils/mapMarkers';
import { L, createTileLayer, initLeafletDefaults } from '../utils/leafletSetup';

initLeafletDefaults();

const DriverDashboard = () => {
    const { user } = useAuth();
    const [routes, setRoutes] = useState([]);
    const [selectedRouteId, setSelectedRouteId] = useState('');
    const [buses, setBuses] = useState([]);
    const [selectedBusId, setSelectedBusId] = useState('');
    const [gpsTracking, setGpsTracking] = useState(false);
    const [gpsInfo, setGpsInfo] = useState({
        latitude: null,
        longitude: null,
        accuracy: null,
        speed: null,
    });
    const [updateCounter, setUpdateCounter] = useState(0);

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const pathRef = useRef(null);
    const pathCoordinatesRef = useRef([]);

    useEffect(() => {
        loadRoutes();
    }, []);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) {
            return;
        }

        const center = CONFIG.MAP_DEFAULT_CENTER;
        const map = L.map(mapRef.current, {
            center: [center.lat, center.lng],
            zoom: 16,
        });

        createTileLayer(CONFIG.MAP_TILE_URL, CONFIG.MAP_TILE_ATTRIBUTION).addTo(map);

        const marker = L.marker([center.lat, center.lng], {
            icon: createBusIcon('#2563eb'),
        }).addTo(map);

        const path = L.polyline([], {
            color: '#2563eb',
            weight: 4,
            opacity: 0.85,
        }).addTo(map);

        mapInstanceRef.current = map;
        markerRef.current = marker;
        pathRef.current = path;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            markerRef.current = null;
            pathRef.current = null;
        };
    }, []);

    const loadRoutes = async () => {
        try {
            const response = await api.routes.getAll();
            if (response.data.success) {
                setRoutes(response.data.data);
            }
        } catch (error) {
            showToast('Failed to load routes', 'error');
        }
    };

    const loadBusesByRoute = async (routeId) => {
        if (!routeId) {
            setBuses([]);
            setSelectedBusId('');
            return;
        }

        try {
            const response = await api.buses.getByRoute(routeId);
            if (response.data.success) {
                setBuses(response.data.data);
                setSelectedBusId('');
            }
        } catch (error) {
            showToast('Failed to load buses for this route', 'error');
            setBuses([]);
        }
    };

    const handleRouteSelect = (e) => {
        const routeId = e.target.value;
        setSelectedRouteId(routeId);
        loadBusesByRoute(routeId);
    };

    const updateMapLocation = useCallback((lat, lng) => {
        if (!mapInstanceRef.current || !markerRef.current) return;

        const newPosition = [lat, lng];
        markerRef.current.setLatLng(newPosition);
        mapInstanceRef.current.panTo(newPosition);

        pathCoordinatesRef.current.push(newPosition);
        if (pathCoordinatesRef.current.length > 100) {
            pathCoordinatesRef.current.shift();
        }

        if (pathRef.current) {
            pathRef.current.setLatLngs(pathCoordinatesRef.current);
        }
    }, []);

    const sendLocationUpdate = async (position) => {
        if (!selectedBusId) return;

        const data = {
            bus_id: parseInt(selectedBusId),
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp).toISOString(),
        };

        try {
            const response = await api.driver.updateLocation(data);
            if (response.data.success) {
                setUpdateCounter((prev) => prev + 1);
            }
        } catch (error) {
            console.error('Failed to send location:', error);
            if (error.error && error.error.includes('Authentication required')) {
                showToast('Session expired. Please login again.', 'error');
            }
        }
    };

    const handleGPSSuccess = useCallback(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            setGpsInfo({
                latitude: lat.toFixed(6),
                longitude: lng.toFixed(6),
                accuracy: position.coords.accuracy.toFixed(2),
                speed: position.coords.speed ? (position.coords.speed * 3.6).toFixed(2) : '0',
            });

            updateMapLocation(lat, lng);
            sendLocationUpdate(position);
        },
        [selectedBusId, updateMapLocation]
    );

    const handleGPSError = (error) => {
        console.error('GPS Error:', error);
        let message = 'GPS error occurred';

        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location permission denied. Please enable location access.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information unavailable.';
                break;
            case error.TIMEOUT:
                message = 'Location request timed out.';
                break;
            default:
                break;
        }

        showToast(message, 'error');
        setGpsTracking(false);
    };

    const startGPSTracking = () => {
        if (!selectedBusId) {
            showToast('Please select a bus first', 'warning');
            return;
        }

        if (!navigator.geolocation) {
            showToast('Geolocation is not supported by your browser', 'error');
            return;
        }

        navigator.geolocation.getCurrentPosition(handleGPSSuccess, handleGPSError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        });

        setGpsTracking(true);
        showToast('Location updated successfully', 'success');
    };

    return (
        <section id="profile" className="page-section">
            <div className="page-header">
                <h1><i className="fas fa-id-card"></i> Driver Dashboard</h1>
                <p>Welcome, {user?.username}! Manage your bus tracking here.</p>
            </div>

            <div className="content-card">
                <div className="driver-controls">
                    <div className="form-group">
                        <label htmlFor="driverRouteSelect">
                            <i className="fas fa-route"></i> Step 1: Select Your Route:
                        </label>
                        <select id="driverRouteSelect" value={selectedRouteId} onChange={handleRouteSelect}>
                            <option value="">Choose a route first...</option>
                            {routes.map((route) => (
                                <option key={route.R_ID} value={route.R_ID}>
                                    {route.R_NAME} - {route.START_POINT} to {route.END_POINT}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="driverBusSelect">
                            <i className="fas fa-bus"></i> Step 2: Select Your Bus:
                        </label>
                        <select
                            id="driverBusSelect"
                            value={selectedBusId}
                            onChange={(e) => setSelectedBusId(e.target.value)}
                            disabled={!selectedRouteId}
                        >
                            <option value="">
                                {selectedRouteId ? 'Choose your bus...' : 'Select a route first'}
                            </option>
                            {buses.map((bus) => (
                                <option key={bus.B_ID} value={bus.B_ID}>
                                    Bus {bus.B_NO} - {bus.D_NAME}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="button-group">
                        <button className="btn btn-success" onClick={startGPSTracking} disabled={!selectedBusId}>
                            <i className="fas fa-location-arrow"></i> Update Location
                        </button>
                    </div>
                </div>

                <div className="status-indicator">
                    <div className={`status-dot ${updateCounter > 0 ? 'status-active' : 'status-inactive'}`}></div>
                    <span className="status-text">
                        Location Updates:{' '}
                        {updateCounter === 0
                            ? 'Not updated yet'
                            : `${updateCounter} update${updateCounter > 1 ? 's' : ''} sent`}
                    </span>
                </div>

                <div className="driver-map-container">
                    <h3><i className="fas fa-map"></i> Your Current Location</h3>
                    <div ref={mapRef} className="map-container driver-map" style={{ height: '400px' }}></div>
                </div>

                {gpsInfo.latitude && (
                    <div className="gps-info">
                        <div className="info-row">
                            <span className="label"><i className="fas fa-crosshairs"></i> Latitude:</span>
                            <span className="value">{gpsInfo.latitude}</span>
                        </div>
                        <div className="info-row">
                            <span className="label"><i className="fas fa-crosshairs"></i> Longitude:</span>
                            <span className="value">{gpsInfo.longitude}</span>
                        </div>
                        <div className="info-row">
                            <span className="label"><i className="fas fa-bullseye"></i> Accuracy:</span>
                            <span className="value">{gpsInfo.accuracy} m</span>
                        </div>
                        <div className="info-row">
                            <span className="label"><i className="fas fa-tachometer-alt"></i> Speed:</span>
                            <span className="value">{gpsInfo.speed} km/h</span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default DriverDashboard;
