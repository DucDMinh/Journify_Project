const EARTH_RADIUS_METERS = 6371000;

// Khoảng cách đường chim bay giữa 2 tọa độ theo công thức Haversine (mét)
export const distanceMeters = (a, b) => {
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
};

export const chunkPath = (points, maxPoints, maxSpanMeters = Infinity) => {
    if (points.length < 2) return [];
    const chunks = [];
    let current = [points[0]];
    let span = 0;
    for (let i = 1; i < points.length; i += 1) {
        const step = Number.isFinite(maxSpanMeters) ? distanceMeters(points[i - 1], points[i]) : 0;
        if (current.length >= maxPoints || (current.length > 1 && span + step > maxSpanMeters)) {
            chunks.push(current);
            current = [points[i - 1]];
            span = 0;
        }
        current.push(points[i]);
        span += step;
    }
    chunks.push(current);
    return chunks;
};
