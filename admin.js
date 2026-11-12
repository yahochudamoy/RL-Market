import { supabase, CONFIG } from './config.js';
import { state, notify, resolveProductUnit } from './state.js';
import { compressImage } from './editor.js';
import { showToast, loadCatalogData } from './app.js';

export function initMasterAuth() {
  const logo = document.getElementById('rl-logo-trigger');
  const ringCircle = logo.querySelector('circle');
  const logoutBtn = document.getElementById('btn-logout-master');

  let pressTimer = null;
  let animFrame = null;
  let startTime = 0;
  const HOLD_DURATION = 5000;

  if (supabase) {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setMasterMode(true, data.session.user);
      }
    });
  }

  function updateRing() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / HOLD_DURATION, 1);
    ringCircle.style.strokeDashoffset = 126 * (1 - progress);
    if (progress < 1) {
      animFrame = requestAnimationFrame(updateRing);
    }
  }

  function startHold(e) {
    if (e.type === 'touchstart') e.preventDefault();
    startTime = Date.now();
    animFrame = requestAnimationFrame(updateRing);
    pressTimer = setTimeout(() => {
      cancelHold();
      if (state.isMaster) {
        showToast('Вы уже в режиме RL Master');
      } else {
        openLoginModal();
      }
    }, HOLD_DURATION);
  }

  function cancelHold() {
    clearTimeout(pressTimer);
    cancelAnimationFrame(animFrame);
    ringCircle.style.strokeDashoffset = 126;
  }

  logo.addEventListener('mousedown', startHold);
  logo.addEventListener('touchstart', startHold, { passive: false });
  logo.addEventListener('mouseup', cancelHold);
  logo.addEventListener('mouseleave', cancelHold);
  logo.addEventListener('touchend', cancelHold);

  logoutBtn.addEventListener('click', async () => {
    if (supabase) await supabase.auth.signOut();
    setMasterMode(false, null);
    showToast('Выход из режима RL Master');
  });
}

export function setMasterMode(enabled, user = null) {
  state.isMaster = enabled;
  state.user = user;

  const brandName = document.getElementById('app-brand-name');
  const modeBadge = document.getElementById('mode-badge');
  const nestingTab = document.getElementById('nav-tab-nesting');
  const logoutBtn = document.getElementById('btn-logout-master');

  if (enabled) {
    brandName.textContent = 'RL MASTER';
    modeBadge.textContent = 'РЕДАКТОР';
    modeBadge.className = 'mode-badge mode-edit';
    nestingTab.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
  } else {
    brandName.textContent = 'RL MARKET';
    modeBadge.textContent = 'ПРОСМОТР';
    modeBadge.className = 'mode-badge mode-view';
    nestingTab.classList.add('hidden');
    logoutBtn.classList.add('hidden');
    if (state.activeTab === 'nesting') {
      state.activeTab = 'catalog';
    }
  }
  notify();
}

export function openLoginModal() {
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = `
    <div class="modal-backdrop" id="login-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">Вход в RL Master</div>
          <button class="btn-secondary" id="close-login-btn" style="padding:4px 10px;">✕</button>
        </div>
        <form id="master-login-form" style="display:flex; flex-direction:column; gap:10px;">
          <div>
            <label class="field-label">Email мастера</label>
            <input type="email" id="login-email" class="input-field" value="${CONFIG.MASTER_EMAIL}" required />
          </div>
          <div>
            <label class="field-label">Пароль</label>
            <input type="password" id="login-password" class="input-field" placeholder="••••••••" required />
          </div>
          <button type="submit" class="btn-primary" id="login-submit-btn">Войти в цех</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('close-login-btn').onclick = () => (modalRoot.innerHTML = '');
  document.getElementById('master-login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const btn = document.getElementById('login-submit-btn');

    btn.disabled = true;
    btn.textContent = 'Проверка...';

    try {
      if (!supabase) throw new Error('Supabase не инициализирован');
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      setMasterMode(true, data.user);
      modalRoot.innerHTML = '';
      showToast('Добро пожаловать в RL Master!');
    } catch (err) {
      showToast('Ошибка входа: ' + (err.message || 'проверьте VPN и пароль'));
      btn.disabled = false;
      btn.textContent = 'Войти в цех';
    }
  };
}

export function openProductEditorModal(product = null) {
  const isEdit = Boolean(product);
  const modalRoot = document.getElementById('modal-root');
  let currentImage = product?.image_url || '';
  const currentUnit = product ? resolveProductUnit(product) : 'шт.';

  const catOptions = state.categories
    .filter((c) => c !== 'Все изделия')
    .map((c) => `<option value="${c}" ${product?.category === c ? 'selected' : ''}>${c}</option>`)
    .join('');

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title">${isEdit ? 'Редактировать изделие' : 'Новое изделие'}</div>
          <button class="btn-secondary" id="close-prod-modal" style="padding:4px 10px;">✕</button>
        </div>
        <form id="product-editor-form" style="display:flex; flex-direction:column; gap:10px;">
          <div>
            <label class="field-label">Название</label>
            <input type="text" id="prod-title" class="input-field" value="${product?.title || ''}" required />
          </div>
          <div class="grid-2">
            <div>
              <label class="field-label">Цена (₽)</label>
              <input type="number" id="prod-price" class="input-field" value="${product?.price || ''}" required />
            </div>
            <div>
              <label class="field-label">Единица измерения</label>
              <select id="prod-unit" class="input-field">
                <option value="шт." ${currentUnit === 'шт.' ? 'selected' : ''}>За 1 штуку (шт.)</option>
                <option value="м²" ${currentUnit === 'м²' ? 'selected' : ''}>За 1 кв. метр (м²)</option>
              </select>
            </div>
          </div>
          <div class="grid-2">
            <div>
              <label class="field-label">Материал / Толщина</label>
              <input type="text" id="prod-material" class="input-field" value="${product?.material || 'МДФ 6мм'}" />
            </div>
            <div>
              <label class="field-label">Категория</label>
              <input type="text" id="prod-category" list="cat-list" class="input-field" value="${product?.category || 'Потолочные Панели'}" required />
              <datalist id="cat-list">${catOptions}</datalist>
            </div>
          </div>
          <div>
            <label class="field-label">Фото изделия</label>
            <input type="file" id="prod-file" accept="image/*" class="input-field" />
            <img id="prod-preview" src="${currentImage}" style="margin-top:8px; max-height:120px; border-radius:8px; display:${currentImage ? 'block' : 'none'};" />
          </div>
          <button type="submit" class="btn-primary" id="save-prod-btn">Сохранить в базу</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('close-prod-modal').onclick = () => (modalRoot.innerHTML = '');

  // Автоподстановка м² при выборе категории с панелями для нового товара
  if (!isEdit) {
    document.getElementById('prod-category').oninput = (e) => {
      const val = e.target.value.toLowerCase();
      document.getElementById('prod-unit').value = val.includes('панел') ? 'м²' : 'шт.';
    };
  }

  document.getElementById('prod-file').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    currentImage = await compressImage(file);
    const prev = document.getElementById('prod-preview');
    prev.src = currentImage;
    prev.style.display = 'block';
  };

  document.getElementById('product-editor-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-prod-btn');
    btn.disabled = true;
    btn.textContent = 'Сохранение...';

    const payload = {
      title: document.getElementById('prod-title').value.trim(),
      price: Number(document.getElementById('prod-price').value) || 0,
      unit: document.getElementById('prod-unit').value,
      material: document.getElementById('prod-material').value.trim(),
      category: document.getElementById('prod-category').value.trim(),
      image_url: currentImage
    };

    try {
      let query;
      if (isEdit) {
        query = await supabase.from('products').update(payload).eq('id', product.id);
      } else {
        query = await supabase.from('products').insert([payload]);
      }

      // Если колонки unit ещё нет в таблице Supabase, повторяем сохранение без неё
      if (query.error && query.error.message?.includes('unit')) {
        const { unit, ...fallbackPayload } = payload;
        query = isEdit
          ? await supabase.from('products').update(fallbackPayload).eq('id', product.id)
          : await supabase.from('products').insert([fallbackPayload]);
      }

      if (query.error) throw query.error;

      showToast(isEdit ? 'Карточка обновлена' : 'Изделие добавлено в каталог');
      modalRoot.innerHTML = '';
      await loadCatalogData();
    } catch (err) {
      showToast('Ошибка Supabase: ' + err.message);
      btn.disabled = false;
      btn.textContent = 'Сохранить в базу';
    }
  };
}

export async function deleteProduct(id) {
  if (!confirm('Удалить это изделие из каталога?')) return;
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    showToast('Изделие удалено');
    await loadCatalogData();
  } catch (err) {
    showToast('Ошибка удаления: ' + err.message);
  }
}
