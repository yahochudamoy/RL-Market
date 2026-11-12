import { supabase } from './config.js';
import { state, subscribe, notify } from './state.js';
import { initMasterAuth } from './admin.js';
import { renderCatalog } from './ui-catalog.js';
import { renderFavorites } from './ui-favorites.js';
import { renderCart } from './ui-cart.js';
import { renderNesting } from './ui-nesting.js';

export function showToast(message) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

export async function loadCatalogData() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    state.products = data || [];

    const uniqueCats = new Set(['Все изделия']);
    state.products.forEach((p) => {
      if (p.category) uniqueCats.add(p.category);
    });
    state.categories = Array.from(uniqueCats);
    notify();
  } catch (err) {
    console.warn('Не удалось загрузить каталог:', err.message);
    notify();
  }
}

function updateNavBadges() {
  const favBadge = document.getElementById('badge-fav');
  const cartBadge = document.getElementById('badge-cart');

  const favCount = state.favorites.length;
  favBadge.textContent = favCount;
  favBadge.classList.toggle('hidden', favCount === 0);

  const cartCount = state.cart.reduce((sum, i) => sum + i.qty, 0);
  cartBadge.textContent = cartCount;
  cartBadge.classList.toggle('hidden', cartCount === 0);

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
  });
}

function renderActiveTab() {
  const container = document.getElementById('app-content');
  updateNavBadges();

  switch (state.activeTab) {
    case 'catalog':
      renderCatalog(container);
      break;
    case 'nesting':
      if (state.isMaster) {
        renderNesting(container);
      } else {
        state.activeTab = 'catalog';
        renderCatalog(container);
      }
      break;
    case 'favorites':
      renderFavorites(container);
      break;
    case 'cart':
      renderCart(container);
      break;
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

document.addEventListener('DOMContentLoaded', () => {
  initMasterAuth();

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.onclick = () => {
      state.activeTab = btn.dataset.tab;
      notify();
    };
  });

  subscribe(() => {
    renderActiveTab();
  });

  renderActiveTab();
  loadCatalogData();
});
