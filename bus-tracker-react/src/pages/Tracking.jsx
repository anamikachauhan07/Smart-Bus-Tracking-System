// Bus Tracking Page Component
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import BusMap from '../components/BusMap';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import showToast from '../utils/toast';
import { buildBusPopup } from '../utils/mapMarkers';
import CONFIG from '../config/config';

const Tracking = () => {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();
    const [routes, setRoutes] = useState([]);
    const [selectedRouteId, setSelectedRouteId] = useState('');
    const [studentRoute, setStudentRoute] = useState(null);
    const [buses, setBuses] = useState([]);
    const [selectedBusId, setSelectedBusId] = useState('');
    const [busLocation, setBusLocation] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [autoRefreshActive, setAutoRefreshActive] = useState(true);
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingStudent, setIsLoadingStudent] = useState(false);
    const hasAutoSelectedRoute = useRef(false);

    useEffect(() => {
        loadRoutes();
        
        const interval = setInterval(() => {
            if (selectedBusId) {
                trackSelectedBus(selectedBusId);
            } else if (selectedRouteId) {
                refreshAllBusLocations();
            }
        }, CONFIG.AUTO_REFRESH_INTERVAL);
        
        setAutoRefreshInterval(interval);
        
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-select student's route when logged in
    useEffect(() => {
        const autoSelectStudentRoute = async () => {
            // Prevent multiple auto-selections
            if (hasAutoSelectedRoute.current) return;
            
            // Check if route was passed via navigation state (from Profile page)
            if (location.state?.routeId) {
                hasAutoSelectedRoute.current = true;
                const routeId = location.state.routeId.toString();
                setSelectedRouteId(routeId);
                await loadBusesByRoute(routeId);
                showToast('Your route has been auto-selected', 'success');
                // Clear the state so it doesn't persist on refresh
                window.history.replaceState({}, document.title);
                return;
            }
            
            // If user is authenticated student, fetch their route
            if (isAuthenticated && user?.user_type === 'student' && user?.email && routes.length > 0) {
                setIsLoadingStudent(true);
                try {
                    const response = await api.students.getDetails(user.email);
                    if (response.data.success && response.data.data?.R_ID) {
                        const studentData = response.data.data;
                        setStudentRoute(studentData);
                        
                        // Auto-select the student's route
                        const routeId = studentData.R_ID.toString();
                        hasAutoSelectedRoute.current = true;
                        setSelectedRouteId(routeId);
                        await loadBusesByRoute(routeId);
                        showToast(`Auto-selected your route: ${studentData.R_NAME}`, 'success');
                    }
                } catch (error) {
                    console.error('Failed to load student details:', error);
                } finally {
                    setIsLoadingStudent(false);
                }
            }
        };

        if (routes.length > 0) {
            autoSelectStudentRoute();
        }
    }, [isAuthenticated, user, routes, location.state]); // eslint-disable-line react-hooks/exhaustive-deps

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
        try {
            const response = await api.buses.getByRoute(routeId);
            if (response.data.success) {
                setBuses(response.data.data);
                setSelectedBusId(''); // Reset selected bus
                setMarkers([]); // Clear markers
            }
        } catch (error) {
            showToast('Failed to load buses for this route', 'error');
        }
    };

    const handleRouteChange = (e) => {
        const routeId = e.target.value;
        setSelectedRouteId(routeId);
        if (routeId) {
            loadBusesByRoute(routeId);
        } else {
            setBuses([]);
            setSelectedBusId('');
            setMarkers([]);
        }
    };

    const trackSelectedBus = useCallback(async (busId) => {
        if (!busId) {
            setBusLocation(null);
            setMarkers([]);
            return;
        }

        try {
            setIsRefreshing(true);
            const response = await api.buses.getLocation(busId);
            if (response.data.success) {
                const location = response.data.data;
                setBusLocation(location);
                setLastUpdate(new Date());
                
                // Create marker
                const marker = {
                    id: location.B_ID,
                    lat: parseFloat(location.LATITUDE),
                    lng: parseFloat(location.LONGITUDE),
                    title: `Bus ${location.B_NO}`,
                    color: '#2563eb',
                    popup: buildBusPopup({
                        busNo: location.B_NO,
                        driverName: location.D_NAME,
                        timestamp: location.TIMESTAMP,
                    }),
                };
                
                setMarkers([marker]);
            } else {
                showToast(response.data.message || 'No tracking data available', 'warning');
                setMarkers([]);
            }
        } catch (error) {
            showToast('Failed to get bus location', 'error');
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    const handleBusSelect = (e) => {
        const busId = e.target.value;
        setSelectedBusId(busId);
        trackSelectedBus(busId);
    };

    const refreshAllBusLocations = async () => {
        try {
            setIsRefreshing(true);
            const response = await api.buses.getAllLocations();
            if (response.data.success) {
                const locations = response.data.data;
                setLastUpdate(new Date());
                const newMarkers = locations.map((loc) => ({
                    id: loc.B_ID,
                    lat: parseFloat(loc.LATITUDE),
                    lng: parseFloat(loc.LONGITUDE),
                    title: `Bus ${loc.B_NO}`,
                    color: '#059669',
                    popup: buildBusPopup({
                        busNo: loc.B_NO,
                        driverName: loc.D_NAME,
                        timestamp: loc.TIMESTAMP,
                    }),
                }));
                
                setMarkers(newMarkers);
                // Remove the annoying toast - just update silently
                // showToast(`Showing ${newMarkers.length} buses`, 'success');
            }
        } catch (error) {
            showToast('Failed to load all bus locations', 'error');
        } finally {
            setIsRefreshing(false);
        }
    };

    const toggleAutoRefresh = () => {
        if (autoRefreshActive) {
            // Stop auto-refresh
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                setAutoRefreshInterval(null);
            }
            setAutoRefreshActive(false);
            showToast('Auto-refresh disabled', 'info');
        } else {
            // Start auto-refresh
            const interval = setInterval(() => {
                if (selectedBusId) {
                    trackSelectedBus(selectedBusId);
                } else {
                    refreshAllBusLocations();
                }
            }, CONFIG.AUTO_REFRESH_INTERVAL);
            
            setAutoRefreshInterval(interval);
            setAutoRefreshActive(true);
            showToast('Auto-refresh enabled', 'success');
        }
    };

    useEffect(() => {
        return () => {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
            }
        };
    }, [autoRefreshInterval]);

    return (
        <section id="tracking" className="page-section">
            <div className="page-header">
                <h1><i className="fas fa-satellite-dish"></i> Live Bus Tracking</h1>
                <p>Track your bus in real-time on the map</p>
            </div>
            
            <div className="tracking-layout">
                {/* Control Panel */}
                <div className="tracking-sidebar">
                    <div className="control-panel">
                        <div className="panel-header">
                            <i className="fas fa-sliders"></i>
                            <span>Controls</span>
                        </div>
                        
                        {/* Student Route Info Banner */}
                        {studentRoute && (
                            <div className="student-route-banner">
                                <div className="banner-icon-small">
                                    <i className="fas fa-user-check"></i>
                                </div>
                                <div className="banner-text">
                                    <span className="banner-label">Your Route</span>
                                    <span className="banner-value">{studentRoute.R_NAME}</span>
                                </div>
                            </div>
                        )}
                        
                        <div className="control-section">
                            <div className="step-indicator">
                                <span className="step-number">1</span>
                                <span className="step-text">Select Route</span>
                                {studentRoute && selectedRouteId === studentRoute.R_ID?.toString() && (
                                    <span className="auto-badge">Auto</span>
                                )}
                            </div>
                            <select id="routeSelect" value={selectedRouteId} onChange={handleRouteChange}>
                                <option value="">Choose a route...</option>
                                {routes.map(route => (
                                    <option key={route.R_ID} value={route.R_ID}>
                                        {route.R_NAME} {studentRoute?.R_ID === route.R_ID ? '(Your Route)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="control-section">
                            <div className="step-indicator">
                                <span className="step-number">2</span>
                                <span className="step-text">Select Bus</span>
                            </div>
                            <select id="busSelect" value={selectedBusId} onChange={handleBusSelect} disabled={!selectedRouteId}>
                                <option value="">{selectedRouteId ? 'All Buses' : 'Select route first'}</option>
                                {buses.map(bus => (
                                    <option key={bus.B_ID} value={bus.B_ID}>
                                        {bus.B_NO} - {bus.D_NAME}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="control-actions">
                            <button 
                                className="btn btn-primary btn-block" 
                                onClick={refreshAllBusLocations} 
                                disabled={!selectedRouteId || isRefreshing}
                            >
                                <i className={`fas fa-sync-alt ${isRefreshing ? 'fa-spin' : ''}`}></i> 
                                {isRefreshing ? 'Loading...' : 'Refresh Map'}
                            </button>
                            
                            <button 
                                className={`btn btn-block ${autoRefreshActive ? 'btn-success' : 'btn-secondary'}`} 
                                onClick={toggleAutoRefresh}
                            >
                                <i className={`fas ${autoRefreshActive ? 'fa-pause' : 'fa-play'}`}></i> 
                                {autoRefreshActive ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
                            </button>
                        </div>
                        
                        {lastUpdate && (
                            <div className="last-update-info">
                                <i className="fas fa-clock"></i>
                                <span>Updated: {lastUpdate.toLocaleTimeString()}</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Bus Info Panel */}
                    {busLocation && (
                        <div className="bus-detail-card">
                            <div className="bus-detail-header">
                                <div className="bus-icon-circle">
                                    <i className="fas fa-bus"></i>
                                </div>
                                <div>
                                    <h3>{busLocation.B_NO}</h3>
                                    <span className="live-badge">
                                        <span className="live-dot"></span> Live
                                    </span>
                                </div>
                            </div>
                            
                            <div className="bus-detail-grid">
                                <div className="detail-row">
                                    <i className="fas fa-user"></i>
                                    <div>
                                        <span className="detail-label">Driver</span>
                                        <span className="detail-value">{busLocation.D_NAME}</span>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <i className="fas fa-map-pin"></i>
                                    <div>
                                        <span className="detail-label">Location</span>
                                        <span className="detail-value mono">
                                            {parseFloat(busLocation.LATITUDE).toFixed(5)}, {parseFloat(busLocation.LONGITUDE).toFixed(5)}
                                        </span>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <i className="fas fa-clock"></i>
                                    <div>
                                        <span className="detail-label">Last Update</span>
                                        <span className="detail-value">{new Date(busLocation.TIMESTAMP).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {!busLocation && selectedRouteId && (
                        <div className="tracking-hint">
                            <i className="fas fa-info-circle"></i>
                            <p>Select a specific bus or click "Refresh Map" to see all buses on the route</p>
                        </div>
                    )}
                </div>
                
                {/* Map Section */}
                <div className="tracking-map-wrapper">
                    <BusMap
                        center={busLocation ? { 
                            lat: parseFloat(busLocation.LATITUDE), 
                            lng: parseFloat(busLocation.LONGITUDE) 
                        } : CONFIG.MAP_DEFAULT_CENTER}
                        zoom={busLocation ? 14 : CONFIG.MAP_DEFAULT_ZOOM}
                        markers={markers}
                    />
                    
                    {markers.length > 0 && (
                        <div className="map-overlay-info">
                            <i className="fas fa-bus"></i>
                            <span>{markers.length} bus(es) on map</span>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Tracking;

