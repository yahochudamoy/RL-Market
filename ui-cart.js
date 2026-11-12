import { state, updateCartQty, clearCart, resolveProductUnit } from './state.js';
import { CONFIG } from './config.js';
import { showToast } from './app.js';

export function renderCart(container) {
  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="card-box" style="text-align:center; padding:40px 16px; color:var(--text-muted);">
        Корзина пуста. Выберите изделия из каталога для расчёта заказа.
      </div>
    `;
    return;
  }

  const totalSum = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  container.innerHTML = `
    <div class="card-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <h3 style="font-size:16px;">Ваш заказ</h3>
        <button class="btn-danger" id="btn-clear-cart">Очистить</button>
      </div>

      <div>
        ${state.cart.map((item) => {
          const unit = resolveProductUnit(item);
          return `
            <div class="cart-item">
              <img class="cart-thumb" src="${item.image_url || ''}" alt="${item.title}" />
              <div style="flex:1; min-width:0;">
                <div style="font-weight:700; font-size:14px;">${item.title}</div>
                <div style="font-size:12px; color:var(--text-muted);">${item.material} • ${item.price} ₽/${unit}</div>
                <div style="font-size:12px; font-weight:700; color:var(--accent); margin-top:2px;">
                  Сумма: ${(item.price * item.qty).toLocaleString('ru-RU')} ₽
                </div>
              </div>
              <div class="qty-controls">
                <button class="qty-btn" data-dec="${item.id}">−</button>
                <span class="qty-value-badge">${item.qty} ${unit}</span>
                <button class="qty-btn" data-inc="${item.id}">+</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="border-top:1px solid var(--border); margin-top:12px; padding-top:12px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:600; color:var(--text-muted);">Итого:</span>
        <span style="font-size:20px; font-weight:800; color:var(--accent);">${totalSum.toLocaleString('ru-RU')} ₽</span>
      </div>
    </div>

    <div class="card-box">
      <label class="field-label">Комментарий или размеры для цеха (необязательно)</label>
      <input type="text" id="order-comment" class="input-field" placeholder="Например: срочный заказ, доставка..." style="margin-bottom:12px;" />
      <button class="btn-primary" id="btn-send-whatsapp" style="background:#16a34a;">
        Оформить заказ в WhatsApp
      </button>
    </div>
  `;

  document.getElementById('btn-clear-cart').onclick = () => clearCart();

  container.querySelectorAll('[data-dec]').forEach((btn) => {
    btn.onclick = () => updateCartQty(btn.dataset.dec, -1);
  });

  container.querySelectorAll('[data-inc]').forEach((btn) => {
    btn.onclick = () => updateCartQty(btn.dataset.inc, 1);
  });

  document.getElementById('btn-send-whatsapp').onclick = () => {
    const comment = document.getElementById('order-comment').value.trim();
    const lines = [
      'Здравствуйте! Заказ из RL Market:',
      ''
    ];

    state.cart.forEach((item, idx) => {
      const unit = resolveProductUnit(item);
      lines.push(`${idx + 1}. ${item.title} (${item.material}) — ${item.qty} ${unit} × ${item.price} ₽ = ${item.qty * item.price} ₽`);
    });

    lines.push('');
    lines.push(`Итого: ${totalSum.toLocaleString('ru-RU')} ₽`);
    if (comment) lines.push(`Комментарий: ${comment}`);

    const text = encodeURIComponent(lines.join('\n'));
    const url = `https://wa.me/${CONFIG.WHATSAPP_PHONE}?text=${text}`;
    window.open(url, '_blank');
    showToast('Переходим в WhatsApp...');
  };
}
