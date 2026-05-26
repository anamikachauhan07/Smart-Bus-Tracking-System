import { L } from './leafletSetup';

export function createBusIcon(color = '#2563eb') {
    return L.divIcon({
        className: 'bus-marker-icon',
        html: `<div class="bus-marker-pin" style="background:${color}"><i class="fas fa-bus"></i></div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -16],
    });
}

export function createSvgBusIcon(color) {
    const svg = encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="3"/>
            <text x="20" y="26" font-size="18" fill="white" text-anchor="middle" font-family="Arial">B</text>
        </svg>
    `);

    return L.icon({
        iconUrl: `data:image/svg+xml;charset=UTF-8,${svg}`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -16],
    });
}

export function buildBusPopup({ busNo, driverName, timestamp }) {
    return `
        <div class="map-popup">
            <h4>Bus ${busNo}</h4>
            <p><strong>Driver:</strong> ${driverName || 'N/A'}</p>
            <p><strong>Updated:</strong> ${timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}</p>
        </div>
    `;
}
