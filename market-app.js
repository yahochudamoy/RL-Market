// Клиентская витрина RL Market
let allProducts = [];
let currentFilterCategory = 'all';
let searchQuery = '';
let cart = JSON.parse(localStorage.getItem('rl_market_cart') || '[]');
let favorites = JSON.parse(localStorage.getItem('rl_market_favs') || '[]');
let currentModalProduct = null;
let masterWhatsappPhone = window.RL_CONFIG.DEFAULT_WHATSAPP;

const FALLBACK_SVG_ICONS = {
  'shopping-bag': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  'shopping-cart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
  'heart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  'search': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  'grid': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
  'shapes': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/></svg>',
  'cpu': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/></svg>',
  'store': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>',
  'log-out': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
  'edit-3': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  'layers': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  'x': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  'plus': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
  'check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><path d="M20 6 9 17l-5-5"/></svg>'
};

function renderFallbackIcons() {
  document.querySelectorAll('[data-lucide]').forEach(el => {
    if (el.querySelector('svg')) return;
    const name = el.getAttribute('data-lucide');
    const svg = FALLBACK_SVG_ICONS[name];
    if (svg) {
      el.innerHTML = svg;
      if (el.classList.contains('fill-rose-500')) {
        const s = el.querySelector('svg');
        if (s) s.setAttribute('fill', '#f43f5e');
      }
    }
  });
}

function refreshIcons() {
  try {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  } catch (e) {}
  renderFallbackIcons();
}

window.addEventListener('DOMContentLoaded', async () => {
  refreshIcons();
  updateBadges();
  masterWhatsappPhone = await window.RL_DB.getMasterWhatsapp();
  await fetchClientProducts();
});

async function fetchClientProducts() {
  const loader = document.getElementById('products-loading');
  loader.classList.remove('hidden');

  const { data } = await window.RL_DB.fetchProducts(true);
  allProducts = data;

  loader.classList.add('hidden');
  renderCategoryChips();
  applyFiltersAndRender();
}

function renderCategoryChips() {
  const chipsContainer = document.getElementById('category-chips');
  const cats = new Set(window.RL_CONFIG.DEFAULT_CATEGORIES);

  allProducts.forEach(p => {
    if (p.category && p.category.trim() && p.category.trim() !== 'Общее') {
      cats.add(p.category.trim());
    }
  });

  let html = `
    <button onclick="selectCategory('all')" class="cat-chip px-3 py-1.5 rounded-xl text-xs font-bold transition ${currentFilterCategory === 'all' ? 'bg-orange-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
      Все изделия
    </button>
  `;

  cats.forEach(c => {
    const isActive = currentFilterCategory === c;
    html += `
      <button onclick="selectCategory('${c.replace(/'/g, "\\'")}')" class="cat-chip px-3 py-1.5 rounded-xl text-xs font-bold transition ${isActive ? 'bg-orange-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
        ${c}
      </button>
    `;
  });

  chipsContainer.innerHTML = html;
}

function selectCategory(cat) {
  currentFilterCategory = cat;
  renderCategoryChips();
  applyFiltersAndRender();
}

function handleSearch() {
  searchQuery = document.getElementById('client-search').value.toLowerCase().trim();
  const clearBtn = document.getElementById('search-clear-btn');
  if (searchQuery) clearBtn.classList.remove('hidden');
  else clearBtn.classList.add('hidden');
  applyFiltersAndRender();
}

function clearSearch() {
  document.getElementById('client-search').value = '';
  searchQuery = '';
  document.getElementById('search-clear-btn').classList.add('hidden');
  applyFiltersAndRender();
}

function applyFiltersAndRender() {
  let list = [...allProducts];

  if (currentFilterCategory !== 'all') {
    list = list.filter(p => p.category && p.category.trim().toLowerCase() === currentFilterCategory.toLowerCase());
  }

  if (searchQuery) {
    list = list.filter(p =>
      (p.title && p.title.toLowerCase().includes(searchQuery)) ||
      (p.material && p.material.toLowerCase().includes(searchQuery)) ||
      (p.category && p.category.toLowerCase().includes(searchQuery)) ||
      (p.description && p.description.toLowerCase().includes(searchQuery))
    );
  }

  renderProductsGrid(list, 'products-grid');

  const emptyEl = document.getElementById('empty-state');
  if (list.length === 0) emptyEl.classList.remove('hidden');
  else emptyEl.classList.add('hidden');
}

function renderProductsGrid(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  items.forEach(p => {
    const titleText = p.title || 'Изделие ЧПУ';
    const photoSrc = p.image || 'https://placehold.co/300x300/f1f5f9/64748b?text=RL+Workshop';
    const materialText = window.RL_DB.getProductMaterial(p) || 'Материал под заказ';
    const rawUnit = p.unit || 'шт.';
    const displayUnit = rawUnit.startsWith('/') ? rawUnit : `/ ${rawUnit}`;
    const isFav = favorites.includes(p.id);

    const card = document.createElement('div');
    card.className = "bg-white border border-slate-200/90 rounded-2xl p-2.5 flex flex-col justify-between shadow-sm hover:shadow-md transition cursor-pointer select-none";
    card.onclick = () => openProductModal(p);

    card.innerHTML = `
      <div>
        <div class="relative w-full aspect-square bg-slate-100 rounded-xl overflow-hidden mb-2 border border-slate-100 flex items-center justify-center">
          <img src="${photoSrc}" class="w-full h-full contain-photo" alt="" onerror="this.src='https://placehold.co/300x300/f1f5f9/64748b?text=RL'">
          <button onclick="event.stopPropagation(); toggleFavorite(${p.id});" class="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center transition active:scale-90 ${isFav ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'}">
            <i data-lucide="heart" class="w-4 h-4 ${isFav ? 'fill-rose-500' : ''}"></i>
          </button>
        </div>
        <p class="text-[10px] text-orange-600 font-bold uppercase tracking-wider truncate">${p.category || 'Общее'}</p>
        <h3 class="font-extrabold text-xs text-slate-900 leading-snug line-clamp-2 mt-0.5">${titleText}</h3>
        <div class="flex items-center gap-1 text-[10px] text-slate-500 mt-1 truncate">
          <i data-lucide="layers" class="w-3 h-3 text-slate-400 shrink-0"></i>
          <span class="truncate">${materialText}</span>
        </div>
      </div>

      <div class="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-1">
        <div class="truncate">
          <span class="text-xs font-black text-slate-900 block leading-tight">${p.price || 0} ₽</span>
          <span class="text-[9px] text-slate-400 block">${displayUnit}</span>
        </div>
        <button onclick="event.stopPropagation(); addToCart(${p.id});" class="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition active:scale-95 shadow-sm">
          <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
          <span class="hidden sm:inline">В заказ</span>
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  refreshIcons();
}

function openProductModal(p) {
  currentModalProduct = p;
  const photoSrc = p.image || 'https://placehold.co/400x400/f1f5f9/64748b?text=RL';
  const rawUnit = p.unit || 'шт.';
  const displayUnit = rawUnit.startsWith('/') ? rawUnit : `/ ${rawUnit}`;

  document.getElementById('modal-cat-tag').textContent = p.category || 'Изделие мастерской';
  document.getElementById('modal-img').src = photoSrc;
  document.getElementById('modal-title').textContent = p.title || 'Без названия';
  document.getElementById('modal-price').textContent = `${p.price || 0} ₽`;
  document.getElementById('modal-unit').textContent = displayUnit;

  const mat = window.RL_DB.getProductMaterial(p) || 'Индивидуальный подбор (МДФ / Фанера / Массив)';
  document.getElementById('modal-material').textContent = mat;

  const cleanDesc = window.RL_DB.getCleanDescription(p.description);
  document.getElementById('modal-desc').textContent = cleanDesc || 'Фрезерная ЧПУ обработка, высокоточная геометрия деталей.';

  updateModalFavIcon();
  document.getElementById('product-modal').classList.remove('hidden');
  refreshIcons();
}

function closeProductModal() {
  document.getElementById('product-modal').classList.add('hidden');
  currentModalProduct = null;
}

function updateModalFavIcon() {
  if (!currentModalProduct) return;
  const icon = document.getElementById('modal-fav-icon');
  const isFav = favorites.includes(currentModalProduct.id);
  if (isFav) {
    icon.classList.add('fill-rose-500', 'text-rose-500');
    icon.classList.remove('text-slate-500');
  } else {
    icon.classList.remove('fill-rose-500', 'text-rose-500');
    icon.classList.add('text-slate-500');
  }
}

function toggleModalFav() {
  if (!currentModalProduct) return;
  toggleFavorite(currentModalProduct.id);
  updateModalFavIcon();
}

function addModalItemToCart() {
  if (!currentModalProduct) return;
  addToCart(currentModalProduct.id);
  closeProductModal();
}

function toggleFavorite(id) {
  const idx = favorites.indexOf(id);
  if (idx > -1) favorites.splice(idx, 1);
  else favorites.push(id);
  localStorage.setItem('rl_market_favs', JSON.stringify(favorites));
  updateBadges();
  applyFiltersAndRender();
  if (!document.getElementById('tab-favorites').classList.contains('hidden')) {
    renderFavoritesTab();
  }
}

function renderFavoritesTab() {
  const favItems = allProducts.filter(p => favorites.includes(p.id));
  const countEl = document.getElementById('fav-count-text');
  const emptyEl = document.getElementById('favorites-empty');

  countEl.textContent = `${favItems.length} товаров`;
  if (favItems.length === 0) emptyEl.classList.remove('hidden');
  else emptyEl.classList.add('hidden');

  renderProductsGrid(favItems, 'favorites-grid');
}

function addToCart(id) {
  const item = allProducts.find(p => p.id === id);
  if (!item) return;

  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: item.id,
      title: item.title || 'Изделие',
      price: Number(item.price) || 0,
      unit: item.unit || 'шт.',
      material: window.RL_DB.getProductMaterial(item) || 'Стандарт',
      image: item.image || '',
      qty: 1
    });
  }

  saveCart();
  updateBadges();

  const badge = document.getElementById('header-cart-badge');
  badge.classList.add('scale-125');
  setTimeout(() => badge.classList.remove('scale-125'), 200);
}

function changeCartQty(id, delta) {
  const entry = cart.find(c => c.id === id);
  if (!entry) return;
  entry.qty += delta;
  if (entry.qty <= 0) cart = cart.filter(c => c.id !== id);
  saveCart();
  renderCartTab();
  updateBadges();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCartTab();
  updateBadges();
}

function saveCart() {
  localStorage.setItem('rl_market_cart', JSON.stringify(cart));
}

function renderCartTab() {
  const container = document.getElementById('cart-items-container');
  const checkoutBlock = document.getElementById('cart-checkout-block');
  const emptyEl = document.getElementById('cart-empty');
  container.innerHTML = '';

  if (cart.length === 0) {
    checkoutBlock.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    return;
  }

  checkoutBlock.classList.remove('hidden');
  emptyEl.classList.add('hidden');

  let total = 0;

  cart.forEach(item => {
    const itemSum = item.price * item.qty;
    total += itemSum;

    const row = document.createElement('div');
    row.className = "bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm";
    row.innerHTML = `
      <div class="flex items-center gap-3 overflow-hidden">
        <div class="w-12 h-12 rounded-xl bg-slate-100 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
          <img src="${item.image || 'https://placehold.co/100x100/f1f5f9/64748b?text=RL'}" class="w-full h-full contain-photo" alt="">
        </div>
        <div class="overflow-hidden">
          <h4 class="font-extrabold text-xs text-slate-900 truncate max-w-[150px]">${item.title}</h4>
          <p class="text-[10px] text-slate-400 truncate">${item.material}</p>
          <span class="text-xs font-black text-orange-600 mt-0.5 block">${item.price} ₽ <span class="text-[9px] font-normal text-slate-400">/ ${item.unit}</span></span>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <div class="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
          <button onclick="changeCartQty(${item.id}, -1)" class="w-6 h-6 flex items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm active:scale-90 font-bold">-</button>
          <span class="w-7 text-center font-black text-xs text-slate-900">${item.qty}</span>
          <button onclick="changeCartQty(${item.id}, 1)" class="w-6 h-6 flex items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm active:scale-90 font-bold">+</button>
        </div>
      </div>
    `;
    container.appendChild(row);
  });

  document.getElementById('cart-total-price').textContent = `${total.toLocaleString('ru-RU')} ₽`;
  refreshIcons();
}

function updateBadges() {
  const totalCount = cart.reduce((acc, i) => acc + i.qty, 0);

  const headerBadge = document.getElementById('header-cart-badge');
  const navBadge = document.getElementById('nav-cart-badge');
  const favBadge = document.getElementById('fav-badge');

  if (totalCount > 0) {
    headerBadge.textContent = totalCount;
    headerBadge.classList.remove('hidden');
    navBadge.textContent = totalCount;
    navBadge.classList.remove('hidden');
  } else {
    headerBadge.classList.add('hidden');
    navBadge.classList.add('hidden');
  }

  if (favorites.length > 0) favBadge.classList.remove('hidden');
  else favBadge.classList.add('hidden');
}

function submitOrderViaWhatsApp() {
  if (cart.length === 0) return;

  const clientName = document.getElementById('client-name').value.trim() || 'Клиент';
  const clientComment = document.getElementById('client-comment').value.trim();

  let text = `Здравствуйте, мастер! Я выбрал изделия в RL Market:\n\n`;
  let total = 0;

  cart.forEach((item, idx) => {
    const sum = item.price * item.qty;
    total += sum;
    text += `${idx + 1}. *${item.title}*\n`;
    text += `   Материал: ${item.material}\n`;
    text += `   Количество: ${item.qty} ${item.unit}\n`;
    text += `   Сумма: ${sum.toLocaleString('ru-RU')} ₽\n\n`;
  });

  text += `*ИТОГО К РАСЧЕТУ:* ${total.toLocaleString('ru-RU')} ₽\n`;
  text += `Имя заказчика: ${clientName}\n`;
  if (clientComment) {
    text += `Пожелания: ${clientComment}\n`;
  }
  text += `\nПодскажите, пожалуйста, по срокам изготовления и доставке!`;

  const cleanPhone = (masterWhatsappPhone || '').replace(/\D/g, '');
  const baseWa = cleanPhone ? `https://wa.me/${cleanPhone}` : `https://wa.me/`;
  const waUrl = `${baseWa}?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
}

function switchClientTab(tab) {
  const tabCatalog = document.getElementById('tab-catalog');
  const tabFavs = document.getElementById('tab-favorites');
  const tabCart = document.getElementById('tab-cart');

  const btnCatalog = document.getElementById('nav-btn-catalog');
  const btnFavs = document.getElementById('nav-btn-favorites');
  const btnCart = document.getElementById('nav-btn-cart');

  tabCatalog.classList.add('hidden');
  tabFavs.classList.add('hidden');
  tabCart.classList.add('hidden');

  btnCatalog.className = "flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 transition";
  btnFavs.className = "relative flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 transition";
  btnCart.className = "relative flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 transition";

  if (tab === 'catalog') {
    tabCatalog.classList.remove('hidden');
    btnCatalog.className = "flex flex-col items-center gap-1 text-orange-600 font-bold transition";
  } else if (tab === 'favorites') {
    tabFavs.classList.remove('hidden');
    btnFavs.className = "relative flex flex-col items-center gap-1 text-orange-600 font-bold transition";
    renderFavoritesTab();
  } else if (tab === 'cart') {
    tabCart.classList.remove('hidden');
    btnCart.className = "relative flex flex-col items-center gap-1 text-orange-600 font-bold transition";
    renderCartTab();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  refreshIcons();
}
