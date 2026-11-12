import { state, addToCart, toggleFavorite, resolveProductUnit } from './state.js';
import { showToast } from './app.js';

export function renderFavorites(container) {
  const favProducts = state.products.filter((p) =>
    state.favorites.some((id) => String(id) === String(p.id))
  );

  if (favProducts.length === 0) {
    container.innerHTML = `
      <div class="card-box" style="text-align:center; padding:40px 16px; color:var(--text-muted);">
        В избранном пока пусто. Нажмите на сердечко на карточке изделия, чтобы сохранить его.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="products-grid">
      ${favProducts.map((p) => {
        const unit = resolveProductUnit(p);
        return `
          <div class="product-card">
            <div class="product-img-wrap">
              <img class="product-img" src="${p.image_url || ''}" alt="${p.title}" />
              <button class="fav-btn active" data-fav-id="${p.id}">♥</button>
            </div>
            <div class="product-body">
              <div class="product-title">${p.title}</div>
              <div class="product-meta">${p.material || ''}</div>
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
  `;

  container.querySelectorAll('[data-fav-id]').forEach((btn) => {
    btn.onclick = () => toggleFavorite(btn.dataset.favId);
  });

  container.querySelectorAll('[data-cart-id]').forEach((btn) => {
    btn.onclick = () => {
      const prod = state.products.find((x) => String(x.id) === String(btn.dataset.cartId));
      if (prod) {
        addToCart(prod);
        showToast('Добавлено в корзину');
      }
    };
  });
}
