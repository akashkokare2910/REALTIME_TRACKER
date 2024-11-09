const socket = io();

const map = L.map("map").setView([0, 0], 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Map data © OpenStreetMap contributors",
}).addTo(map);

const markers = {};
let userMarker = null;
let accuracyCircle = null;
let isInitialLocation = true;

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;

            socket.emit("send location", { latitude, longitude });

            if (isInitialLocation) {
                map.setView([latitude, longitude], 13);
                isInitialLocation = false;
            }

            if (userMarker) {
                userMarker.setLatLng([latitude, longitude]);
            } else {
                userMarker = L.marker([latitude, longitude], { title: "You are here" }).addTo(map);
            }

            if (accuracyCircle) {
                accuracyCircle.setLatLng([latitude, longitude]).setRadius(accuracy);
            } else {
                accuracyCircle = L.circle([latitude, longitude], {
                    radius: accuracy,
                    color: "blue",
                    opacity: 0.4,
                    fillOpacity: 0.1,
                }).addTo(map);
            }
        },
        (error) => {
            console.error("Geolocation error:", error);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
        }
    );
}

socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    if (markers[id]) {
        markers[id].setLatLng([latitude, longitude]);
    } else {
        markers[id] = L.marker([latitude, longitude]).addTo(map);
    }
});

socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]);
        delete markers[id];
    }
});
