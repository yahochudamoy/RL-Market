import { state, addToCart, toggleFavorite, notify, resolveProductUnit } from './state.js';
import { openProductEditorModal, deleteProduct } from './admin.js';
import { showToast } from './app.js';

export function renderCatalog(container) {
  const filtered = state.products.filter((p) => {
    const matchCat = state.selectedCategory === 'Все изделия' || p.category === state.selectedCategory;
    const matchSearch = !state.searchQuery ||
      (p.title || '').toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      (p.material || '').toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  container.innerHTML = `
    <div class="search-bar">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input type="text" id="catalog-search" class="input-field" placeholder="Поиск изделия или материала..." value="${state.searchQuery}" />
    </div>

    <div class="categories-scroll" id="categories-bar">
      ${state.categories.map((cat) => `
        <button class="cat-chip ${state.selectedCategory === cat ? 'active' : ''}" data-cat="${cat}">
          ${cat}
        </button>
      `).join('')}
      ${state.isMaster ? `<button class="cat-chip add-cat" id="btn-add-product">+ Добавить товар</button>` : ''}
    </div>

    ${filtered.length === 0 ? `
      <div class="card-box" style="text-align:center; padding:30px 16px; color:var(--text-muted);">
        Изделия не найдены. Проверьте VPN для загрузки витрины из Supabase.
      </div>
    ` : `
      <div class="products-grid">
        ${filtered.map((p) => {
          const isFav = state.favorites.some((id) => String(id) === String(p.id));
          const unit = resolveProductUnit(p);
          return `
            <div class="product-card">
              <div class="product-img-wrap">
                <img class="product-img" src="${p.image_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23e2e8f0%22/%3E%3C/svg%3E'}" alt="${p.title}" loading="lazy" />
                <button class="fav-btn ${isFav ? 'active' : ''}" data-fav-id="${p.id}">♥</button>
                ${state.isMaster ? `
                  <div class="admin-card-actions">
                    <button class="admin-mini-btn" data-edit-id="${p.id}">✎</button>
                    <button class="admin-mini-btn" style="background:#dc2626;" data-del-id="${p.id}">✕</button>
                  </div>
                ` : ''}
              </div>
              <div class="product-body">
                <div class="product-title">${p.title}</div>
                <div class="product-meta">${p.material || 'МДФ / Фанера'}</div>
                <div class="product-footer">
                  <div>
                    <span class="product-price">${p.price} ₽</span>
                    <span class="product-unit">/ ${unit}</span>
                  </div>
                  <button class="add-cart-btn" data-cart-id="${p.id}">В корзину</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}
  `;

  const searchInput = document.getElementById('catalog-search');
  searchInput.oninput = (e) => {
    state.searchQuery = e.target.value;
    renderCatalog(container);
    const newInput = document.getElementById('catalog-search');
    newInput.focus();
    newInput.setSelectionRange(newInput.value.length, newInput.value.length);
  };

  container.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.onclick = () => {
      state.selectedCategory = btn.dataset.cat;
      notify();
    };
  });

  const addBtn = document.getElementById('btn-add-product');
  if (addBtn) {
    addBtn.onclick = () => openProductEditorModal(null);
  }

  container.querySelectorAll('[data-fav-id]').forEach((btn) => {
    btn.onclick = () => toggleFavorite(btn.dataset.favId);
  });

  container.querySelectorAll('[data-cart-id]').forEach((btn) => {
    btn.onclick = () => {
      const prod = state.products.find((x) => String(x.id) === String(btn.dataset.cartId));
      if (prod) {
        addToCart(prod);
        const unit = resolveProductUnit(prod);
        showToast(`Добавлено: ${prod.title} (1 ${unit})`);
      }
    };
  });

  container.querySelectorAll('[data-edit-id]').forEach((btn) => {
    btn.onclick = () => {
      const prod = state.products.find((x) => String(x.id) === String(btn.dataset.editId));
      if (prod) openProductEditorModal(prod);
    };
  });

  container.querySelectorAll('[data-del-id]').forEach((btn) => {
    btn.onclick = () => deleteProduct(btn.dataset.delId);
  });
}
