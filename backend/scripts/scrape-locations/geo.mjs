// Ghép các way "outer" của relation OSM thành các vòng khép kín và kiểm tra điểm nằm trong đa giác.

const key = (p) => `${p[0].toFixed(7)},${p[1].toFixed(7)}`;
const first = (a) => a[0];
const last = (a) => a[a.length - 1];

export function stitchOuterRings(relation) {
    const segments = (relation.members ?? [])
        .filter((m) => m.type === 'way' && m.role === 'outer' && m.geometry?.length > 1)
        .map((m) => m.geometry.map((p) => [p.lon, p.lat]));

    const rings = [];
    while (segments.length) {
        let ring = segments.pop();
        let extended = true;
        while (extended && key(first(ring)) !== key(last(ring))) {
            extended = false;
            for (let i = 0; i < segments.length; i++) {
                const s = segments[i];
                if (key(last(ring)) === key(first(s))) ring = ring.concat(s.slice(1));
                else if (key(last(ring)) === key(last(s))) ring = ring.concat([...s].reverse().slice(1));
                else if (key(first(ring)) === key(last(s))) ring = s.concat(ring.slice(1));
                else if (key(first(ring)) === key(first(s))) ring = [...s].reverse().concat(ring.slice(1));
                else continue;
                segments.splice(i, 1);
                extended = true;
                break;
            }
        }
        if (ring.length >= 4) rings.push(ring);
    }
    return rings;
}

export const ringBBox = (ring) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
    return { minX, minY, maxX, maxY };
};

const inBBox = (b, x, y) => x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY;

// Ray casting
const pointInRing = (ring, x, y) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
};

export function buildPolygon(relation) {
    const rings = stitchOuterRings(relation).map((ring) => ({ ring, bbox: ringBBox(ring) }));
    const bbox = ringBBox(rings.flatMap((r) => [[r.bbox.minX, r.bbox.minY], [r.bbox.maxX, r.bbox.maxY]]));
    return {
        bbox,
        rings: rings.length,
        contains: (lng, lat) => inBBox(bbox, lng, lat) && rings.some((r) => inBBox(r.bbox, lng, lat) && pointInRing(r.ring, lng, lat)),
    };
}
