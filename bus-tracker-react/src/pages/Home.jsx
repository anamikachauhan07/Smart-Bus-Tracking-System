// Home Page Component
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthModal from '../components/AuthModal';

const Home = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        if (location.state?.showLogin) {
            setShowAuthModal(true);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    return (
        <>
        <section id="home" className="page-section active">
            {/* Premium Hero Section */}
            <div className="hero-section">
                <div className="hero-decoration hero-decoration-1"></div>
                <div className="hero-decoration hero-decoration-2"></div>
                <div className="hero-decoration hero-decoration-3"></div>
                
                <div className="hero-content">
                    <div className="hero-badge">
                        <span className="badge-dot"></span>
                        <span>Live Tracking Available</span>
                    </div>
                    
                    <h1 className="hero-title">
                        <span className="title-line">Smart Bus</span>
                        <span className="title-highlight">Tracking System</span>
                    </h1>
                    
                    <p className="hero-subtitle">
                        Experience seamless campus transportation with real-time GPS tracking, 
                        instant notifications, and smart route planning.
                    </p>
                    
                    <div className="hero-actions">
                        <button className="btn btn-hero" onClick={() => navigate('/tracking')}>
                            <i className="fas fa-satellite-dish"></i> 
                            <span>Track Bus Now</span>
                            <i className="fas fa-arrow-right btn-arrow"></i>
                        </button>
                        <button className="btn btn-hero-outline" onClick={() => navigate('/routes')}>
                            <i className="fas fa-route"></i> View All Routes
                        </button>
                    </div>
                    
                    {/* Stats Section */}
                    <div className="hero-stats">
                        <div className="stat-item">
                            <div className="stat-value">24/7</div>
                            <div className="stat-label">Live Tracking</div>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <div className="stat-value">10+</div>
                            <div className="stat-label">Active Routes</div>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <div className="stat-value">500+</div>
                            <div className="stat-label">Students Served</div>
                        </div>
                    </div>
                </div>
                
                {/* Floating Bus Icon */}
                <div className="hero-visual">
                    <div className="bus-icon-wrapper">
                        <i className="fas fa-bus"></i>
                        <div className="pulse-ring"></div>
                        <div className="pulse-ring pulse-ring-2"></div>
                    </div>
                </div>
            </div>
            
            {/* Section Title */}
            <div className="section-header">
                <h2 className="section-title">
                    <i className="fas fa-star"></i>
                    Key Features
                </h2>
                <p className="section-subtitle">Everything you need for a seamless commute experience</p>
            </div>
            
            {/* Premium Features Grid */}
            <div className="features-grid">
                <div className="feature-card" onClick={() => navigate('/tracking')}>
                    <div className="feature-glow"></div>
                    <div className="feature-icon">
                        <i className="fas fa-location-arrow"></i>
                    </div>
                    <h3>Real-Time Tracking</h3>
                    <p>Track your bus location live on interactive maps with precise GPS coordinates</p>
                    <div className="feature-link">
                        <span>Track Now</span>
                        <i className="fas fa-chevron-right"></i>
                    </div>
                </div>
                
                <div className="feature-card" onClick={() => navigate('/routes')}>
                    <div className="feature-glow"></div>
                    <div className="feature-icon">
                        <i className="fas fa-map-marked-alt"></i>
                    </div>
                    <h3>Route Information</h3>
                    <p>Browse comprehensive route details with stops, timings, and driver info</p>
                    <div className="feature-link">
                        <span>View Routes</span>
                        <i className="fas fa-chevron-right"></i>
                    </div>
                </div>
                
                <div className="feature-card" onClick={() => navigate('/schedule')}>
                    <div className="feature-glow"></div>
                    <div className="feature-icon">
                        <i className="fas fa-calendar-check"></i>
                    </div>
                    <h3>Bus Schedule</h3>
                    <p>Access detailed schedules with departure and arrival times for planning</p>
                    <div className="feature-link">
                        <span>Check Schedule</span>
                        <i className="fas fa-chevron-right"></i>
                    </div>
                </div>
                
                <div className="feature-card" onClick={() => navigate('/register')}>
                    <div className="feature-glow"></div>
                    <div className="feature-icon">
                        <i className="fas fa-user-graduate"></i>
                    </div>
                    <h3>Easy Registration</h3>
                    <p>Quick sign-up process to select your route and preferred pickup stop</p>
                    <div className="feature-link">
                        <span>Register Now</span>
                        <i className="fas fa-chevron-right"></i>
                    </div>
                </div>
            </div>
            
            {/* Trust Banner */}
            <div className="trust-banner">
                <div className="trust-item">
                    <i className="fas fa-shield-halved"></i>
                    <span>Secure & Reliable</span>
                </div>
                <div className="trust-item">
                    <i className="fas fa-clock"></i>
                    <span>Real-Time Updates</span>
                </div>
                <div className="trust-item">
                    <i className="fas fa-mobile-alt"></i>
                    <span>Mobile Friendly</span>
                </div>
                <div className="trust-item">
                    <i className="fas fa-headset"></i>
                    <span>24/7 Support</span>
                </div>
            </div>
        </section>
            
        {/* Auth Modal */}
        <AuthModal 
            show={showAuthModal} 
            onClose={() => setShowAuthModal(false)} 
        />
        </>
    );
};

export default Home;



