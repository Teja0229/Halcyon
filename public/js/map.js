// Halycon Interactive Map Engine
document.addEventListener("DOMContentLoaded", async () => {
    const mapElement = document.getElementById("map");
    if (!mapElement || typeof L === "undefined") return;

    // Standard coordinate lookup for all default locations
    const knownLocations = {
        "malibu": [34.0259, -118.7798],
        "new york city": [40.7128, -74.0060],
        "new york": [40.7128, -74.0060],
        "aspen": [39.1911, -106.8175],
        "florence": [43.7696, 11.2558],
        "tuscany": [43.7711, 11.2486],
        "portland": [45.5152, -122.6784],
        "cancun": [21.1619, -86.8515],
        "lake tahoe": [39.0968, -120.0324],
        "los angeles": [34.0522, -118.2437],
        "verbier": [46.0968, 7.2286],
        "serengeti": [-2.3333, 34.8333],
        "serengeti national park": [-2.3333, 34.8333],
        "amsterdam": [52.3676, 4.9041],
        "fiji": [-17.7134, 178.0650],
        "cotswolds": [51.9294, -1.8433],
        "boston": [42.3601, -71.0589],
        "bali": [-8.4095, 115.1889],
        "banff": [51.1784, -115.5708],
        "miami": [25.7617, -80.1918],
        "phuket": [7.8804, 98.3923],
        "scottish highlands": [57.3229, -4.4244],
        "dubai": [25.2048, 55.2708],
        "montana": [46.8797, -110.3626],
        "mykonos": [37.4467, 25.3289],
        "costa rica": [9.7489, -83.7534],
        "charleston": [32.7765, -79.9311],
        "tokyo": [35.6762, 139.6503],
        "new hampshire": [43.1939, -71.5724],
        "maldives": [3.2028, 73.2207],
        "santorini": [36.3932, 25.4615],
        "alleppey": [9.4981, 76.3388],
        "jaisalmer": [26.9157, 70.9083],
        "bora bora": [-16.5004, -151.7415],
        "rovaniemi": [66.5039, 25.7294],
        "bordeaux": [44.8378, -0.5792],
        "anjuna": [15.5833, 73.7431],
        "goa": [15.2993, 74.1240],
        "kyoto": [35.0116, 135.7681],
        "masai mara": [-1.4900, 35.1439],
        "jaipur": [26.9124, 75.7873],
        "delhi": [28.6139, 77.2090],
        "new delhi": [28.6139, 77.2090],
        "mumbai": [19.0760, 72.8777],
        "bengaluru": [12.9716, 77.5946],
        "bangalore": [12.9716, 77.5946],
        "london": [51.5074, -0.1278],
        "paris": [48.8566, 2.3522],
        "rome": [41.9028, 12.4964],
        "sydney": [-33.8688, 151.2093],
        "san francisco": [37.7749, -122.4194]
    };

    let lat = null;
    let lng = null;

    // 1. Check if GeoJSON coordinates are saved on listing [lng, lat]
    if (typeof listingCoords !== "undefined" && Array.isArray(listingCoords) && listingCoords.length === 2) {
        if (listingCoords[0] !== 0 || listingCoords[1] !== 0) {
            lng = Number(listingCoords[0]);
            lat = Number(listingCoords[1]);
        }
    }

    // 2. Lookup by city name in local dictionary
    if (lat === null && typeof listingLocation === "string") {
        const cleanedLoc = listingLocation.toLowerCase().trim();
        for (let cityKey in knownLocations) {
            if (cleanedLoc.includes(cityKey) || cityKey.includes(cleanedLoc)) {
                [lat, lng] = knownLocations[cityKey];
                break;
            }
        }
    }

    // 3. Fallback: Dynamic Geocoding via OpenStreetMap Nominatim API
    if (lat === null && typeof listingLocation === "string") {
        try {
            const query = `${listingLocation}, ${typeof listingCountry !== "undefined" ? listingCountry : ""}`.trim();
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
                headers: { "Accept-Language": "en" }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    lat = parseFloat(data[0].lat);
                    lng = parseFloat(data[0].lon);
                }
            }
        } catch (e) {
            console.warn("Geocoding failed, using default coordinates:", e);
        }
    }

    // 4. Ultimate fallback (Jaipur / New Delhi) if still unresolved
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
        lat = 26.9124;
        lng = 75.7873;
    }

    const targetCoords = [lat, lng];

    // Initialize Leaflet Map
    const map = L.map("map", {
        scrollWheelZoom: false,
        zoomControl: true
    }).setView(targetCoords, 12);

    // OpenStreetMap Tile Layer
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Airbnb-style Privacy Neighborhood Circle
    L.circle(targetCoords, {
        color: "#fe424d",
        fillColor: "#fe424d",
        fillOpacity: 0.15,
        weight: 1.5,
        radius: 750 // 750 meters neighborhood radius
    }).addTo(map);

    // Custom Red Pin Marker
    const customPinIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
            <div class="marker-pulse-ring"></div>
            <div class="marker-pin-badge">
                <i class="fa-solid fa-house-chimney"></i>
            </div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 42],
        popupAnchor: [0, -40]
    });

    const marker = L.marker(targetCoords, { icon: customPinIcon }).addTo(map);

    // Rich Popup
    const popupContent = `
        <div class="halycon-map-popup p-1">
            <span class="badge bg-danger rounded-pill px-2 py-1 mb-1 text-white" style="font-size: 0.7rem;">
                <i class="fa-solid fa-compass me-1"></i> Halycon Stay
            </span>
            <h6 class="fw-bold mb-1 text-dark" style="font-size: 0.95rem; line-height: 1.3;">${typeof listingTitle !== 'undefined' ? listingTitle : 'Stay'}</h6>
            <div class="text-secondary small mb-2">
                <i class="fa-solid fa-location-dot text-danger me-1"></i>${typeof listingLocation !== 'undefined' ? listingLocation : ''}, ${typeof listingCountry !== 'undefined' ? listingCountry : ''}
            </div>
            <div class="border-top pt-2 d-flex align-items-center justify-content-between gap-2">
                <span class="fw-bold text-dark">&#8377; ${typeof listingPrice !== 'undefined' ? listingPrice : ''} <small class="text-muted fw-normal">/ night</small></span>
                <span class="badge bg-success-subtle text-success small" style="font-size: 0.72rem;">Available</span>
            </div>
            <div class="mt-2 text-danger small fw-semibold" style="font-size: 0.75rem;">
                <i class="fa-solid fa-lock me-1"></i> Exact location provided after booking
            </div>
        </div>
    `;

    marker.bindPopup(popupContent, { maxWidth: 280, closeButton: false }).openPopup();

    // Recenter Button Listener
    const recenterBtn = document.getElementById("recenterMapBtn");
    if (recenterBtn) {
        recenterBtn.addEventListener("click", () => {
            map.flyTo(targetCoords, 12, {
                animate: true,
                duration: 1.2
            });
            marker.openPopup();
        });
    }

    // Invalidate map size to ensure tiles render seamlessly
    setTimeout(() => {
        map.invalidateSize();
    }, 250);
});
