import { state, addNestingHistory, clearNestingHistory } from './state.js';
import { showToast } from './app.js';

let dxfData = null;
let sheetParams = {
  sheetW: 1525,
  sheetH: 1525,
  kerf: 6,
  margin: 15,
  partW: 450,
  partH: 350,
  useDonors: true,
  donorW: 120,
  donorH: 100
};

export function renderNesting(container) {
  container.innerHTML = `
    <div class="card-box">
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
        <div style="background:var(--accent-light); color:var(--accent); padding:8px; border-radius:10px; font-weight:800;">DXF</div>
        <div>
          <div style="font-weight:800; font-size:15px;">ЧПУ Раскрой и DXF Нестинг</div>
          <div style="font-size:12px; color:var(--text-muted);">Фоновый разбор ArtCAM .DXF, автоповорот и окна-доноры</div>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:10px;">
        <label class="btn-primary" id="btn-upload-dxf" style="cursor:pointer;">
          <span>Загрузить .DXF</span>
          <input type="file" id="dxf-file-input" accept=".dxf" class="hidden" />
        </label>
        <button class="btn-secondary" id="btn-test-frame">Тест DXF (Рама)</button>
      </div>

      <div id="dxf-status-bar" style="background:#f8fafc; border:1px solid var(--border); border-radius:10px; padding:8px 12px; font-size:12px; font-weight:600; text-align:center; color:var(--text-muted);">
        ${dxfData ? `Загружен чертёж: ${dxfData.name} (${dxfData.width} × ${dxfData.height} мм)` : 'Режим ручного ввода размеров (прямоугольник)'}
      </div>
    </div>

    <div class="card-box">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700; font-size:14px;">Вырезать мелкие детали из окон</div>
          <div style="font-size:11px; color:var(--text-muted);">Использовать внутренние вырезы детали как доноры</div>
        </div>
        <input type="checkbox" id="chk-donors" ${sheetParams.useDonors ? 'checked' : ''} style="width:20px; height:20px; accent-color:var(--accent);" />
      </div>

      <div id="donor-size-inputs" class="grid-2 ${sheetParams.useDonors ? '' : 'hidden'}" style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border);">
        <div>
          <label class="field-label">Вставка Длина (мм)</label>
          <input type="number" id="inp-donor-w" class="input-field" value="${sheetParams.donorW}" />
        </div>
        <div>
          <label class="field-label">Вставка Ширина (мм)</label>
          <input type="number" id="inp-donor-h" class="input-field" value="${sheetParams.donorH}" />
        </div>
      </div>
    </div>

    <div class="card-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span style="font-weight:800; font-size:13px;">ЛИСТ МАТЕРИАЛА И ФРЕЗА</span>
        <div class="preset-row">
          <button class="preset-btn ${sheetParams.sheetW === 1525 ? 'active' : ''}" data-preset="1525x1525">1525²</button>
          <button class="preset-btn ${sheetParams.sheetW === 2800 ? 'active' : ''}" data-preset="2800x2070">2800×2070</button>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:10px;">
        <div>
          <label class="field-label">Ширина листа (мм)</label>
          <input type="number" id="inp-sheet-w" class="input-field" value="${sheetParams.sheetW}" />
        </div>
        <div>
          <label class="field-label">Высота листа (мм)</label>
          <input type="number" id="inp-sheet-h" class="input-field" value="${sheetParams.sheetH}" />
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:12px;">
        <div>
          <label class="field-label">Фреза / зазор (мм)</label>
          <input type="number" id="inp-kerf" class="input-field" value="${sheetParams.kerf}" />
        </div>
        <div>
          <label class="field-label">Отступ краёв (мм)</label>
          <input type="number" id="inp-margin" class="input-field" value="${sheetParams.margin}" />
        </div>
      </div>

      <div style="font-weight:800; font-size:13px; margin-bottom:8px;">ГАБАРИТЫ ОСНОВНОЙ ДЕТАЛИ (ММ)</div>
      <div class="grid-2" style="margin-bottom:12px;">
        <div>
          <label class="field-label">Длина (W)</label>
          <input type="number" id="inp-part-w" class="input-field" value="${sheetParams.partW}" />
        </div>
        <div>
          <label class="field-label">Ширина (H)</label>
          <input type="number" id="inp-part-h" class="input-field" value="${sheetParams.partH}" />
        </div>
      </div>

      <button class="btn-primary" id="btn-calc-nesting">Рассчитать и сохранить в историю</button>

      <div class="stats-row">
        <div class="stat-box orange">
          <div class="stat-title">Основных:</div>
          <div class="stat-val" id="res-main-count" style="color:var(--accent);">0 шт.</div>
        </div>
        <div class="stat-box green">
          <div class="stat-title">Из окон:</div>
          <div class="stat-val" id="res-donor-count" style="color:var(--success);">0 шт.</div>
        </div>
        <div class="stat-box blue">
          <div class="stat-title">КПД листа:</div>
          <div class="stat-val" id="res-efficiency" style="color:#2563eb;">0%</div>
        </div>
      </div>

      <div style="font-size:12px; font-weight:700; display:flex; justify-content:space-between;">
        <span>Карта раскроя на столе:</span>
        <span id="res-grid-label" style="color:var(--text-muted);">0 × 0</span>
      </div>

      <div class="canvas-wrap">
        <canvas id="nesting-canvas" width="600" height="600"></canvas>
      </div>

      <div class="legend-row">
        <span><i class="dot" style="background:#ea580c;"></i>Деталь</span>
        <span><i class="dot" style="background:#3b82f6;"></i>Окно-донор</span>
        <span><i class="dot" style="background:#22c55e;"></i>Вставка</span>
      </div>
    </div>

    <div class="card-box">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span style="font-weight:800; font-size:13px;">ИСТОРИЯ РАСЧЁТОВ</span>
        <button class="btn-secondary" id="btn-clear-history" style="padding:4px 8px; font-size:11px;">Очистить</button>
      </div>
      <div id="history-list" style="font-size:12px; color:var(--text-muted);">
        ${state.nestingHistory.length === 0 ? 'История расчётов пуста' : state.nestingHistory.map((h) => `
          <div style="padding:6px 0; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
            <span>${h.label} (${h.partW}×${h.partH})</span>
            <strong style="color:var(--text-main);">${h.total} шт. • КПД ${h.eff}%</strong>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  bindNestingEvents(container);
  runCalculation(false);
}

function bindNestingEvents(container) {
  const fileInput = document.getElementById('dxf-file-input');
  const uploadBtn = document.getElementById('btn-upload-dxf');

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadBtn.innerHTML = `<div class="spinner"></div><span>Обработка DXF...</span>`;
    const worker = new Worker('./js/dxf-worker.js');

    const reader = new FileReader();
    reader.onload = (ev) => {
      worker.postMessage(ev.target.result, [ev.target.result]);
    };
    reader.readAsArrayBuffer(file);

    worker.onmessage = (msg) => {
      worker.terminate();
      if (msg.data.error) {
        showToast(msg.data.error);
        renderNesting(container);
        return;
      }

      dxfData = {
        name: file.name,
        width: msg.data.width,
        height: msg.data.height,
        windows: msg.data.windows || [],
        preview: msg.data.preview || []
      };

      sheetParams.partW = Math.ceil(dxfData.width);
      sheetParams.partH = Math.ceil(dxfData.height);
      showToast(`DXF загружен: ${sheetParams.partW}×${sheetParams.partH} мм`);
      renderNesting(container);
    };
  };

  document.getElementById('btn-test-frame').onclick = () => {
    dxfData = {
      name: 'Тест_Рама_600x800.dxf',
      width: 600,
      height: 800,
      windows: [{ w: 420, h: 620, x: 90, y: 90 }],
      preview: [
        [0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 0, 0],
        [0.15, 0.11, 0.85, 0.11], [0.85, 0.11, 0.85, 0.89],
        [0.85, 0.89, 0.15, 0.89], [0.15, 0.89, 0.15, 0.11]
      ]
    };
    sheetParams.partW = 600;
    sheetParams.partH = 800;
    sheetParams.useDonors = true;
    renderNesting(container);
  };

  document.getElementById('chk-donors').onchange = (e) => {
    sheetParams.useDonors = e.target.checked;
    document.getElementById('donor-size-inputs').classList.toggle('hidden', !sheetParams.useDonors);
    runCalculation(false);
  };

  container.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.onclick = () => {
      const [w, h] = btn.dataset.preset.split('x').map(Number);
      sheetParams.sheetW = w;
      sheetParams.sheetH = h;
      renderNesting(container);
    };
  });

  ['inp-sheet-w', 'inp-sheet-h', 'inp-kerf', 'inp-margin', 'inp-part-w', 'inp-part-h', 'inp-donor-w', 'inp-donor-h'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.onchange = () => {
        syncInputs();
        runCalculation(false);
      };
    }
  });

  document.getElementById('btn-calc-nesting').onclick = () => {
    syncInputs();
    runCalculation(true);
  };

  document.getElementById('btn-clear-history').onclick = () => {
    clearNestingHistory();
    renderNesting(container);
  };
}

function syncInputs() {
  sheetParams.sheetW = Number(document.getElementById('inp-sheet-w').value) || 1525;
  sheetParams.sheetH = Number(document.getElementById('inp-sheet-h').value) || 1525;
  sheetParams.kerf = Number(document.getElementById('inp-kerf').value) || 0;
  sheetParams.margin = Number(document.getElementById('inp-margin').value) || 0;
  sheetParams.partW = Number(document.getElementById('inp-part-w').value) || 100;
  sheetParams.partH = Number(document.getElementById('inp-part-h').value) || 100;
  sheetParams.donorW = Number(document.getElementById('inp-donor-w')?.value) || 100;
  sheetParams.donorH = Number(document.getElementById('inp-donor-h')?.value) || 100;
}

function runCalculation(saveToHistory) {
  const { sheetW, sheetH, kerf, margin, partW, partH, useDonors, donorW, donorH } = sheetParams;
  const usableW = Math.max(0, sheetW - margin * 2);
  const usableH = Math.max(0, sheetH - margin * 2);

  const cols0 = Math.floor((usableW + kerf) / (partW + kerf));
  const rows0 = Math.floor((usableH + kerf) / (partH + kerf));
  const count0 = Math.max(0, cols0 * rows0);

  const cols90 = Math.floor((usableW + kerf) / (partH + kerf));
  const rows90 = Math.floor((usableH + kerf) / (partW + kerf));
  const count90 = Math.max(0, cols90 * rows90);

  const rotated = count90 > count0;
  const cols = rotated ? cols90 : cols0;
  const rows = rotated ? rows90 : rows0;
  const mainCount = rotated ? count90 : count0;
  const drawW = rotated ? partH : partW;
  const drawH = rotated ? partW : partH;

  let insertsPerPart = 0;
  let winList = dxfData?.windows || [];
  if (useDonors && winList.length > 0) {
    winList.forEach((win) => {
      const wUsable = Math.max(0, win.w - kerf * 2);
      const hUsable = Math.max(0, win.h - kerf * 2);
      const cA = Math.floor((wUsable + kerf) / (donorW + kerf)) * Math.floor((hUsable + kerf) / (donorH + kerf));
      const cB = Math.floor((wUsable + kerf) / (donorH + kerf)) * Math.floor((hUsable + kerf) / (donorW + kerf));
      insertsPerPart += Math.max(0, cA, cB);
    });
  }

  const totalDonors = mainCount * insertsPerPart;
  const usedArea = (mainCount * partW * partH) + (totalDonors * donorW * donorH);
  const sheetArea = sheetW * sheetH;
  const eff = sheetArea > 0 ? Math.min(100, ((usedArea / sheetArea) * 100)).toFixed(1) : 0;

  document.getElementById('res-main-count').textContent = `${mainCount} шт.`;
  document.getElementById('res-donor-count').textContent = `${totalDonors} шт.`;
  document.getElementById('res-efficiency').textContent = `${eff}%`;
  document.getElementById('res-grid-label').textContent = `${cols} × ${rows} ${rotated ? '(Поворот 90°)' : ''}`;

  drawCanvas(cols, rows, drawW, drawH, rotated, winList, insertsPerPart);

  if (saveToHistory) {
    addNestingHistory({
      label: dxfData ? dxfData.name : 'Прямоугольник',
      partW,
      partH,
      total: mainCount + totalDonors,
      eff
    });
    showToast('Расчёт сохранён в историю');
  }
}

function drawCanvas(cols, rows, drawW, drawH, rotated, winList, insertsPerPart) {
  const canvas = document.getElementById('nesting-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { sheetW, sheetH, kerf, margin, useDonors, donorW, donorH } = sheetParams;

  const pad = 20;
  const scale = Math.min((canvas.width - pad * 2) / sheetW, (canvas.height - pad * 2) / sheetH);
  const sw = sheetW * scale;
  const sh = sheetH * scale;
  const ox = (canvas.width - sw) / 2;
  const oy = (canvas.height - sh) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(ox, oy, sw, sh);

  ctx.strokeStyle = '#475569';
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(ox + margin * scale, oy + margin * scale, (sheetW - margin * 2) * scale, (sheetH - margin * 2) * scale);
  ctx.setLineDash([]);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = ox + (margin + c * (drawW + kerf)) * scale;
      const py = oy + (margin + r * (drawH + kerf)) * scale;
      const pw = drawW * scale;
      const ph = drawH * scale;

      ctx.fillStyle = 'rgba(234, 88, 12, 0.85)';
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = '#fdba74';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, pw, ph);

      if (winList.length > 0) {
        winList.forEach((win) => {
          const wx = px + (rotated ? win.y : win.x) * scale;
          const wy = py + (rotated ? win.x : win.y) * scale;
          const ww = (rotated ? win.h : win.w) * scale;
          const wh = (rotated ? win.w : win.h) * scale;

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(wx, wy, ww, wh);
          ctx.strokeStyle = '#3b82f6';
          ctx.strokeRect(wx, wy, ww, wh);

          if (useDonors && insertsPerPart > 0) {
            ctx.fillStyle = '#22c55e';
            const iw = Math.min(ww - 4, donorW * scale);
            const ih = Math.min(wh - 4, donorH * scale);
            if (iw > 2 && ih > 2) {
              ctx.fillRect(wx + 2, wy + 2, iw, ih);
            }
          }
        });
      }
    }
  }
}
