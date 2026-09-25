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
  { id: 'med', icon: '🩹', category: 'Medicina', name: 'Kit médico', description: 'Bandagens e suprimentos essenciais.', price: 120 },
  { id: 'food', icon: '🥫', category: 'Sobrevivência', name: 'Kit de alimentos', description: 'Pacote de comida e hidratação.', price: 90 },
  { id: 'tools', icon: '🪓', category: 'Ferramentas', name: 'Kit construção', description: 'Ferramentas para manutenção da base.', price: 260 },
  { id: 'ammo', icon: '📦', category: 'Munição', name: 'Caixa de munição', description: 'Munição selecionada no pedido real.', price: 320 },
  { id: 'clothes', icon: '🎒', category: 'Equipamento', name: 'Mochila tática', description: 'Armazenamento para longas viagens.', price: 210 },
  { id: 'vehicle', icon: '🚙', category: 'Veículos', name: 'Ada 4x4', description: 'Entrega segura no próximo reset.', price: 980 }
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const state = { scale: 1, x: 0, y: 0, selection: null, cart: new Map() };

function showView(name) {
  $$('.nav').forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  $$('.view').forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === name));
  location.hash = name;
}

function enabledLayers() { return new Set($$('#layers input:checked').map((input) => input.value)); }
function matches(value) { const term = $('#search').value.trim().toLowerCase(); return !term || value.toLowerCase().includes(term); }

function marker(record) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `marker ${record.layer} ${record.color}`;
  button.style.left = `${record.x / mapSize * 100}%`;
  button.style.top = `${(1 - record.z / mapSize) * 100}%`;
  if (record.layer === 'hotspots') {
    const size = 22 + record.score * 2.7;
    button.style.width = `${size}px`;
    button.style.height = `${size}px`;
  }
  button.title = record.label;
  button.setAttribute('aria-label', record.label);
  const text = document.createElement('span');
  text.textContent = record.label;
  button.append(text);
  button.addEventListener('click', (event) => { event.stopPropagation(); selectPoint(record); });
  return button;
}

function renderMap() {
  const active = enabledLayers();
  const records = [...players, ...activity, ...buried, ...hotspots].filter((record) => active.has(record.layer) && matches(record.label));
  $('#markers').replaceChildren(...records.map(marker));
  $('#feed').innerHTML = activity.filter((record) => active.has(record.layer) && matches(record.label)).map((record) => `<button class="feed-row" data-event="${record.id}"><i class="${record.color}">${record.layer === 'kills' ? '✕' : '◆'}</i><span><strong>${record.label}</strong><small>${record.detail} · ${record.age}</small></span></button>`).join('');
  $$('[data-event]').forEach((button) => button.addEventListener('click', () => selectPoint(activity.find((item) => item.id === Number(button.dataset.event)))));
}

function applyTransform() {
  $('#surface').style.transform = `translate3d(${state.x}px,${state.y}px,0) scale(${state.scale})`;
  $('#zoom-reset').textContent = `${Math.round(state.scale * 100)}%`;
}
function zoom(value) { state.scale = Math.max(1, Math.min(4, value)); if (state.scale === 1) state.x = state.y = 0; applyTransform(); }

function coordinate(clientX, clientY) {
  const rect = $('#map').getBoundingClientRect();
  const sx = ((clientX - rect.left - rect.width / 2 - state.x) / state.scale) + rect.width / 2;
  const sy = ((clientY - rect.top - rect.height / 2 - state.y) / state.scale) + rect.height / 2;
  return { x: Math.max(0, Math.min(mapSize, sx / rect.width * mapSize)), z: Math.max(0, Math.min(mapSize, (1 - sy / rect.height) * mapSize)) };
}

function selectPoint(point) {
  if (!point) return;
  state.selection = { x: Number(point.x), z: Number(point.z) };
  const pin = $('#pin');
  pin.classList.remove('hidden');
  pin.style.left = `${state.selection.x / mapSize * 100}%`;
  pin.style.top = `${(1 - state.selection.z / mapSize) * 100}%`;
  const text = `X ${state.selection.x.toFixed(1)} · Z ${state.selection.z.toFixed(1)} · Y 0.0`;
  $('#selection').textContent = text;
  $('#delivery-coordinate').textContent = text;
  $('#izurvive').classList.remove('disabled');
  $('#izurvive').href = `https://www.izurvive.com/livonia/#location=${state.selection.x.toFixed(1)};${state.selection.z.toFixed(1)};2`;
  renderCart();
}

function renderProducts() {
  const term = $('#shop-search').value.trim().toLowerCase();
  $('#products').innerHTML = products.filter((item) => !term || `${item.name} ${item.category}`.toLowerCase().includes(term)).map((item) => `<article class="product"><div class="product-art">${item.icon}</div><div class="product-body"><small>${item.category}</small><h3>${item.name}</h3><p>${item.description}</p></div><div class="product-foot"><strong>${item.price} moedas</strong><button data-product="${item.id}">Adicionar</button></div></article>`).join('');
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
$('#zoom-in').addEventListener('click', () => zoom(state.scale + .35));
$('#zoom-out').addEventListener('click', () => zoom(state.scale - .35));
$('#zoom-reset').addEventListener('click', () => { state.scale = 1; state.x = state.y = 0; applyTransform(); });
$('#checkout').addEventListener('click', () => { $('#checkout').textContent = '✓ Pedido simulado'; $('#checkout').disabled = true; });

{
  const map = $('#map'); let drag = null; let skip = false;
  map.addEventListener('wheel', (event) => { event.preventDefault(); zoom(state.scale + (event.deltaY < 0 ? .25 : -.25)); }, { passive: false });
  map.addEventListener('pointerdown', (event) => { if (event.target.closest('.marker')) return; drag = { id: event.pointerId, x: event.clientX, y: event.clientY, ox: state.x, oy: state.y, moved: false }; map.setPointerCapture(event.pointerId); });
  map.addEventListener('pointermove', (event) => { const point = coordinate(event.clientX, event.clientY); $('#coords').textContent = `X ${point.x.toFixed(1)} · Z ${point.z.toFixed(1)}`; if (!drag || drag.id !== event.pointerId || state.scale <= 1) return; const dx = event.clientX - drag.x; const dy = event.clientY - drag.y; drag.moved ||= Math.hypot(dx, dy) > 4; const rect = map.getBoundingClientRect(); state.x = Math.max(-rect.width * (state.scale - 1) / 2, Math.min(rect.width * (state.scale - 1) / 2, drag.ox + dx)); state.y = Math.max(-rect.height * (state.scale - 1) / 2, Math.min(rect.height * (state.scale - 1) / 2, drag.oy + dy)); applyTransform(); });
  map.addEventListener('pointerup', (event) => { if (!drag || drag.id !== event.pointerId) return; skip = drag.moved; drag = null; map.releasePointerCapture(event.pointerId); setTimeout(() => { skip = false; }, 0); });
  map.addEventListener('click', (event) => { if (!skip && !event.target.closest('.marker')) selectPoint(coordinate(event.clientX, event.clientY)); });
}

renderMap();
renderProducts();
renderCart();
showView(location.hash === '#loja' ? 'loja' : 'mapa');
