// Schedule Page Component
import { useState, useEffect } from 'react';
import api from '../services/api';
import showToast from '../utils/toast';

const Schedule = () => {
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState('');
    const [selectedRouteName, setSelectedRouteName] = useState('');
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);

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

    const handleRouteChange = (e) => {
        const routeId = e.target.value;
        setSelectedRoute(routeId);
        const route = routes.find(r => r.R_ID === parseInt(routeId));
        setSelectedRouteName(route ? route.R_NAME : '');
    };

    const getSchedule = async () => {
        if (!selectedRoute) {
            showToast('Please select a route', 'warning');
            return;
        }

        setLoading(true);
        try {
            const response = await api.routes.getSchedule(selectedRoute);
            if (response.data.success) {
                setSchedules(response.data.data);
                if (response.data.data.length === 0) {
                    showToast('No schedules found for this route', 'info');
                }
            }
        } catch (error) {
            showToast('Failed to load schedule', 'error');
        } finally {
            setLoading(false);
        }
    };

    const groupByDay = (schedules) => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days.reduce((acc, day) => {
            acc[day] = schedules.filter(s => s.DAY === day);
            return acc;
        }, {});
    };

    const getDayIcon = (day) => {
        const icons = {
            'Monday': 'fa-m',
            'Tuesday': 'fa-t',
            'Wednesday': 'fa-w',
            'Thursday': 'fa-t',
            'Friday': 'fa-f',
            'Saturday': 'fa-s',
            'Sunday': 'fa-s'
        };
        return icons[day] || 'fa-calendar-day';
    };

    const groupedSchedules = groupByDay(schedules);

    return (
        <section id="schedule" className="page-section">
            <div className="page-header">
                <h1><i className="fas fa-clock"></i> Bus Schedule</h1>
                <p>View departure and arrival times for all routes</p>
            </div>
            
            <div className="content-card">
                <div className="schedule-controls">
                    <div className="form-group">
                        <label htmlFor="scheduleRoute"><i className="fas fa-route"></i> Select Route:</label>
                        <select 
                            id="scheduleRoute" 
                            value={selectedRoute}
                            onChange={handleRouteChange}
                        >
                            <option value="">Choose a route...</option>
                            {routes.map(route => (
                                <option key={route.R_ID} value={route.R_ID}>
                                    {route.R_NAME} ({route.START_POINT} - {route.END_POINT})
                                </option>
                            ))}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={getSchedule} disabled={loading}>
                        {loading ? (
                            <><i className="fas fa-spinner fa-spin"></i> Loading...</>
                        ) : (
                            <><i className="fas fa-calendar-alt"></i> Get Schedule</>
                        )}
                    </button>
                </div>
                
                {schedules.length > 0 && (
                    <div className="schedule-results">
                        <div className="schedule-header-info">
                            <div className="schedule-route-badge">
                                <i className="fas fa-route"></i>
                                <span>{selectedRouteName}</span>
                            </div>
                            <span className="schedule-count">
                                <i className="fas fa-list"></i> {schedules.length} schedule(s) found
                            </span>
                        </div>
                        
                        <div className="schedule-days-grid">
                            {Object.entries(groupedSchedules).map(([day, daySchedules]) => {
                                if (daySchedules.length === 0) return null;
                                
                                return (
                                    <div key={day} className="schedule-day-card">
                                        <div className="day-header">
                                            <div className="day-icon">
                                                <i className={`fas ${getDayIcon(day)}`}></i>
                                            </div>
                                            <div className="day-info">
                                                <h3>{day}</h3>
                                                <span>{daySchedules.length} trip(s)</span>
                                            </div>
                                        </div>
                                        
                                        <div className="day-schedules">
                                            {daySchedules.map(schedule => (
                                                <div key={schedule.SCH_ID} className="schedule-item">
                                                    <div className="schedule-bus-info">
                                                        <span className="bus-number">{schedule.B_NO}</span>
                                                        <span className="driver-name">
                                                            <i className="fas fa-user"></i> {schedule.D_NAME}
                                                        </span>
                                                    </div>
                                                    <div className="schedule-times">
                                                        <div className="time-block departure">
                                                            <span className="time-label">Depart</span>
                                                            <span className="time-value">{schedule.D_TIME}</span>
                                                        </div>
                                                        <div className="time-arrow">
                                                            <i className="fas fa-arrow-right"></i>
                                                        </div>
                                                        <div className="time-block arrival">
                                                            <span className="time-label">Arrive</span>
                                                            <span className="time-value">{schedule.A_TIME}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                {!loading && schedules.length === 0 && selectedRoute && (
                    <div className="empty-state-card" style={{marginTop: '2rem'}}>
                        <div className="empty-state-icon">
                            <i className="fas fa-calendar-xmark"></i>
                        </div>
                        <h3>No Schedules Available</h3>
                        <p>There are no schedules for this route yet</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Schedule;



