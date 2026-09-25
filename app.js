const mapSize = 12800;
const players = [
  { layer: 'players', color: 'blue', label: 'Lobo_Solitario', x: 4013.4, z: 8050.6 },
  { layer: 'players', color: 'blue', label: 'Tebaldi-A', x: 6880.2, z: 6412.8 },
  { layer: 'players', color: 'blue', label: 'Sobrevivente_BR', x: 9488.1, z: 10115.2 },
  { layer: 'players', color: 'blue', label: 'Patrulheiro', x: 2870.5, z: 3290.4 }
];
const activity = [
  { id: 1, layer: 'kills', color: 'red', label: 'CorvoNoturno morreu · Patrulheiro · M70 Tundra', detail: 'Torso · 91,4 dano · 168 m', x: 3018.4, z: 3422.7, age: 'há 4 min' },
  { id: 2, layer: 'events', color: 'purple', label: 'Comboio militar detectado', detail: 'Central Economy · ativo', x: 8410.2, z: 9220.1, age: 'há 8 min' },
  { id: 3, layer: 'kills', color: 'red', label: 'Ranger_77 morreu · Lobo_Solitario · M4-A1', detail: 'Cabeça · 88,6 dano · 74 m', x: 4350.2, z: 7884.5, age: 'há 19 min' },
  { id: 4, layer: 'events', color: 'purple', label: 'Helicóptero acidentado', detail: 'Evento dinâmico · ativo', x: 10220.1, z: 5320.8, age: 'há 27 min' },
  { id: 5, layer: 'kills', color: 'red', label: 'NorteFrio morreu · sangramento', detail: 'Causa ambiental', x: 11120.5, z: 11130.2, age: 'há 42 min' }
];
const buried = [
  { layer: 'buried', color: 'yellow', label: 'Caixa de madeira · confirmado', x: 5300, z: 4740 },
  { layer: 'buried', color: 'yellow', label: 'Baú marítimo · confirmado', x: 7640, z: 7150 },
  { layer: 'buried', color: 'yellow', label: 'Saco impermeável · candidato', x: 10650, z: 8820 }
];
const hotspots = [
  { layer: 'hotspots', color: 'orange', label: '12 pontos', x: 4250, z: 7750, score: 12 },
  { layer: 'hotspots', color: 'orange', label: '9 pontos', x: 3250, z: 3250, score: 9 },
  { layer: 'hotspots', color: 'orange', label: '6 pontos', x: 9250, z: 10250, score: 6 },
  { layer: 'hotspots', color: 'orange', label: '4 pontos', x: 6750, z: 6250, score: 4 }
];
const products = [
  { id: 'med', image: 'assets/items/first-aid.jpg', type: 'FirstAidKit', category: 'Medicina', name: 'Bolsa de primeiros socorros', description: 'Recipiente médico original do DayZ.', price: 120 },
  { id: 'food', image: 'assets/items/tactical-bacon.jpg', type: 'TacticalBaconCan', category: 'Sobrevivência', name: 'Bacon enlatado', description: 'Alimento tático pronto para consumo.', price: 90 },
  { id: 'tools', image: 'assets/items/hatchet.jpg', type: 'Hatchet', category: 'Ferramentas', name: 'Machadinha', description: 'Ferramenta de corte e construção.', price: 260 },
  { id: 'ammo', image: 'assets/items/ammo-box.jpg', type: 'AmmoBox', category: 'Munição', name: 'Caixa de munição', description: 'Recipiente resistente para munições.', price: 320 },
  { id: 'clothes', image: 'assets/items/field-backpack.jpg', type: 'AliceBag_Camo', category: 'Equipamento', name: 'Mochila de campo', description: 'Mochila camuflada de alta capacidade.', price: 210 },
  { id: 'vehicle', image: 'assets/items/ada-4x4.jpg', type: 'OffroadHatchback', category: 'Veículos', name: 'Ada 4x4', description: 'Veículo preparado para entrega no reset.', price: 980 }
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const state = { selection: null, cart: new Map(), basemap: 'topographic' };

const mapExtent = 256;
const mapBounds = window.L.latLngBounds([[-mapExtent, 0], [0, mapExtent]]);
const map = window.L.map('map', {
  crs: window.L.CRS.Simple,
  minZoom: 0,
  maxZoom: 5,
  zoomControl: false,
  attributionControl: false,
  maxBounds: mapBounds.pad(.35),
  maxBoundsViscosity: .82,
  wheelPxPerZoomLevel: 72,
  zoomSnap: .25,
  zoomDelta: .5
});
const baseLayers = {
  topographic: window.L.imageOverlay('assets/livonia-topographic.webp', mapBounds, { interactive: false }),
  satellite: window.L.imageOverlay('assets/livonia-satellite.webp', mapBounds, { interactive: false })
};
const markerGroups = Object.fromEntries(['players', 'kills', 'events', 'hotspots', 'buried'].map((name) => [name, window.L.layerGroup().addTo(map)]));
let selectionMarker = null;

function toLatLng(point) {
  return window.L.latLng((point.z / mapSize * mapExtent) - mapExtent, point.x / mapSize * mapExtent);
}

function fromLatLng(latlng) {
  return {
    x: Math.max(0, Math.min(mapSize, latlng.lng / mapExtent * mapSize)),
    z: Math.max(0, Math.min(mapSize, (latlng.lat + mapExtent) / mapExtent * mapSize))
  };
}

function setBasemap(name) {
  if (!baseLayers[name] || state.basemap === name && map.hasLayer(baseLayers[name])) return;
  Object.values(baseLayers).forEach((layer) => map.removeLayer(layer));
  baseLayers[name].addTo(map).bringToBack();
  state.basemap = name;
  $$('[data-basemap]').forEach((button) => button.classList.toggle('active', button.dataset.basemap === name));
}

function showView(name) {
  $$('.nav').forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  $$('.view').forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === name));
  location.hash = name;
  if (name === 'mapa') requestAnimationFrame(() => map.invalidateSize({ pan: false }));
}

function enabledLayers() { return new Set($$('#layers input:checked').map((input) => input.value)); }
function matches(value) { const term = $('#search').value.trim().toLowerCase(); return !term || value.toLowerCase().includes(term); }

function marker(record) {
  const latlng = toLatLng(record);
  const layer = record.layer === 'hotspots'
    ? window.L.circleMarker(latlng, { radius: 10 + record.score * 1.4, color: '#fb923c', fillColor: '#fb923c', fillOpacity: .22, weight: 2 })
    : window.L.marker(latlng, { icon: window.L.divIcon({ className: '', html: `<span class="tactical-marker ${record.layer} ${record.color}"></span>`, iconSize: [22, 22], iconAnchor: [11, 11] }) });
  layer.bindTooltip(record.label, { direction: 'right', offset: [10, 0], className: 'bhc-tooltip' });
  layer.on('click', () => selectPoint(record));
  return layer;
}

function renderMap() {
  const active = enabledLayers();
  const records = [...players, ...activity, ...buried, ...hotspots].filter((record) => active.has(record.layer) && matches(record.label));
  Object.values(markerGroups).forEach((group) => group.clearLayers());
  records.forEach((record) => markerGroups[record.layer].addLayer(marker(record)));
  $('#feed').innerHTML = activity.filter((record) => active.has(record.layer) && matches(record.label)).map((record) => `<button class="feed-row" data-event="${record.id}"><i class="${record.color}">${record.layer === 'kills' ? '✕' : '◆'}</i><span><strong>${record.label}</strong><small>${record.detail} · ${record.age}</small></span></button>`).join('');
  $$('[data-event]').forEach((button) => button.addEventListener('click', () => selectPoint(activity.find((item) => item.id === Number(button.dataset.event)))));
}

function selectPoint(point) {
  if (!point) return;
  state.selection = { x: Number(point.x), z: Number(point.z) };
  if (selectionMarker) map.removeLayer(selectionMarker);
  selectionMarker = window.L.circleMarker(toLatLng(state.selection), { radius: 8, color: '#fff', weight: 3, fillColor: '#ef3340', fillOpacity: 1, pane: 'markerPane' }).addTo(map);
  const text = `X ${state.selection.x.toFixed(1)} · Z ${state.selection.z.toFixed(1)} · Y 0.0`;
  $('#selection').textContent = text;
  $('#delivery-coordinate').textContent = text;
  $('#izurvive').classList.remove('disabled');
  $('#izurvive').href = `https://www.izurvive.com/livonia/#location=${state.selection.x.toFixed(1)};${state.selection.z.toFixed(1)};2`;
  renderCart();
}

function renderProducts() {
  const term = $('#shop-search').value.trim().toLowerCase();
  $('#products').innerHTML = products.filter((item) => !term || `${item.name} ${item.category} ${item.type}`.toLowerCase().includes(term)).map((item) => `<article class="product"><div class="product-art"><img src="${item.image}" alt="${item.name} no DayZ" loading="lazy"></div><div class="product-body"><small>${item.category}</small><h3>${item.name}</h3><p>${item.description}</p><code>${item.type}</code></div><div class="product-foot"><strong>${item.price} moedas</strong><button data-product="${item.id}">Adicionar</button></div></article>`).join('');
  $$('[data-product]').forEach((button) => button.addEventListener('click', () => { const quantity = state.cart.get(button.dataset.product) || 0; if (quantity < 10) state.cart.set(button.dataset.product, quantity + 1); renderCart(); }));
}

function renderCart() {
  const entries = [...state.cart.entries()].map(([id, quantity]) => ({ item: products.find((product) => product.id === id), quantity })).filter((entry) => entry.item);
  $('#cart-list').innerHTML = entries.length ? entries.map(({ item, quantity }) => `<div class="cart-item"><div><strong>${item.name} × ${quantity}</strong><small>${item.price * quantity} moedas</small></div><button data-remove="${item.id}" aria-label="Remover ${item.name}">×</button></div>`).join('') : '<p class="empty">Seu carrinho está vazio.</p>';
  $$('[data-remove]').forEach((button) => button.addEventListener('click', () => { state.cart.delete(button.dataset.remove); renderCart(); }));
  const total = entries.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);
  $('#cart-total').textContent = `${total.toLocaleString('pt-BR')} moedas`;
  $('#checkout').disabled = !entries.length || !state.selection || total > 1250;
}

$$('[data-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
$('#layers').addEventListener('change', renderMap);
$('#search').addEventListener('input', renderMap);
$('#shop-search').addEventListener('input', renderProducts);
$('#zoom-in').addEventListener('click', () => map.zoomIn());
$('#zoom-out').addEventListener('click', () => map.zoomOut());
$('#zoom-reset').addEventListener('click', () => map.fitBounds(mapBounds, { animate: true, padding: [8, 8] }));
$$('[data-basemap]').forEach((button) => button.addEventListener('click', () => setBasemap(button.dataset.basemap)));
$('#checkout').addEventListener('click', () => { $('#checkout').textContent = '✓ Pedido simulado'; $('#checkout').disabled = true; });

map.on('mousemove', (event) => { const point = fromLatLng(event.latlng); $('#coords').textContent = `X ${point.x.toFixed(1)} · Z ${point.z.toFixed(1)} · zoom ${map.getZoom().toFixed(1)}×`; });
map.on('click', (event) => selectPoint(fromLatLng(event.latlng)));
map.on('zoomend', () => { $('#zoom-reset').textContent = `Zoom ${map.getZoom().toFixed(1)}×`; });

setBasemap('topographic');
map.fitBounds(mapBounds, { animate: false, padding: [8, 8] });
renderMap();
renderProducts();
renderCart();
showView(location.hash === '#loja' ? 'loja' : 'mapa');
