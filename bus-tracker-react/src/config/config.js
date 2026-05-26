// Smart Bus Tracker - Frontend Configuration
export const CONFIG = {
    // Backend API Configuration
    // Use '/api' to proxy through Vite (same origin - no CORS issues!)
    API_BASE_URL: '/api',

    // OpenStreetMap via Leaflet (free — no API key required)
    MAP_TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    MAP_TILE_ATTRIBUTION:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

    // Map Default Settings
    MAP_DEFAULT_CENTER: {
        lat: 30.273378372192383,
        lng: 77.99981689453125,
    },
    MAP_DEFAULT_ZOOM: 12,

    // Auto-refresh settings (milliseconds)
    AUTO_REFRESH_INTERVAL: 3000,

    // GPS Update settings (milliseconds)
    GPS_UPDATE_INTERVAL: 5000,

    // Toast notification duration (milliseconds)
    TOAST_DURATION: 3000,

    // Application Info
    APP_NAME: 'Smart Bus Tracker',
    APP_VERSION: '2.0.0',
};

export default CONFIG;
