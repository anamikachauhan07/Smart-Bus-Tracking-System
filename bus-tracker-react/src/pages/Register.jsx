// Student Registration Page Component
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import showToast from '../utils/toast';

const Register = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [routes, setRoutes] = useState([]);
    const [stops, setStops] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        email: '',
        phone: '',
        route_id: '',
        stop_id: ''
    });

    useEffect(() => {
        loadRoutes();
        
        // Pre-fill username, name, and email if coming from auth modal
        if (location.state?.username && location.state?.name && location.state?.email) {
            setFormData(prev => ({
                ...prev,
                username: location.state.username,
                name: location.state.name,
                email: location.state.email
            }));
            showToast('Please complete your bus service registration', 'info');
        }
    }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

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
        if (!routeId) {
            setStops([]);
            return;
        }

        try {
            const response = await api.routes.getStops(routeId);
            if (response.data.success) {
                setStops(response.data.data);
            }
        } catch (error) {
            showToast('Failed to load stops', 'error');
        }
    };

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone) => {
        // Phone: 10 digits only
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phone);
    };

    const validateName = (name) => {
        // Name: letters and spaces only, 2-50 characters
        const nameRegex = /^[a-zA-Z\s]{2,50}$/;
        return nameRegex.test(name.trim());
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Special handling for phone - only allow digits
        if (name === 'phone') {
            if (value && !/^\d*$/.test(value)) {
                return; // Don't update if not a number
            }
            if (value.length > 10) {
                return; // Max 10 digits
            }
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        if (name === 'route_id') {
            loadStops(value);
            // Find and set selected route details
            const route = routes.find(r => r.R_ID === parseInt(value));
            setSelectedRoute(route);
            setFormData(prev => ({
                ...prev,
                stop_id: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Comprehensive Validation
        const newErrors = {};
        
        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (!validateName(formData.name)) {
            newErrors.name = 'Name must be 2-50 characters, letters and spaces only';
        }
        
        // Email validation
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        // Phone validation
        if (formData.phone && !validatePhone(formData.phone)) {
            newErrors.phone = 'Phone must be exactly 10 digits';
        }
        
        // Route validation
        if (!formData.route_id) {
            newErrors.route_id = 'Please select a route';
        }
        
        // Stop validation
        if (!formData.stop_id) {
            newErrors.stop_id = 'Please select a stop';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            showToast('Please fix the errors in the form', 'error');
            return;
        }

        try {
            const submitData = {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone || null,
                route_id: parseInt(formData.route_id),
                stop_id: parseInt(formData.stop_id)
            };
            
            const response = await api.students.register(submitData);

            if (response.data.success) {
                showToast('Bus service registration successful! Please login to continue.', 'success');
                setFormData({
                    username: '',
                    name: '',
                    email: '',
                    phone: '',
                    route_id: '',
                    stop_id: ''
                });
                setStops([]);
                setSelectedRoute(null);
                setErrors({});
                
                // Redirect to home page after 2 seconds (where login modal can be opened)
                setTimeout(() => {
                    navigate('/', { state: { showLogin: true } });
                }, 2000);
            }
        } catch (error) {
            showToast(error.error || 'Registration failed', 'error');
        }
    };

    const isPreFilled = location.state?.username && location.state?.name && location.state?.email;

    return (
        <section id="register" className="page-section">
            <div className="page-header">
                <h1><i className="fas fa-user-plus"></i> Bus Service Registration</h1>
                <p>Register for bus tracking service to get notifications and track your bus</p>
            </div>
            
            {isPreFilled && (
                <div className="info-banner success">
                    <div className="banner-icon">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="banner-content">
                        <h4>Account Created Successfully!</h4>
                        <p>Complete your bus service registration by selecting your route and pickup stop below.</p>
                    </div>
                </div>
            )}
            
            <div className="content-card register-card">
                <div className="form-header">
                    <div className="form-icon">
                        <i className="fas fa-clipboard-list"></i>
                    </div>
                    <div>
                        <h3>Registration Form</h3>
                        <span>Fill in your details to register for bus service</span>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="premium-form">
                    {/* Show Username if pre-filled */}
                    {isPreFilled && (
                        <div className="form-group">
                            <label htmlFor="studentUsername"><i className="fas fa-user-circle"></i> Username:</label>
                            <input 
                                type="text" 
                                id="studentUsername" 
                                name="username"
                                value={formData.username}
                                readOnly
                                style={{background: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280'}}
                            />
                            <small className="help-text">Your login username (cannot be changed)</small>
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label htmlFor="studentName"><i className="fas fa-user"></i> Full Name:</label>
                        <input 
                            type="text" 
                            id="studentName" 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe Smith"
                            readOnly={isPreFilled}
                            className={errors.name ? 'error' : ''}
                            style={isPreFilled ? {background: '#f3f4f6', cursor: 'not-allowed'} : {}}
                            required
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                        {!isPreFilled && <small className="help-text">Letters and spaces only, 2-50 characters</small>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="studentEmail"><i className="fas fa-envelope"></i> Email:</label>
                        <input 
                            type="email" 
                            id="studentEmail" 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="student@example.com"
                            readOnly={isPreFilled}
                            className={errors.email ? 'error' : ''}
                            style={isPreFilled ? {background: '#f3f4f6', cursor: 'not-allowed'} : {}}
                            required
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="studentPhone"><i className="fas fa-phone"></i> Phone Number:</label>
                        <input 
                            type="tel" 
                            id="studentPhone" 
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="9876543210"
                            className={errors.phone ? 'error' : ''}
                            maxLength="10"
                        />
                        {errors.phone && <span className="error-message">{errors.phone}</span>}
                        <small className="help-text">10 digits, numbers only (e.g., 9876543210)</small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="routeSelect"><i className="fas fa-route"></i> Select Route:</label>
                        <select 
                            id="routeSelect" 
                            name="route_id"
                            value={formData.route_id}
                            onChange={handleChange}
                            className={errors.route_id ? 'error' : ''}
                            required
                        >
                            <option value="">Choose a route...</option>
                            {routes.map(route => (
                                <option key={route.R_ID} value={route.R_ID}>
                                    {route.R_NAME} ({route.START_POINT} → {route.END_POINT})
                                </option>
                            ))}
                        </select>
                        {errors.route_id && <span className="error-message">{errors.route_id}</span>}
                    </div>
                    
                    {/* Show selected route details */}
                    {selectedRoute && (
                        <div className="route-info-box">
                            <h4><i className="fas fa-info-circle"></i> Route Information</h4>
                            <div className="route-details-compact">
                                <div className="route-detail-row">
                                    <i className="fas fa-play-circle"></i>
                                    <strong>Start:</strong>
                                    <span>{selectedRoute.START_POINT}</span>
                                </div>
                                <div className="route-detail-row">
                                    <i className="fas fa-stop-circle"></i>
                                    <strong>End:</strong>
                                    <span>{selectedRoute.END_POINT}</span>
                                </div>
                                {selectedRoute.DISTANCE && (
                                    <div className="route-detail-row">
                                        <i className="fas fa-road"></i>
                                        <strong>Distance:</strong>
                                        <span>{selectedRoute.DISTANCE} km</span>
                                    </div>
                                )}
                                {stops.length > 0 && (
                                    <div className="route-detail-row">
                                        <i className="fas fa-map-pin"></i>
                                        <strong>Total Stops:</strong>
                                        <span>{stops.length} stops on this route</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label htmlFor="stopSelect"><i className="fas fa-map-marker-alt"></i> Select Your Stop:</label>
                        <select 
                            id="stopSelect" 
                            name="stop_id"
                            value={formData.stop_id}
                            onChange={handleChange}
                            className={errors.stop_id ? 'error' : ''}
                            required
                            disabled={!formData.route_id}
                        >
                            <option value="">{formData.route_id ? 'Choose your stop...' : 'Select a route first'}</option>
                            {stops.map((stop, index) => (
                                <option key={stop.STOP_ID} value={stop.STOP_ID}>
                                    {stop.STOP_ORDER || index + 1}. {stop.STOP_NAME} - {stop.LOCATION}
                                </option>
                            ))}
                        </select>
                        {errors.stop_id && <span className="error-message">{errors.stop_id}</span>}
                        {stops.length > 0 && !formData.stop_id && !errors.stop_id && (
                            <small className="help-text">
                                <i className="fas fa-lightbulb"></i> Select the stop closest to your location
                            </small>
                        )}
                    </div>
                    <div className="form-footer">
                        <button type="submit" className="btn btn-success btn-block btn-large">
                            <i className="fas fa-user-check"></i> Complete Registration
                        </button>
                        <p className="form-note">
                            <i className="fas fa-lock"></i> Your information is secure and will only be used for bus service
                        </p>
                    </div>
                </form>
            </div>
        </section>
    );
};

export default Register;


