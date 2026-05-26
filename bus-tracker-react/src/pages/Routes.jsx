// Routes Page Component
import { useState, useEffect } from 'react';
import api from '../services/api';
import showToast from '../utils/toast';

const Routes = () => {
    const [routes, setRoutes] = useState([]);
    const [expandedRoute, setExpandedRoute] = useState(null);
    const [routeStops, setRouteStops] = useState({});
    const [routeBuses, setRouteBuses] = useState({});

    useEffect(() => {
        loadRoutes();
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

    const loadStops = async (routeId) => {
        if (routeStops[routeId]) {
            // Already loaded
            setExpandedRoute(expandedRoute === routeId ? null : routeId);
            return;
        }

        try {
            // Load stops
            const stopsResponse = await api.routes.getStops(routeId);
            if (stopsResponse.data.success) {
                setRouteStops(prev => ({
                    ...prev,
                    [routeId]: stopsResponse.data.data
                }));
            }
            
            // Load buses for this route
            const busesResponse = await api.buses.getByRoute(routeId);
            if (busesResponse.data.success) {
                setRouteBuses(prev => ({
                    ...prev,
                    [routeId]: busesResponse.data.data
                }));
            }
            
            setExpandedRoute(routeId);
        } catch (error) {
            showToast('Failed to load route details', 'error');
        }
    };

    return (
        <section id="routes" className="page-section">
            <div className="page-header">
                <h1><i className="fas fa-route"></i> Available Routes</h1>
                <p>Browse all available bus routes and their stops</p>
            </div>
            
            <div className="content-card">
                <div className="routes-toolbar">
                    <div className="routes-count-badge">
                        <i className="fas fa-route"></i>
                        <span><strong>{routes.length}</strong> Routes Available</span>
                    </div>
                    <button className="btn btn-secondary" onClick={loadRoutes}>
                        <i className="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
                
                <div id="routesList" className="routes-list">
                    {routes.length === 0 ? (
                        <div className="empty-state-card" style={{marginTop: '2rem'}}>
                            <div className="empty-state-icon">
                                <i className="fas fa-route"></i>
                            </div>
                            <h3>No Routes Available</h3>
                            <p>There are no bus routes configured yet</p>
                        </div>
                    ) : (
                        routes.map(route => (
                            <div key={route.R_ID} className="route-item">
                                <div 
                                    className="route-header" 
                                    onClick={() => loadStops(route.R_ID)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="route-info">
                                        <h3>
                                            <i className="fas fa-route"></i> {route.R_NAME}
                                        </h3>
                                        <div className="route-details-grid">
                                            <div className="detail-item">
                                                <i className="fas fa-play-circle"></i> 
                                                <div>
                                                    <strong>Start Point:</strong>
                                                    <span>{route.START_POINT}</span>
                                                </div>
                                            </div>
                                            <div className="detail-item">
                                                <i className="fas fa-stop-circle"></i> 
                                                <div>
                                                    <strong>End Point:</strong>
                                                    <span>{route.END_POINT}</span>
                                                </div>
                                            </div>
                                            {route.DISTANCE && (
                                                <div className="detail-item">
                                                    <i className="fas fa-road"></i> 
                                                    <div>
                                                        <strong>Distance:</strong>
                                                        <span>{route.DISTANCE} km</span>
                                                    </div>
                                                </div>
                                            )}
                                            {routeStops[route.R_ID] && (
                                                <div className="detail-item">
                                                    <i className="fas fa-map-pin"></i> 
                                                    <div>
                                                        <strong>Total Stops:</strong>
                                                        <span>{routeStops[route.R_ID].length} stops</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="expand-icon">
                                        <i className={`fas fa-chevron-${expandedRoute === route.R_ID ? 'up' : 'down'}`}></i>
                                        <span>{expandedRoute === route.R_ID ? 'Hide' : 'View'} Stops</span>
                                    </div>
                                </div>
                                
                                {expandedRoute === route.R_ID && routeStops[route.R_ID] && (
                                    <div className="route-stops">
                                        {/* Buses Section */}
                                        {routeBuses[route.R_ID] && routeBuses[route.R_ID].length > 0 && (
                                            <div className="route-buses-section">
                                                <div className="stops-header">
                                                    <h4><i className="fas fa-bus"></i> Buses on this Route ({routeBuses[route.R_ID].length})</h4>
                                                    <span className="stops-info">These buses serve this route</span>
                                                </div>
                                                <div className="buses-grid">
                                                    {routeBuses[route.R_ID].map(bus => (
                                                        <div key={bus.B_ID} className="bus-card-mini">
                                                            <div className="bus-card-icon">
                                                                <i className="fas fa-bus"></i>
                                                            </div>
                                                            <div className="bus-card-info">
                                                                <strong>{bus.B_NO}</strong>
                                                                <span className="bus-driver">
                                                                    <i className="fas fa-user"></i> {bus.D_NAME}
                                                                </span>
                                                                {bus.D_PHONE && (
                                                                    <span className="bus-phone">
                                                                        <i className="fas fa-phone"></i> {bus.D_PHONE}
                                                                    </span>
                                                                )}
                                                                {bus.CAPACITY && (
                                                                    <span className="bus-capacity">
                                                                        <i className="fas fa-users"></i> Capacity: {bus.CAPACITY} seats
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Stops Section */}
                                        <div className="stops-header">
                                            <h4><i className="fas fa-list-ol"></i> Route Stops ({routeStops[route.R_ID].length})</h4>
                                            <span className="stops-info">Click on any stop for more details</span>
                                        </div>
                                        <div className="stops-timeline">
                                            {routeStops[route.R_ID].map((stop, index) => (
                                                <div key={stop.STOP_ID} className="stop-timeline-item">
                                                    <div className="stop-marker">
                                                        <div className="stop-number-badge">
                                                            {stop.STOP_ORDER || (index + 1)}
                                                        </div>
                                                        {index < routeStops[route.R_ID].length - 1 && (
                                                            <div className="stop-connector"></div>
                                                        )}
                                                    </div>
                                                    <div className="stop-content">
                                                        <div className="stop-title">
                                                            <i className="fas fa-location-dot"></i>
                                                            <strong>{stop.STOP_NAME}</strong>
                                                            {index === 0 && <span className="stop-badge start">START</span>}
                                                            {index === routeStops[route.R_ID].length - 1 && <span className="stop-badge end">END</span>}
                                                        </div>
                                                        <div className="stop-location-text">
                                                            <i className="fas fa-map-marker-alt"></i>
                                                            {stop.LOCATION || 'Location details not available'}
                                                        </div>
                                                        {(stop.LATITUDE && stop.LONGITUDE) && (
                                                            <div className="stop-coordinates">
                                                                <i className="fas fa-globe"></i>
                                                                Coordinates: {stop.LATITUDE}, {stop.LONGITUDE}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default Routes;


