// Profile Page Component
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DriverDashboard from '../components/DriverDashboard';
import api from '../services/api';
import showToast from '../utils/toast';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [studentDetails, setStudentDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.user_type === 'student') {
            loadStudentDetails();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadStudentDetails = async () => {
        try {
            const response = await api.students.getDetails(user.email);
            if (response.data.success) {
                setStudentDetails(response.data.data);
            } else {
                setStudentDetails(null);
            }
        } catch (error) {
            console.error('Failed to load student details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    if (!user) {
        return (
            <section id="profile" className="page-section">
                <div className="page-header">
                    <h1><i className="fas fa-user-circle"></i> My Profile</h1>
                    <p>Please login to view your profile</p>
                </div>
                <div className="content-card empty-state-card">
                    <div className="empty-state-icon">
                        <i className="fas fa-user-lock"></i>
                    </div>
                    <h3>Authentication Required</h3>
                    <p>Sign in to access your profile and bus service details</p>
                </div>
            </section>
        );
    }

    if (user.user_type === 'driver') {
        return <DriverDashboard />;
    }

    return (
        <section id="profile" className="page-section">
            <div className="page-header">
                <h1><i className="fas fa-user-circle"></i> My Profile</h1>
                <p>View and manage your account information</p>
            </div>
            
            {loading ? (
                <div className="content-card loading-card">
                    <div className="loading-spinner">
                        <i className="fas fa-spinner fa-spin"></i>
                    </div>
                    <p>Loading your profile...</p>
                </div>
            ) : (
                <div className="profile-grid">
                    {/* Account Information Card */}
                    <div className="content-card profile-main-card">
                        <div className="card-header-fancy">
                            <div className="header-icon">
                                <i className="fas fa-user-circle"></i>
                            </div>
                            <div>
                                <h3>Account Information</h3>
                                <span className="header-subtitle">Your login credentials and account type</span>
                            </div>
                        </div>
                        
                        <div className="profile-hero">
                            <div className="profile-avatar-large">
                                <span className="avatar-initials">
                                    {user.username?.charAt(0).toUpperCase()}
                                </span>
                                <div className="avatar-badge">
                                    <i className="fas fa-check"></i>
                                </div>
                            </div>
                            <div className="profile-identity">
                                <h2 className="profile-name">{user.username}</h2>
                                <span className="profile-email">{user.email}</span>
                                <span className="profile-type-badge">
                                    <i className="fas fa-graduation-cap"></i>
                                    {user.user_type}
                                </span>
                            </div>
                        </div>
                        
                        <div className="profile-stats-row">
                            <div className="profile-stat">
                                <i className="fas fa-shield-halved"></i>
                                <span>Verified Account</span>
                            </div>
                            <div className="profile-stat">
                                <i className="fas fa-bell"></i>
                                <span>Notifications On</span>
                            </div>
                        </div>
                    </div>

                    {/* Bus Service Registration Info */}
                    {studentDetails ? (
                        <>
                            <div className="content-card">
                                <div className="card-header-fancy">
                                    <div className="header-icon bus-icon">
                                        <i className="fas fa-bus"></i>
                                    </div>
                                    <div>
                                        <h3>Bus Service Details</h3>
                                        <span className="header-subtitle">Your registered transportation info</span>
                                    </div>
                                </div>
                                
                                <div className="info-cards-grid">
                                    <div className="mini-info-card">
                                        <i className="fas fa-id-card"></i>
                                        <div>
                                            <span className="info-label">Full Name</span>
                                            <span className="info-value">{studentDetails.S_NAME}</span>
                                        </div>
                                    </div>
                                    {studentDetails.S_PHONE && (
                                        <div className="mini-info-card">
                                            <i className="fas fa-phone"></i>
                                            <div>
                                                <span className="info-label">Phone</span>
                                                <span className="info-value">{studentDetails.S_PHONE}</span>
                                            </div>
                                        </div>
                                    )}
                                    {studentDetails.REGISTRATION_DATE && (
                                        <div className="mini-info-card">
                                            <i className="fas fa-calendar-check"></i>
                                            <div>
                                                <span className="info-label">Registered</span>
                                                <span className="info-value">
                                                    {new Date(studentDetails.REGISTRATION_DATE).toLocaleDateString('en-US', { 
                                                        year: 'numeric', 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {studentDetails.R_ID && (
                                <div className="content-card route-card">
                                    <div className="card-header-fancy">
                                        <div className="header-icon route-icon">
                                            <i className="fas fa-route"></i>
                                        </div>
                                        <div>
                                            <h3>Route & Stop</h3>
                                            <span className="header-subtitle">Your assigned route and pickup point</span>
                                        </div>
                                    </div>
                                    
                                    <div className="route-visual">
                                        <div className="route-endpoint start">
                                            <div className="endpoint-dot"></div>
                                            <div className="endpoint-info">
                                                <span className="endpoint-label">Start</span>
                                                <span className="endpoint-name">{studentDetails.START_POINT}</span>
                                            </div>
                                        </div>
                                        <div className="route-line">
                                            <div className="route-name-badge">{studentDetails.R_NAME}</div>
                                            {studentDetails.DISTANCE && (
                                                <span className="route-distance">{studentDetails.DISTANCE} km</span>
                                            )}
                                        </div>
                                        <div className="route-endpoint end">
                                            <div className="endpoint-dot"></div>
                                            <div className="endpoint-info">
                                                <span className="endpoint-label">End</span>
                                                <span className="endpoint-name">{studentDetails.END_POINT}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {studentDetails.STOP_NAME && (
                                        <div className="my-stop-highlight">
                                            <div className="stop-icon-wrapper">
                                                <i className="fas fa-location-dot"></i>
                                            </div>
                                            <div className="stop-details">
                                                <span className="stop-badge-label">Your Pickup Stop</span>
                                                <h4>{studentDetails.STOP_NAME}</h4>
                                                {studentDetails.LOCATION && (
                                                    <p>{studentDetails.LOCATION}</p>
                                                )}
                                                {studentDetails.STOP_ORDER && (
                                                    <span className="stop-order-badge">Stop #{studentDetails.STOP_ORDER}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <button 
                                        className="btn btn-primary btn-track" 
                                        onClick={() => navigate('/tracking', { state: { routeId: studentDetails.R_ID } })}
                                    >
                                        <i className="fas fa-satellite-dish"></i> Track My Bus
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="content-card empty-state-card">
                            <div className="empty-state-icon warning">
                                <i className="fas fa-bus"></i>
                            </div>
                            <h3>Bus Service Not Registered</h3>
                            <p>Register now to get real-time bus tracking and arrival notifications</p>
                            <button 
                                className="btn btn-primary"
                                onClick={() => navigate('/register')}
                            >
                                <i className="fas fa-user-plus"></i> Register for Bus Service
                            </button>
                        </div>
                    )}

                    {/* Logout Card */}
                    <div className="content-card logout-card">
                        <div className="logout-content">
                            <div>
                                <h4>Sign Out</h4>
                                <p>End your current session</p>
                            </div>
                            <button className="btn btn-danger" onClick={handleLogout}>
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Profile;



