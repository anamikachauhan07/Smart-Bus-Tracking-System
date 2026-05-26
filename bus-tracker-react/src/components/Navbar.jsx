// Navbar Component
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = ({ onShowAuthModal }) => {
    const { user, isAuthenticated, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="nav-container">
                <Link to="/" className="nav-brand">
                    <i className="fas fa-bus"></i>
                    <span>Smart Bus Tracker</span>
                </Link>
                
                <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                    <i className="fas fa-bars"></i>
                </button>
                
                <div className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`} id="navMenu">
                    <Link 
                        to="/" 
                        className={`nav-link ${isActive('/') ? 'active' : ''}`}
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <i className="fas fa-home"></i> Home
                    </Link>
                    
                    {/* Show Routes only for students (authenticated or not) */}
                    {(!isAuthenticated || user?.user_type === 'student') && (
                        <Link 
                            to="/routes" 
                            className={`nav-link ${isActive('/routes') ? 'active' : ''}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <i className="fas fa-route"></i> Routes
                        </Link>
                    )}
                    
                    {/* Show Schedule and Track Bus only for authenticated students */}
                    {isAuthenticated && user?.user_type === 'student' && (
                        <>
                            <Link 
                                to="/schedule" 
                                className={`nav-link ${isActive('/schedule') ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <i className="fas fa-clock"></i> Schedule
                            </Link>
                            <Link 
                                to="/tracking" 
                                className={`nav-link ${isActive('/tracking') ? 'active' : ''}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <i className="fas fa-map-marker-alt"></i> Track Bus
                            </Link>
                        </>
                    )}
                    {isAuthenticated && (
                        <Link 
                            to="/profile" 
                            className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <i className="fas fa-user-circle"></i> Profile
                        </Link>
                    )}
                </div>
                
                <div className="nav-auth">
                    {isAuthenticated && (
                        <div className="user-info">
                            <span className="user-name">
                                <i className="fas fa-user"></i> {user?.username}
                            </span>
                        </div>
                    )}
                    {isAuthenticated ? (
                        <button className="btn-nav-auth" onClick={handleLogout}>
                            <i className="fas fa-sign-out-alt"></i> Logout
                        </button>
                    ) : (
                        <button className="btn-nav-auth" onClick={onShowAuthModal}>
                            <i className="fas fa-sign-in-alt"></i> Login
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;


