import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let initialized = false;

export function initLeafletDefaults() {
    if (initialized) {
        return;
    }

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2x,
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
    });

    initialized = true;
}

export function createTileLayer(tileUrl, attribution) {
    return L.tileLayer(tileUrl, {
        attribution,
        maxZoom: 19,
    });
}

export { L };
