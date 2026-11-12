const STORAGE_KEYS = {
  CART: 'rl_cart_v3',
  FAV: 'rl_fav_v3',
  HISTORY: 'rl_nesting_history_v3'
};

// Определяем единицу измерения товара (шт. или м²)
export function resolveProductUnit(product) {
  if (product.unit === 'м²' || product.unit === 'шт.') {
    return product.unit;
  }
  const cat = (product.category || '').toLowerCase();
  const title = (product.title || '').toLowerCase();
  if (cat.includes('панел') || title.includes('панел')) {
    return 'м²';
  }
  return 'шт.';
}

export const state = {
  isMaster: false,
  user: null,
  activeTab: 'catalog',
  products: [],
  categories: ['Все изделия'],
  selectedCategory: 'Все изделия',
  searchQuery: '',
  cart: JSON.parse(localStorage.getItem(STORAGE_KEYS.CART) || '[]'),
  favorites: JSON.parse(localStorage.getItem(STORAGE_KEYS.FAV) || '[]'),
  nestingHistory: JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]')
};

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify() {
  listeners.forEach((fn) => fn(state));
}

export function saveCart() {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(state.cart));
  notify();
}

export function addToCart(product) {
  const existing = state.cart.find((item) => String(item.id) === String(product.id));
  const unit = resolveProductUnit(product);
  if (existing) {
    existing.qty += 1;
    existing.unit = unit;
  } else {
    state.cart.push({
      id: product.id,
      title: product.title,
      price: Number(product.price) || 0,
      material: product.material || '',
      image_url: product.image_url || '',
      unit,
      qty: 1
    });
  }
  saveCart();
}

export function updateCartQty(id, delta) {
  const idx = state.cart.findIndex((i) => String(i.id) === String(id));
  if (idx === -1) return;
  state.cart[idx].qty += delta;
  if (state.cart[idx].qty <= 0) {
    state.cart.splice(idx, 1);
  }
  saveCart();
}

export function clearCart() {
  state.cart = [];
  saveCart();
}

export function toggleFavorite(productId) {
  const strId = String(productId);
  const idx = state.favorites.findIndex((id) => String(id) === strId);
  if (idx === -1) {
    state.favorites.push(productId);
  } else {
    state.favorites.splice(idx, 1);
  }
  localStorage.setItem(STORAGE_KEYS.FAV, JSON.stringify(state.favorites));
  notify();
}

export function addNestingHistory(record) {
  state.nestingHistory.unshift(record);
  if (state.nestingHistory.length > 20) state.nestingHistory.pop();
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.nestingHistory));
  notify();
}

export function clearNestingHistory() {
  state.nestingHistory = [];
  localStorage.setItem(STORAGE_KEYS.HISTORY, '[]');
  notify();
}
