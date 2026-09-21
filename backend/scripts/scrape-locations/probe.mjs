const CLASSES = {
    Q570116: 'tourist attraction', Q1200957: 'tourist destination', Q8502: 'mountain', Q54050: 'hill', Q34038: 'waterfall',
    Q40080: 'beach', Q46169: 'national park', Q179049: 'nature reserve', Q23397: 'lake', Q39816: 'valley', Q35509: 'cave',
    Q33506: 'museum', Q44539: 'temple', Q16970: 'church', Q5393308: 'Buddhist temple', Q22698: 'park', Q839954: 'archaeological site',
    Q57821: 'fortification', Q23413: 'castle', Q16560: 'palace', Q2416723: 'theme park', Q4989906: 'monument', Q9259: 'UNESCO WHS',
    Q23442: 'island', Q1140493: 'archipelago', Q39594: 'bay', Q177380: 'hot spring', Q185113: 'cape', Q483453: 'fountain?',
    Q1497375: 'architectural ensemble', Q12280: 'bridge', Q19860854: 'destroyed building?', Q2065736: 'cultural property', Q15243209: 'historic district',
};

const query = `
SELECT ?cls (COUNT(DISTINCT ?item) AS ?n) WHERE {
  VALUES ?cls { ${Object.keys(CLASSES).map((q) => 'wd:' + q).join(' ')} }
  ?item wdt:P17 wd:Q881; wdt:P31 ?cls; wdt:P625 ?coord.
} GROUP BY ?cls ORDER BY DESC(?n)`;

const res = await fetch('https://query.wikidata.org/sparql', {
    method: 'POST',
    headers: { 'User-Agent': 'Journify-thesis-scraper/1.0 (student project)', Accept: 'application/sparql-results+json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'query=' + encodeURIComponent(query),
});
console.log('status', res.status);
const json = await res.json();
let total = 0;
for (const b of json.results.bindings) {
    const q = b.cls.value.split('/').pop();
    total += +b.n.value;
    console.log(String(b.n.value).padStart(5), q, CLASSES[q]);
}
console.log('TOTAL', total);
