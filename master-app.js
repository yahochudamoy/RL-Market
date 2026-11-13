// Рабочее пространство мастера RL Master (Управление цехом, каталогом и DXF раскроем)
let savedCategories = JSON.parse(localStorage.getItem('rl_master_categories') || 'null');
if (!Array.isArray(savedCategories) || savedCategories.length === 0) {
  savedCategories = [...window.RL_CONFIG.DEFAULT_CATEGORIES];
  localStorage.setItem('rl_master_categories', JSON.stringify(savedCategories));
}

let favorites = JSON.parse(localStorage.getItem('rl_master_favorites') || '[]');
let products = [];
let whatsappPhone = localStorage.getItem('rl_master_whatsapp') || window.RL_CONFIG.DEFAULT_WHATSAPP;
let activeCategory = 'all';
let currentDetailProductId = null;

let isGlobalEditMode = false;
let isEditorDirty = false;
let currentPhotoBase64 = '';

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

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');

  let styleClass = 'bg-slate-900 text-white border-slate-700';
  let iconName = 'info';

  if (type === 'joke') {
    styleClass = 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-orange-300 shadow-orange-500/40';
    iconName = 'hammer';
  } else if (type === 'success') {
    styleClass = 'bg-emerald-600 text-white border-emerald-400';
    iconName = 'check-circle';
  } else if (type === 'warning') {
    styleClass = 'bg-orange-500 text-white border-orange-300';
    iconName = 'alert-triangle';
  }

  toast.className = `${styleClass} border px-4 py-3 rounded-2xl shadow-2xl text-xs font-extrabold flex items-center gap-2.5 max-w-sm pointer-events-auto transform transition-all duration-300 translate-y-[-10px] opacity-0`;
  toast.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4 shrink-0"></i><span>${message}</span>`;

  container.appendChild(toast);
  refreshIcons();

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-[-10px]', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-[-10px]');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function openConfirmDialog(title, desc) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-dialog-modal');
    document.getElementById('confirm-dialog-title').textContent = title;
    document.getElementById('confirm-dialog-desc').textContent = desc;

    const btnYes = document.getElementById('confirm-btn-yes');
    const btnNo = document.getElementById('confirm-btn-no');

    const cleanup = (result) => {
      modal.classList.add('hidden');
      btnYes.onclick = null;
      btnNo.onclick = null;
      resolve(result);
    };

    btnYes.onclick = () => cleanup(true);
    btnNo.onclick = () => cleanup(false);

    modal.classList.remove('hidden');
    refreshIcons();
  });
}

function bindFiveTaps(element, onSingleTap, onFiveTapsComplete) {
  let tapCount = 0;
  let resetTimer = null;
  let singleTapTimer = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let isMoved = false;
  let lastTouchTime = 0;

  const REQUIRED_TAPS = 5;
  const TAP_WINDOW_MS = 450;
  const SINGLE_TAP_DELAY_MS = 260;

  const overlay = document.getElementById('hold-progress-overlay');
  const bar = document.getElementById('hold-progress-bar');
  const progressText = document.getElementById('tap-progress-text');

  const formatRemaining = (left) => {
    if (left === 1) return 'Нажмите ещё 1 раз для редактирования...';
    return `Нажмите ещё ${left} раза для редактирования...`;
  };

  const resetTaps = () => {
    tapCount = 0;
    if (resetTimer) { clearTimeout(resetTimer); resetTimer = null; }
    element.classList.remove('hold-target-active');
    if (overlay) overlay.classList.add('hidden');
    if (bar) bar.style.width = '0%';
  };

  const handleTap = (e) => {
    if (e.target && e.target.closest('button, input, a, label')) return;

    if (singleTapTimer) {
      clearTimeout(singleTapTimer);
      singleTapTimer = null;
    }
    if (resetTimer) {
      clearTimeout(resetTimer);
      resetTimer = null;
    }

    tapCount += 1;

    if (tapCount >= REQUIRED_TAPS) {
      resetTaps();
      if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
      onFiveTapsComplete(e);
      return;
    }

    if (tapCount === 1 && onSingleTap) {
      singleTapTimer = setTimeout(() => {
        singleTapTimer = null;
        if (tapCount === 1) {
          resetTaps();
          onSingleTap(e);
        }
      }, SINGLE_TAP_DELAY_MS);
    }

    if (tapCount >= 2) {
      element.classList.add('hold-target-active');
      if (overlay) overlay.classList.remove('hidden');
      if (bar) bar.style.width = `${(tapCount / REQUIRED_TAPS) * 100}%`;
      if (progressText) progressText.textContent = formatRemaining(REQUIRED_TAPS - tapCount);
    }

    resetTimer = setTimeout(() => {
      resetTaps();
    }, TAP_WINDOW_MS);
  };

  element.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isMoved = false;
    }
  }, { passive: true });

  element.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      const dx = Math.abs(e.touches[0].clientX - touchStartX);
      const dy = Math.abs(e.touches[0].clientY - touchStartY);
      if (dx > 12 || dy > 12) isMoved = true;
    }
  }, { passive: true });

  element.addEventListener('touchend', (e) => {
    lastTouchTime = Date.now();
    if (isMoved) return;
    handleTap(e);
  });

  element.addEventListener('click', (e) => {
    if (Date.now() - lastTouchTime < 500) return;
    handleTap(e);
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  refreshIcons();
  whatsappPhone = await window.RL_DB.getMasterWhatsapp();
  document.getElementById('display-whatsapp-number').textContent = whatsappPhone;
  updateFavoritesBadge();
  applyCncDefaultsToInputs();
  renderCncHistory();
  setupFiveTapsBindings();
  await checkMasterSession();
});

function setupFiveTapsBindings() {
  const headerEl = document.getElementById('master-header');
  bindFiveTaps(headerEl, null, () => {
    if (!isGlobalEditMode) enableGlobalEditMode();
  });

  const cncBaseEl = document.getElementById('cnc-base-card');
  bindFiveTaps(
    cncBaseEl,
    () => { if (isGlobalEditMode) openCncDefaultsModal(); },
    () => { openCncDefaultsModal(); }
  );

  const waBoxEl = document.getElementById('whatsapp-card-box');
  bindFiveTaps(
    waBoxEl,
    () => { if (isGlobalEditMode) openWhatsappSettingsModal(); },
    () => { openWhatsappSettingsModal(); }
  );
}

async function checkMasterSession() {
  const client = window.RL_DB.client;
  if (!client) {
    showAuthScreen();
    return;
  }
  try {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (data && data.session) {
      showWorkspace();
      await fetchProducts();
    } else {
      showAuthScreen();
    }
  } catch (err) {
    showAuthScreen();
  }
}

function enableGlobalEditMode() {
  isGlobalEditMode = true;
  document.body.classList.add('global-edit-mode');

  const header = document.getElementById('master-header');
  header.classList.remove('bg-white/95');
  header.classList.add('bg-orange-50');

  const badge = document.getElementById('mode-badge');
  badge.textContent = 'ПРАВКА ЦЕХА';
  badge.className = 'text-[9px] bg-orange-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse';

  document.getElementById('global-edit-toolbar').classList.remove('hidden');
  updateEditModePencils(true);

  showToast('Глобальный режим редактирования включён', 'warning');
  renderCategoryPills();
  renderProductsGrid(getFilteredProducts());
  renderFavoritesGrid();
  refreshIcons();
}

async function requestFinishGlobalEdit() {
  const wantSave = await openConfirmDialog(
    'Завершить редактирование?',
    'Сохранить все изменения и вернуться в режим просмотра?'
  );
  if (wantSave) {
    localStorage.setItem('rl_master_categories', JSON.stringify(savedCategories));
    await fetchProducts();
    showToast('Все изменения сохранены', 'success');
  } else {
    await fetchProducts();
    showToast('Выход из режима правки', 'info');
  }
  disableGlobalEditMode();
}

function disableGlobalEditMode() {
  isGlobalEditMode = false;
  document.body.classList.remove('global-edit-mode');

  const header = document.getElementById('master-header');
  header.classList.add('bg-white/95');
  header.classList.remove('bg-orange-50');

  const badge = document.getElementById('mode-badge');
  badge.textContent = 'ПРОСМОТР';
  badge.className = 'text-[9px] bg-slate-100 text-slate-600 border border-slate-200 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider';

  document.getElementById('global-edit-toolbar').classList.add('hidden');
  updateEditModePencils(false);

  renderCategoryPills();
  renderProductsGrid(getFilteredProducts());
  renderFavoritesGrid();
  refreshIcons();
}

function updateEditModePencils(active) {
  const waPencil = document.getElementById('whatsapp-edit-pencil');
  const waBox = document.getElementById('whatsapp-card-box');
  const cncPencil = document.getElementById('cnc-base-edit-pencil');
  const cncCard = document.getElementById('cnc-base-card');

  if (active) {
    waPencil.classList.remove('hidden');
    waBox.classList.add('ring-2', 'ring-orange-400', 'border-orange-400');
    cncPencil.classList.remove('hidden');
    cncCard.classList.add('ring-2', 'ring-orange-400', 'border-orange-400');
  } else {
    waPencil.classList.add('hidden');
    waBox.classList.remove('ring-2', 'ring-orange-400', 'border-orange-400');
    cncPencil.classList.add('hidden');
    cncCard.classList.remove('ring-2', 'ring-orange-400', 'border-orange-400');
  }
}

function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('app-workspace').classList.add('hidden');
  document.getElementById('app-workspace').classList.remove('flex');
  refreshIcons();
}

function showWorkspace() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-workspace').classList.remove('hidden');
  document.getElementById('app-workspace').classList.add('flex');
  refreshIcons();
}

async function handleMasterLogin(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errorMsg = document.getElementById('auth-error-msg');
  const submitBtn = document.getElementById('auth-submit-btn');

  errorMsg.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Проверка доступа...';

  try {
    const { error } = await window.RL_DB.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    showWorkspace();
    await fetchProducts();
  } catch (err) {
    errorMsg.textContent = err.message || 'Ошибка авторизации';
    errorMsg.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i><span>Авторизоваться</span>`;
    refreshIcons();
  }
}

async function handleMasterLogout() {
  if (window.RL_DB.client) await window.RL_DB.client.auth.signOut();
  showAuthScreen();
}

function persistCategoriesList(list) {
  const cleaned = [];
  const seen = new Set();
  list.forEach(item => {
    const name = (item || '').trim();
    if (name && name !== 'Общее' && !seen.has(name)) {
      seen.add(name);
      cleaned.push(name);
    }
  });
  savedCategories = cleaned;
  localStorage.setItem('rl_master_categories', JSON.stringify(savedCategories));
  updateCategoriesDatalist();
}

function updateCategoriesDatalist() {
  const dl = document.getElementById('categories-datalist');
  if (!dl) return;
  dl.innerHTML = savedCategories.map(c => `<option value="${c}">`).join('');
}

async function fetchProducts() {
  const { data, error } = await window.RL_DB.fetchProducts(false);
  if (error) {
    showToast('Ошибка загрузки: ' + error.message, 'warning');
  }
  products = data;

  let updated = false;
  products.forEach(p => {
    const cat = (p.category || '').trim();
    if (cat && cat !== 'Общее' && !savedCategories.includes(cat)) {
      savedCategories.push(cat);
      updated = true;
    }
  });
  if (updated) persistCategoriesList(savedCategories);
  else updateCategoriesDatalist();

  renderCategoryPills();
  renderProductsGrid(getFilteredProducts());
  renderFavoritesGrid();
}

function renderCategoryPills() {
  const container = document.getElementById('category-pills');
  container.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = `px-3.5 py-2 rounded-full text-xs font-extrabold transition ${activeCategory === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`;
  allBtn.textContent = 'Все изделия';
  allBtn.onclick = () => {
    activeCategory = 'all';
    renderCategoryPills();
    renderProductsGrid(getFilteredProducts());
  };
  container.appendChild(allBtn);

  savedCategories.forEach(cat => {
    const pillWrap = document.createElement('div');
    const isActive = activeCategory === cat;
    pillWrap.className = `px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-2 cursor-pointer ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'} ${isGlobalEditMode ? 'ring-2 ring-orange-400 pr-1.5' : ''}`;

    const labelSpan = document.createElement('span');
    labelSpan.textContent = cat;
    pillWrap.appendChild(labelSpan);

    if (isGlobalEditMode) {
      const pencilBtn = document.createElement('button');
      pencilBtn.type = 'button';
      pencilBtn.className = 'w-6 h-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-md flex items-center justify-center shrink-0 transition';
      pencilBtn.title = `Редактировать категорию «${cat}»`;
      pencilBtn.innerHTML = '<i data-lucide="edit-3" class="w-3 h-3"></i>';
      pencilBtn.onclick = (e) => {
        e.stopPropagation();
        openCategoryEditorModal(cat);
      };
      pillWrap.appendChild(pencilBtn);
    }

    bindFiveTaps(
      pillWrap,
      () => {
        if (isGlobalEditMode) openCategoryEditorModal(cat);
        else {
          activeCategory = cat;
          renderCategoryPills();
          renderProductsGrid(getFilteredProducts());
        }
      },
      () => openCategoryEditorModal(cat)
    );

    container.appendChild(pillWrap);
  });

  refreshIcons();
}

function getFilteredProducts() {
  const q = document.getElementById('catalog-search').value.toLowerCase().trim();
  let list = [...products];

  if (activeCategory !== 'all') {
    list = list.filter(p => p.category && p.category.trim().toLowerCase() === activeCategory.toLowerCase());
  }

  if (q) {
    list = list.filter(p => {
      const t = (p.title || '').toLowerCase();
      const c = (p.category || '').toLowerCase();
      const m = window.RL_DB.getProductMaterial(p).toLowerCase();
      const d = (p.description || '').toLowerCase();
      return t.includes(q) || c.includes(q) || m.includes(q) || d.includes(q);
    });
  }
  return list;
}

function filterCatalog() {
  renderProductsGrid(getFilteredProducts());
}

function renderProductsGrid(items) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';

  if (!items || items.length === 0) {
    grid.innerHTML = `<div class="col-span-2 text-center py-12 bg-white border border-slate-200 rounded-3xl text-xs text-slate-400 font-semibold">Изделия не найдены</div>`;
    return;
  }

  items.forEach(p => {
    grid.appendChild(createProductCardElement(p));
  });

  refreshIcons();
}

function createProductCardElement(p) {
  const titleText = p.title || 'Без названия';
  const photoSrc = p.image || 'https://placehold.co/300x300/f1f5f9/94a3b8?text=RL';
  const materialText = window.RL_DB.getProductMaterial(p) || 'Материал уточняется';
  const rawUnit = p.unit || 'шт.';
  const displayUnit = rawUnit.startsWith('/') ? rawUnit : `/ ${rawUnit}`;
  const isFav = favorites.includes(p.id);

  const card = document.createElement('div');
  card.className = `bg-white border ${isGlobalEditMode ? 'border-orange-400 ring-2 ring-orange-400/30' : 'border-slate-200/80'} rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between cursor-pointer transition select-none`;

  const bodyArea = document.createElement('div');
  bodyArea.className = 'flex-1';
  bodyArea.innerHTML = `
    <div class="relative w-full h-36 bg-slate-100 overflow-hidden flex items-center justify-center">
      <img src="${photoSrc}" class="w-full h-full contain-photo" alt="" onerror="this.src='https://placehold.co/300x300/f1f5f9/94a3b8?text=RL'">
      ${isGlobalEditMode ? `<div class="absolute top-2 right-2 w-8 h-8 bg-orange-500 text-white rounded-full shadow-md flex items-center justify-center"><i data-lucide="edit-3" class="w-4 h-4"></i></div>` : ''}
    </div>
    <div class="p-3 pb-2 space-y-1">
      <h3 class="font-extrabold text-xs text-slate-900 line-clamp-2 leading-snug min-h-[2rem]">${titleText}</h3>
      <div class="flex items-center gap-1 text-[10px] text-slate-500 truncate">
        <i data-lucide="layers" class="w-3 h-3 text-slate-400 shrink-0"></i>
        <span class="truncate">${materialText}</span>
      </div>
      <div class="flex items-baseline gap-1 pt-0.5">
        <span class="text-sm font-black text-orange-600">${p.price || 0} ₽</span>
        <span class="text-[10px] text-slate-400 font-medium">${displayUnit}</span>
      </div>
    </div>
  `;

  const footerActions = document.createElement('div');
  footerActions.className = 'px-3 pb-3 pt-1 flex items-center gap-1.5';

  const favBtn = document.createElement('button');
  favBtn.type = 'button';
  favBtn.className = `w-9 h-9 rounded-xl border ${isFav ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50 hover:bg-rose-50'} flex items-center justify-center shrink-0 transition active:scale-90`;
  favBtn.title = isFav ? 'Убрать из избранного' : 'В избранное';
  favBtn.innerHTML = `<i data-lucide="heart" class="w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}"></i>`;

  const stopAll = (e) => e.stopPropagation();
  favBtn.addEventListener('touchstart', stopAll, { passive: true });
  favBtn.addEventListener('touchend', (e) => { e.stopPropagation(); e.preventDefault(); toggleFavorite(p.id); });
  favBtn.addEventListener('mousedown', stopAll);
  favBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(p.id); });

  const cartBtn = document.createElement('button');
  cartBtn.type = 'button';
  cartBtn.className = 'flex-1 h-9 bg-orange-100/90 hover:bg-orange-200/80 active:scale-95 text-orange-900 font-extrabold rounded-xl text-[11px] flex items-center justify-center gap-1 transition';
  cartBtn.innerHTML = `<i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i><span>В корзину</span>`;

  cartBtn.addEventListener('touchstart', stopAll, { passive: true });
  cartBtn.addEventListener('touchend', (e) => { e.stopPropagation(); e.preventDefault(); triggerMasterJoke(); });
  cartBtn.addEventListener('mousedown', stopAll);
  cartBtn.addEventListener('click', (e) => { e.stopPropagation(); triggerMasterJoke(); });

  footerActions.appendChild(favBtn);
  footerActions.appendChild(cartBtn);

  card.appendChild(bodyArea);
  card.appendChild(footerActions);

  bindFiveTaps(
    card,
    () => {
      if (isGlobalEditMode) openSingleProductEditor(p);
      else openProductDetailModal(p);
    },
    () => openSingleProductEditor(p)
  );

  return card;
}

function triggerMasterJoke() {
  if (navigator.vibrate) navigator.vibrate(50);
  showToast('Ты же мастер😂 Сделай сам!', 'joke');
}

function openProductDetailModal(p) {
  currentDetailProductId = p.id;
  const photoSrc = p.image || 'https://placehold.co/400x400/f1f5f9/94a3b8?text=RL';
  const rawUnit = p.unit || 'шт.';
  const displayUnit = rawUnit.startsWith('/') ? rawUnit : `/ ${rawUnit}`;

  document.getElementById('detail-category').textContent = p.category || 'Изделие ЧПУ';
  document.getElementById('detail-img').src = photoSrc;
  document.getElementById('detail-title').textContent = p.title || 'Без названия';
  document.getElementById('detail-price').textContent = `${p.price || 0} ₽`;
  document.getElementById('detail-unit').textContent = displayUnit;
  document.getElementById('detail-material').textContent = window.RL_DB.getProductMaterial(p) || 'Уточняется у мастера';
  document.getElementById('detail-desc').textContent = window.RL_DB.getCleanDescription(p.description) || 'Подробное описание отсутствует.';

  syncDetailFavoriteButtonState();
  document.getElementById('product-detail-modal').classList.remove('hidden');
  refreshIcons();
}

function syncDetailFavoriteButtonState() {
  const btn = document.getElementById('detail-fav-btn');
  if (!btn || currentDetailProductId === null) return;
  const isFav = favorites.includes(currentDetailProductId);
  btn.className = `w-12 h-12 rounded-2xl border ${isFav ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50 hover:bg-rose-50'} flex items-center justify-center shrink-0 transition active:scale-90`;
  btn.innerHTML = `<i data-lucide="heart" class="w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}"></i>`;
  refreshIcons();
}

function toggleDetailFavorite() {
  if (currentDetailProductId === null) return;
  toggleFavorite(currentDetailProductId);
  syncDetailFavoriteButtonState();
}

function closeProductDetailModal() {
  document.getElementById('product-detail-modal').classList.add('hidden');
  currentDetailProductId = null;
}

function openAddProductModal() {
  isEditorDirty = false;
  document.getElementById('modal-editor-title').textContent = 'Новое изделие в каталог';
  document.getElementById('edit-prod-id').value = '';
  document.getElementById('product-editor-form').reset();
  currentPhotoBase64 = '';
  document.getElementById('editor-img-preview').classList.add('hidden');
  document.getElementById('editor-no-img-placeholder').classList.remove('hidden');
  document.getElementById('btn-rotate-photo').classList.add('hidden');
  document.getElementById('btn-delete-product').classList.add('hidden');
  document.getElementById('product-editor-modal').classList.remove('hidden');
  refreshIcons();
}

function openSingleProductEditor(p) {
  isEditorDirty = false;
  document.getElementById('modal-editor-title').textContent = 'Редактирование изделия';
  document.getElementById('edit-prod-id').value = p.id;
  document.getElementById('edit-prod-title').value = p.title || '';
  document.getElementById('edit-prod-category').value = p.category || '';
  document.getElementById('edit-prod-material').value = window.RL_DB.getProductMaterial(p);
  document.getElementById('edit-prod-price').value = p.price || '';
  const cleanUnit = (p.unit || 'шт.').replace(/^\/\s*/, '');
  document.getElementById('edit-prod-unit').value = cleanUnit;
  document.getElementById('edit-prod-desc').value = window.RL_DB.getCleanDescription(p.description);
  document.getElementById('btn-delete-product').classList.remove('hidden');

  const photo = p.image || '';
  if (photo) {
    currentPhotoBase64 = photo;
    updateEditorPhotoPreview(photo);
  } else {
    currentPhotoBase64 = '';
    document.getElementById('editor-img-preview').classList.add('hidden');
    document.getElementById('editor-no-img-placeholder').classList.remove('hidden');
    document.getElementById('btn-rotate-photo').classList.add('hidden');
  }

  document.getElementById('product-editor-modal').classList.remove('hidden');
  refreshIcons();
}

function markEditorDirty() { isEditorDirty = true; }

async function handleEditorFormSubmit(e) {
  e.preventDefault();
  await promptAndFinalizeProductEdit();
}

async function requestCloseProductEditor() {
  if (!isEditorDirty) {
    document.getElementById('product-editor-modal').classList.add('hidden');
    return;
  }
  await promptAndFinalizeProductEdit();
}

async function promptAndFinalizeProductEdit() {
  const confirmed = await openConfirmDialog(
    'Сохранить изменения?',
    'Записать внесённые правки в базу данных Supabase?'
  );
  if (confirmed) await executeSaveProductToSupabase();
  else showToast('Правки отменены', 'info');

  document.getElementById('product-editor-modal').classList.add('hidden');
  isEditorDirty = false;
}

async function executeSaveProductToSupabase() {
  const client = window.RL_DB.client;
  const id = document.getElementById('edit-prod-id').value;
  const titleVal = document.getElementById('edit-prod-title').value.trim();
  const categoryVal = document.getElementById('edit-prod-category').value.trim() || 'Общее';
  const materialVal = document.getElementById('edit-prod-material').value.trim();
  const pureDescVal = document.getElementById('edit-prod-desc').value.trim();
  const priceVal = Number(document.getElementById('edit-prod-price').value) || 0;
  const unitVal = document.getElementById('edit-prod-unit').value;
  const imageVal = currentPhotoBase64;

  if (categoryVal !== 'Общее' && !savedCategories.includes(categoryVal)) {
    persistCategoriesList([...savedCategories, categoryVal]);
  }

  const packedDesc = materialVal ? `[Материал: ${materialVal}]\n${pureDescVal}`.trim() : pureDescVal;

  const fullPayload = {
    title: titleVal,
    category: categoryVal,
    material: materialVal,
    description: packedDesc,
    price: priceVal,
    unit: unitVal,
    image: imageVal
  };

  try {
    if (id) {
      const { error } = await client.from('products').update(fullPayload).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await client.from('products').insert([fullPayload]);
      if (error) throw error;
    }
    showToast('Изделие успешно сохранено', 'success');
    await fetchProducts();
  } catch (err) {
    try {
      const safePayload = {
        title: titleVal,
        category: categoryVal,
        description: packedDesc,
        price: priceVal,
        image: imageVal
      };
      if (id) {
        const { error: e2 } = await client.from('products').update(safePayload).eq('id', id);
        if (e2) throw e2;
      } else {
        const { error: e2 } = await client.from('products').insert([safePayload]);
        if (e2) throw e2;
      }
      showToast('Изделие успешно сохранено', 'success');
      await fetchProducts();
    } catch (err2) {
      showToast('Ошибка записи: ' + err2.message, 'warning');
    }
  }
}

async function deleteCurrentEditingProduct() {
  const id = document.getElementById('edit-prod-id').value;
  if (!id) return;

  const ok = await openConfirmDialog('Удалить изделие?', 'Позиция будет безвозвратно удалена с витрины.');
  if (!ok) return;

  try {
    const { error } = await window.RL_DB.client.from('products').delete().eq('id', id);
    if (error) throw error;
    showToast('Изделие удалено', 'info');
    document.getElementById('product-editor-modal').classList.add('hidden');
    await fetchProducts();
  } catch (err) {
    showToast('Ошибка удаления: ' + err.message, 'warning');
  }
}

function openAddCategoryModal() {
  document.getElementById('cat-modal-heading').textContent = 'Новая категория';
  document.getElementById('cat-modal-subtext').textContent = 'Новая категория сразу появится в ленте фильтров.';
  document.getElementById('old-category-name').value = '';
  document.getElementById('new-category-name').value = '';
  document.getElementById('btn-delete-category').classList.add('hidden');
  document.getElementById('category-editor-modal').classList.remove('hidden');
  refreshIcons();
}

function openCategoryEditorModal(catName) {
  document.getElementById('cat-modal-heading').textContent = 'Редактирование категории';
  document.getElementById('cat-modal-subtext').textContent = 'Изменение сохранится в постоянном списке категорий и обновит все привязанные изделия.';
  document.getElementById('old-category-name').value = catName;
  document.getElementById('new-category-name').value = catName;
  document.getElementById('btn-delete-category').classList.remove('hidden');
  document.getElementById('category-editor-modal').classList.remove('hidden');
  refreshIcons();
}

function closeCategoryEditorModal() {
  document.getElementById('category-editor-modal').classList.add('hidden');
}

async function confirmCategorySave() {
  const oldName = document.getElementById('old-category-name').value.trim();
  const newName = document.getElementById('new-category-name').value.trim();
  closeCategoryEditorModal();
  if (!newName) return;

  if (!oldName) {
    const ok = await openConfirmDialog('Сохранить категорию?', `Добавить категорию «${newName}» в ленту витрины?`);
    if (!ok) return;
    persistCategoriesList([...savedCategories, newName]);
    renderCategoryPills();
    showToast(`Категория «${newName}» добавлена`, 'success');
    return;
  }

  if (newName === oldName) return;

  const ok = await openConfirmDialog('Сохранить изменения?', `Переименовать категорию «${oldName}» в «${newName}» для всех товаров?`);
  if (!ok) return;

  const updatedList = savedCategories.map(c => (c === oldName ? newName : c));
  if (!updatedList.includes(newName)) updatedList.push(newName);
  persistCategoriesList(updatedList);
  if (activeCategory === oldName) activeCategory = newName;

  try {
    const { error } = await window.RL_DB.client.from('products').update({ category: newName }).ilike('category', oldName);
    if (error) throw error;
    showToast(`Категория «${newName}» сохранена`, 'success');
    await fetchProducts();
  } catch (err) {
    renderCategoryPills();
    renderProductsGrid(getFilteredProducts());
    showToast(`Категория «${newName}» обновлена`, 'success');
  }
}

async function confirmCategoryDelete() {
  const oldName = document.getElementById('old-category-name').value.trim();
  closeCategoryEditorModal();
  if (!oldName) return;

  const ok = await openConfirmDialog('Удалить категорию?', `Удалить «${oldName}» из списка и перевести её товары в «Общее»?`);
  if (!ok) return;

  persistCategoriesList(savedCategories.filter(c => c !== oldName));
  if (activeCategory === oldName) activeCategory = 'all';

  try {
    const { error } = await window.RL_DB.client.from('products').update({ category: 'Общее' }).ilike('category', oldName);
    if (error) throw error;
    showToast('Категория удалена', 'info');
    await fetchProducts();
  } catch (err) {
    renderCategoryPills();
    renderProductsGrid(getFilteredProducts());
    showToast('Категория удалена', 'info');
  }
}

function handleWhatsappBoxTap() {
  if (isGlobalEditMode) openWhatsappSettingsModal();
}

function openWhatsappSettingsModal() {
  document.getElementById('input-whatsapp-phone').value = whatsappPhone;
  document.getElementById('whatsapp-modal').classList.remove('hidden');
  refreshIcons();
}

function closeWhatsappModal() {
  document.getElementById('whatsapp-modal').classList.add('hidden');
}

async function saveWhatsappNumber() {
  const val = document.getElementById('input-whatsapp-phone').value.trim();
  closeWhatsappModal();
  if (!val) return;

  const ok = await openConfirmDialog('Сохранить номер?', `Установить ${val} для приёма заявок WhatsApp?`);
  if (!ok) return;

  whatsappPhone = val;
  await window.RL_DB.saveMasterWhatsapp(val);
  document.getElementById('display-whatsapp-number').textContent = val;
  showToast('Номер WhatsApp обновлён', 'success');
}

function sendTestWhatsapp() {
  const cleanPhone = whatsappPhone.replace(/\D/g, '');
  if (!cleanPhone) {
    showToast('Укажите корректный номер WhatsApp', 'warning');
    return;
  }
  const msg = encodeURIComponent('Здравствуйте! Проверка связи с витриной RL Market.');
  window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
}

function handleFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;
  markEditorDirty();

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const MAX_PX = 850;
      let w = img.width, h = img.height;
      if (w > h && w > MAX_PX) { h = Math.round((h * MAX_PX) / w); w = MAX_PX; }
      else if (h > MAX_PX) { w = Math.round((w * MAX_PX) / h); h = MAX_PX; }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      currentPhotoBase64 = canvas.toDataURL('image/jpeg', 0.82);
      updateEditorPhotoPreview(currentPhotoBase64);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function rotateCurrentPhoto() {
  if (!currentPhotoBase64) return;
  markEditorDirty();
  const img = new Image();
  img.onload = function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.height;
    canvas.height = img.width;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    currentPhotoBase64 = canvas.toDataURL('image/jpeg', 0.82);
    updateEditorPhotoPreview(currentPhotoBase64);
  };
  img.src = currentPhotoBase64;
}

function updateEditorPhotoPreview(src) {
  const preview = document.getElementById('editor-img-preview');
  preview.src = src;
  preview.classList.remove('hidden');
  document.getElementById('editor-no-img-placeholder').classList.add('hidden');
  document.getElementById('btn-rotate-photo').classList.remove('hidden');
}

function toggleFavorite(id) {
  const wasFav = favorites.includes(id);
  if (wasFav) {
    favorites = favorites.filter(x => x !== id);
    showToast('Убрано из избранного', 'info');
  } else {
    favorites.push(id);
    showToast('Добавлено в избранное', 'success');
  }
  localStorage.setItem('rl_master_favorites', JSON.stringify(favorites));
  updateFavoritesBadge();
  renderProductsGrid(getFilteredProducts());
  renderFavoritesGrid();
}

function updateFavoritesBadge() {
  const badge = document.getElementById('nav-fav-badge');
  if (!badge) return;
  if (favorites.length > 0) {
    badge.textContent = favorites.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function renderFavoritesGrid() {
  const grid = document.getElementById('favorites-grid');
  const favItems = products.filter(p => favorites.includes(p.id));
  document.getElementById('fav-count-label').textContent = `${favItems.length} шт.`;
  grid.innerHTML = '';

  if (favItems.length === 0) {
    grid.innerHTML = `<div class="col-span-2 text-center py-12 bg-white border border-slate-200 rounded-3xl text-xs text-slate-400">В избранном пока пусто</div>`;
    return;
  }

  favItems.forEach(p => grid.appendChild(createProductCardElement(p)));
  refreshIcons();
}

function switchBottomNav(tab) {
  const views = {
    catalog: document.getElementById('view-catalog'),
    calculator: document.getElementById('view-calculator'),
    favorites: document.getElementById('view-favorites'),
    cart: document.getElementById('view-cart')
  };
  const btns = {
    catalog: document.getElementById('nav-catalog'),
    calculator: document.getElementById('nav-calculator'),
    favorites: document.getElementById('nav-favorites'),
    cart: document.getElementById('nav-cart')
  };

  Object.keys(views).forEach(key => {
    if (key === tab) {
      views[key].classList.remove('hidden');
      btns[key].classList.remove('text-slate-400', 'font-medium');
      btns[key].classList.add('text-orange-600', 'font-bold');
    } else {
      views[key].classList.add('hidden');
      btns[key].classList.remove('text-orange-600', 'font-bold');
      btns[key].classList.add('text-slate-400', 'font-medium');
    }
  });

  if (tab === 'calculator') window.RL_CNC.previewCncCanvas();
  else if (tab === 'favorites') renderFavoritesGrid();
  refreshIcons();
}

// UI-обвязка калькулятора DXF
function handleMainDxfUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const parsed = window.RL_CNC.parseDxfText(e.target.result);
    if (!parsed) {
      showToast('Не удалось распознать замкнутые контуры в .DXF', 'warning');
      return;
    }
    window.RL_CNC.setMainDxf({ fileName: file.name, ...parsed });
    document.getElementById('calc-part-w').value = parsed.outerLoop.width;
    document.getElementById('calc-part-h').value = parsed.outerLoop.height;
    updateMainDxfUi();
    window.RL_CNC.previewCncCanvas();
    showToast(`Чертёж ${file.name} загружен (окон: ${parsed.windows.length})`, 'success');
  };
  reader.readAsText(file);
}

function loadSampleFrameDxf() {
  const outerPts = [
    { x: 0, y: 0 }, { x: 600, y: 0 }, { x: 600, y: 420 },
    { x: 520, y: 470 }, { x: 80, y: 470 }, { x: 0, y: 420 }
  ];
  const windows = [
    { id: 'win_1', label: 'Окно #1 (Центральное)', pts: [{ x: 175, y: 70 }, { x: 425, y: 70 }, { x: 425, y: 390 }, { x: 175, y: 390 }], relX: 175, relY: 70, width: 250, height: 320, enabled: true },
    { id: 'win_2', label: 'Окно #2 (Левое)', pts: [{ x: 35, y: 90 }, { x: 145, y: 90 }, { x: 145, y: 360 }, { x: 35, y: 360 }], relX: 35, relY: 90, width: 110, height: 270, enabled: true },
    { id: 'win_3', label: 'Окно #3 (Правое)', pts: [{ x: 455, y: 90 }, { x: 565, y: 90 }, { x: 565, y: 360 }, { x: 455, y: 360 }], relX: 455, relY: 90, width: 110, height: 270, enabled: false }
  ];
  window.RL_CNC.setMainDxf({ fileName: 'Тест_Рама_ArtCAM.dxf', outerLoop: { pts: outerPts, width: 600, height: 470 }, windows });
  document.getElementById('calc-part-w').value = 600;
  document.getElementById('calc-part-h').value = 470;
  document.getElementById('donor-mode-toggle').checked = true;
  window.RL_CNC.setDonorEnabled(true);
  document.getElementById('donor-config-panel').classList.remove('hidden');
  updateMainDxfUi();
  window.RL_CNC.previewCncCanvas();
  showToast('Загружен тестовый DXF рамы с 3 окнами-донорами', 'success');
}

function clearMainDxf() {
  window.RL_CNC.setMainDxf(null);
  document.getElementById('main-dxf-input').value = '';
  updateMainDxfUi();
  window.RL_CNC.previewCncCanvas();
  showToast('Чертёж сброшен к прямоугольнику', 'info');
}

function onManualMainPartDimChange() {
  if (window.RL_CNC.getMainDxf()) {
    window.RL_CNC.setMainDxf(null);
    document.getElementById('main-dxf-input').value = '';
    updateMainDxfUi();
  }
  window.RL_CNC.previewCncCanvas();
}

function updateMainDxfUi() {
  const statusEl = document.getElementById('main-dxf-status');
  const clearBtn = document.getElementById('btn-clear-main-dxf');
  const mainDxfData = window.RL_CNC.getMainDxf();

  if (!mainDxfData) {
    statusEl.innerHTML = `<span>Режим ручного ввода размеров (прямоугольник)</span>`;
    clearBtn.classList.add('hidden');
  } else {
    statusEl.innerHTML = `
      <span class="font-bold text-orange-300 truncate max-w-[190px]">${mainDxfData.fileName}</span>
      <span class="text-emerald-300 font-mono shrink-0">${mainDxfData.outerLoop.width}×${mainDxfData.outerLoop.height} мм</span>
    `;
    clearBtn.classList.remove('hidden');
  }
  renderDonorWindowsChecklist();
  refreshIcons();
}

function toggleDonorMode() {
  const enabled = document.getElementById('donor-mode-toggle').checked;
  window.RL_CNC.setDonorEnabled(enabled);
  const panel = document.getElementById('donor-config-panel');
  if (enabled) panel.classList.remove('hidden');
  else panel.classList.add('hidden');
  renderDonorWindowsChecklist();
  window.RL_CNC.previewCncCanvas();
}

function renderDonorWindowsChecklist() {
  const container = document.getElementById('donor-windows-checklist');
  const countBadge = document.getElementById('donor-windows-count');
  const mainDxfData = window.RL_CNC.getMainDxf();

  if (!mainDxfData || !mainDxfData.windows || mainDxfData.windows.length === 0) {
    countBadge.textContent = '0 найдено';
    container.innerHTML = `
      <div class="text-[11px] text-slate-500 bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
        В текущем чертеже нет внутренних вырезов. Загрузите .DXF с окнами (или нажмите «Тест DXF (Рама)»).
      </div>
    `;
    return;
  }

  countBadge.textContent = `${mainDxfData.windows.length} найдено`;
  container.innerHTML = mainDxfData.windows.map((win, idx) => `
    <label class="flex items-center justify-between p-2 bg-white border ${win.enabled ? 'border-orange-400 bg-orange-50/40' : 'border-slate-200'} rounded-xl cursor-pointer transition">
      <div class="flex items-center gap-2">
        <input type="checkbox" ${win.enabled ? 'checked' : ''} onchange="toggleDonorWindowSelection(${idx})"
          class="w-4 h-4 accent-orange-500 rounded cursor-pointer">
        <span class="text-xs font-extrabold text-slate-800">${win.label}</span>
      </div>
      <span class="text-[11px] font-mono font-bold text-slate-500">${win.width}×${win.height} мм</span>
    </label>
  `).join('');
}

function toggleDonorWindowSelection(index) {
  const mainDxfData = window.RL_CNC.getMainDxf();
  if (!mainDxfData || !mainDxfData.windows[index]) return;
  mainDxfData.windows[index].enabled = !mainDxfData.windows[index].enabled;
  renderDonorWindowsChecklist();
  window.RL_CNC.previewCncCanvas();
}

function handleInsertDxfUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const parsed = window.RL_CNC.parseDxfText(e.target.result);
    if (!parsed) {
      showToast('Не удалось распознать контур мелкой детали', 'warning');
      return;
    }
    window.RL_CNC.setInsertDxf({ fileName: file.name, pts: parsed.outerLoop.pts, width: parsed.outerLoop.width, height: parsed.outerLoop.height });
    document.getElementById('calc-insert-w').value = parsed.outerLoop.width;
    document.getElementById('calc-insert-h').value = parsed.outerLoop.height;
    document.getElementById('insert-dxf-badge').classList.remove('hidden');
    document.getElementById('insert-dxf-name').textContent = `${file.name} (${parsed.outerLoop.width}×${parsed.outerLoop.height})`;
    window.RL_CNC.previewCncCanvas();
    showToast(`Контур вставки ${file.name} загружен`, 'success');
  };
  reader.readAsText(file);
}

function clearInsertDxf() {
  window.RL_CNC.setInsertDxf(null);
  document.getElementById('insert-dxf-input').value = '';
  document.getElementById('insert-dxf-badge').classList.add('hidden');
  window.RL_CNC.previewCncCanvas();
}

function applyQuickSheetPreset(w, h) {
  document.getElementById('calc-sheet-w').value = w;
  document.getElementById('calc-sheet-h').value = h;
  window.RL_CNC.previewCncCanvas();
}

function applyCncDefaultsToInputs() {
  const d = window.RL_CNC.getDefaults();
  document.getElementById('calc-sheet-w').value = d.sheetW;
  document.getElementById('calc-sheet-h').value = d.sheetH;
  document.getElementById('calc-kerf').value = d.kerf;
  document.getElementById('calc-margin').value = d.margin;
  document.getElementById('cnc-base-summary').textContent =
    `Лист ${d.sheetW}×${d.sheetH} мм • Фреза ${d.kerf} мм • Отступ ${d.margin} мм`;
}

function handleCncBaseCardTap() {
  if (isGlobalEditMode) openCncDefaultsModal();
}

function openCncDefaultsModal() {
  const d = window.RL_CNC.getDefaults();
  document.getElementById('def-sheet-w').value = d.sheetW;
  document.getElementById('def-sheet-h').value = d.sheetH;
  document.getElementById('def-kerf').value = d.kerf;
  document.getElementById('def-margin').value = d.margin;
  document.getElementById('cnc-defaults-modal').classList.remove('hidden');
  refreshIcons();
}

function closeCncDefaultsModal() {
  document.getElementById('cnc-defaults-modal').classList.add('hidden');
}

function fillDefaultsPreset(w, h) {
  document.getElementById('def-sheet-w').value = w;
  document.getElementById('def-sheet-h').value = h;
}

async function saveCncDefaults() {
  const w = Math.max(10, Number(document.getElementById('def-sheet-w').value) || 1525);
  const h = Math.max(10, Number(document.getElementById('def-sheet-h').value) || 1525);
  const k = Math.max(0, Number(document.getElementById('def-kerf').value) || 6);
  const m = Math.max(0, Number(document.getElementById('def-margin').value) || 15);

  closeCncDefaultsModal();
  const ok = await openConfirmDialog(
    'Сохранить базу цеха?',
    `Установить лист ${w}×${h} мм (фреза ${k} мм, отступ ${m} мм) как базовые настройки?`
  );
  if (!ok) return;

  window.RL_CNC.setDefaults({ sheetW: w, sheetH: h, kerf: k, margin: m });
  applyCncDefaultsToInputs();
  window.RL_CNC.previewCncCanvas();
  showToast('Базовые параметры цеха обновлены', 'success');
}

function executeCncCalculation() {
  const res = window.RL_CNC.previewCncCanvas();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

  const mainDxfData = window.RL_CNC.getMainDxf();
  const partLabel = mainDxfData
    ? `${mainDxfData.fileName} (${res.pw}×${res.ph})`
    : `Деталь ${res.pw}×${res.ph} мм`;

  const entry = {
    id: Date.now(),
    time: `${dateStr} ${timeStr}`,
    sheet: `${res.sw}×${res.sh}`,
    part: partLabel,
    mainCount: res.totalMain,
    donorCount: res.totalDonorParts,
    eff: res.eff
  };

  const hist = window.RL_CNC.getHistory();
  hist.unshift(entry);
  if (hist.length > 30) hist.pop();
  window.RL_CNC.setHistory(hist);
  renderCncHistory();

  applyCncDefaultsToInputs();
  const donorMsg = res.totalDonorParts > 0 ? ` + ${res.totalDonorParts} шт. из окон` : '';
  showToast(`Готово: ${res.totalMain} шт.${donorMsg} (${res.eff}%). База листа восстановлена.`, 'success');
}

function renderCncHistory() {
  const container = document.getElementById('cnc-history-list');
  if (!container) return;
  const hist = window.RL_CNC.getHistory();

  if (!hist || hist.length === 0) {
    container.innerHTML = `<div class="text-center py-6 text-xs text-slate-400">История расчётов пуста</div>`;
    return;
  }

  container.innerHTML = hist.map(item => `
    <div class="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs gap-2">
      <div class="space-y-0.5 overflow-hidden">
        <div class="font-extrabold text-slate-900 truncate">${item.part}</div>
        <div class="text-[10px] text-slate-500">Лист: ${item.sheet} мм • ${item.time}</div>
      </div>
      <div class="text-right shrink-0">
        <div class="font-black text-orange-600">${item.mainCount || item.total || 0} шт. ${item.donorCount > 0 ? `<span class="text-emerald-600">+${item.donorCount}</span>` : ''}</div>
        <div class="text-[10px] font-bold text-sky-600">${item.eff}% КПД</div>
      </div>
    </div>
  `).join('');
}

function clearCncHistory() {
  window.RL_CNC.setHistory([]);
  renderCncHistory();
  showToast('История расчётов очищена', 'info');
}
