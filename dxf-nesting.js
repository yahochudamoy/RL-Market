// Модуль парсера .DXF (ArtCAM) и 2D нестинга с окнами-донорами
window.RL_CNC = (function() {
  let cncDefaults = JSON.parse(localStorage.getItem('rl_master_cnc_defaults') || 'null') || { ...window.RL_CONFIG.DEFAULT_CNC };
  let cncHistory = JSON.parse(localStorage.getItem('rl_master_cnc_history') || '[]');
  let mainDxfData = null;
  let insertDxfData = null;
  let isDonorModeEnabled = false;

  function parseDxfText(dxfText) {
    const rawLines = dxfText.split(/\r?\n/);
    const pairs = [];
    for (let i = 0; i + 1 < rawLines.length; i += 2) {
      const code = parseInt(rawLines[i].trim(), 10);
      const val = rawLines[i + 1].trim();
      if (!isNaN(code)) pairs.push({ code, val });
    }

    const loops = [];
    const looseSegments = [];
    let inEntities = false;
    let i = 0;

    while (i < pairs.length) {
      const p = pairs[i];
      if (p.code === 2 && p.val.toUpperCase() === 'ENTITIES') {
        inEntities = true;
        i++;
        continue;
      }
      if (p.code === 0 && p.val.toUpperCase() === 'ENDSEC' && inEntities) {
        break;
      }

      if (inEntities && p.code === 0) {
        const type = p.val.toUpperCase();
        i++;

        if (type === 'LWPOLYLINE') {
          const pts = [];
          let curX = null;
          while (i < pairs.length && pairs[i].code !== 0) {
            const ep = pairs[i];
            if (ep.code === 10) curX = parseFloat(ep.val);
            else if (ep.code === 20 && curX !== null) {
              pts.push({ x: curX, y: parseFloat(ep.val) });
              curX = null;
            }
            i++;
          }
          if (pts.length >= 3) loops.push(pts);
          continue;
        }

        if (type === 'POLYLINE') {
          const pts = [];
          while (i < pairs.length) {
            if (pairs[i].code === 0) {
              const sub = pairs[i].val.toUpperCase();
              if (sub === 'SEQEND') { i++; break; }
              if (sub === 'VERTEX') {
                i++;
                let vx = null, vy = null;
                while (i < pairs.length && pairs[i].code !== 0) {
                  if (pairs[i].code === 10) vx = parseFloat(pairs[i].val);
                  else if (pairs[i].code === 20) vy = parseFloat(pairs[i].val);
                  i++;
                }
                if (vx !== null && vy !== null) pts.push({ x: vx, y: vy });
                continue;
              }
            }
            i++;
          }
          if (pts.length >= 3) loops.push(pts);
          continue;
        }

        if (type === 'CIRCLE') {
          let cx = 0, cy = 0, r = 0;
          while (i < pairs.length && pairs[i].code !== 0) {
            if (pairs[i].code === 10) cx = parseFloat(pairs[i].val);
            else if (pairs[i].code === 20) cy = parseFloat(pairs[i].val);
            else if (pairs[i].code === 40) r = parseFloat(pairs[i].val);
            i++;
          }
          if (r > 0) {
            const pts = [];
            const segs = 32;
            for (let s = 0; s < segs; s++) {
              const ang = (s / segs) * Math.PI * 2;
              pts.push({ x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r });
            }
            loops.push(pts);
          }
          continue;
        }

        if (type === 'LINE') {
          let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
          while (i < pairs.length && pairs[i].code !== 0) {
            if (pairs[i].code === 10) x1 = parseFloat(pairs[i].val);
            else if (pairs[i].code === 20) y1 = parseFloat(pairs[i].val);
            else if (pairs[i].code === 11) x2 = parseFloat(pairs[i].val);
            else if (pairs[i].code === 21) y2 = parseFloat(pairs[i].val);
            i++;
          }
          looseSegments.push([{ x: x1, y: y1 }, { x: x2, y: y2 }]);
          continue;
        }

        if (type === 'ARC') {
          let cx = 0, cy = 0, r = 0, a1 = 0, a2 = 0;
          while (i < pairs.length && pairs[i].code !== 0) {
            if (pairs[i].code === 10) cx = parseFloat(pairs[i].val);
            else if (pairs[i].code === 20) cy = parseFloat(pairs[i].val);
            else if (pairs[i].code === 40) r = parseFloat(pairs[i].val);
            else if (pairs[i].code === 50) a1 = parseFloat(pairs[i].val);
            else if (pairs[i].code === 51) a2 = parseFloat(pairs[i].val);
            i++;
          }
          if (r > 0) {
            if (a2 < a1) a2 += 360;
            const steps = 16;
            for (let s = 0; s < steps; s++) {
              const t1 = ((a1 + (s / steps) * (a2 - a1)) * Math.PI) / 180;
              const t2 = ((a1 + ((s + 1) / steps) * (a2 - a1)) * Math.PI) / 180;
              looseSegments.push([
                { x: cx + Math.cos(t1) * r, y: cy + Math.sin(t1) * r },
                { x: cx + Math.cos(t2) * r, y: cy + Math.sin(t2) * r }
              ]);
            }
          }
          continue;
        }
      }
      i++;
    }

    if (looseSegments.length > 0) {
      const stitched = stitchSegmentsIntoLoops(looseSegments);
      stitched.forEach(lp => { if (lp.length >= 3) loops.push(lp); });
    }

    if (loops.length === 0) return null;

    const analyzed = loops.map((pts, idx) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      pts.forEach(pt => {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      });
      const width = Math.max(1, Math.round((maxX - minX) * 10) / 10);
      const height = Math.max(1, Math.round((maxY - minY) * 10) / 10);
      return { idx, pts, minX, minY, maxX, maxY, width, height, bboxArea: width * height };
    });

    analyzed.sort((a, b) => b.bboxArea - a.bboxArea);
    const outer = analyzed[0];

    const normOuterPts = outer.pts.map(pt => ({
      x: pt.x - outer.minX,
      y: pt.y - outer.minY
    }));

    const windows = [];
    for (let k = 1; k < analyzed.length; k++) {
      const sub = analyzed[k];
      const isInside =
        sub.minX >= outer.minX - 1 &&
        sub.maxX <= outer.maxX + 1 &&
        sub.minY >= outer.minY - 1 &&
        sub.maxY <= outer.maxY + 1;

      if (isInside && sub.width >= 15 && sub.height >= 15) {
        windows.push({
          id: `win_${k}`,
          label: `Окно #${windows.length + 1}`,
          pts: sub.pts.map(pt => ({ x: pt.x - outer.minX, y: pt.y - outer.minY })),
          relX: sub.minX - outer.minX,
          relY: sub.minY - outer.minY,
          width: Math.round(sub.width),
          height: Math.round(sub.height),
          enabled: true
        });
      }
    }

    return {
      outerLoop: {
        pts: normOuterPts,
        width: Math.round(outer.width),
        height: Math.round(outer.height)
      },
      windows
    };
  }

  function stitchSegmentsIntoLoops(segments) {
    const used = new Array(segments.length).fill(false);
    const resultLoops = [];
    const EPS = 0.5;
    const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) <= EPS;

    for (let i = 0; i < segments.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      const chain = [segments[i][0], segments[i][1]];
      let extended = true;
      while (extended) {
        extended = false;
        const tail = chain[chain.length - 1];
        for (let j = 0; j < segments.length; j++) {
          if (used[j]) continue;
          if (near(tail, segments[j][0])) {
            used[j] = true;
            chain.push(segments[j][1]);
            extended = true;
            break;
          } else if (near(tail, segments[j][1])) {
            used[j] = true;
            chain.push(segments[j][0]);
            extended = true;
            break;
          }
        }
      }
      if (chain.length >= 3) resultLoops.push(chain);
    }
    return resultLoops;
  }

  function transformDxfPoint(pt, origW, origH, rotated90) {
    const cx = pt.x;
    const cy = origH - pt.y;
    if (!rotated90) return { x: cx, y: cy };
    return { x: origH - cy, y: cx };
  }

  function computeNestingMath() {
    const sw = Math.max(10, Number(document.getElementById('calc-sheet-w').value) || cncDefaults.sheetW);
    const sh = Math.max(10, Number(document.getElementById('calc-sheet-h').value) || cncDefaults.sheetH);
    const pw = Math.max(10, Number(document.getElementById('calc-part-w').value) || 450);
    const ph = Math.max(10, Number(document.getElementById('calc-part-h').value) || 350);
    const kerf = Math.max(0, Number(document.getElementById('calc-kerf').value) || 0);
    const margin = Math.max(0, Number(document.getElementById('calc-margin').value) || 0);

    const uw = Math.max(0, sw - margin * 2);
    const uh = Math.max(0, sh - margin * 2);

    const c1 = Math.floor((uw + kerf) / (pw + kerf));
    const r1 = Math.floor((uh + kerf) / (ph + kerf));
    const cnt1 = Math.max(0, c1 * r1);

    const c2 = Math.floor((uw + kerf) / (ph + kerf));
    const r2 = Math.floor((uh + kerf) / (pw + kerf));
    const cnt2 = Math.max(0, c2 * r2);

    let cols = c1, rows = r1, w = pw, h = ph, totalMain = cnt1, rotated90 = false;
    if (cnt2 > cnt1) {
      cols = c2; rows = r2; w = ph; h = pw; totalMain = cnt2; rotated90 = true;
    }

    const insW = Math.max(5, Number(document.getElementById('calc-insert-w').value) || 140);
    const insH = Math.max(5, Number(document.getElementById('calc-insert-h').value) || 90);
    let donorInsertsPerMain = 0;
    const windowLayouts = [];

    if (isDonorModeEnabled && mainDxfData && Array.isArray(mainDxfData.windows)) {
      mainDxfData.windows.forEach(win => {
        if (!win.enabled) return;
        const winUsableW = Math.max(0, win.width - kerf * 2);
        const winUsableH = Math.max(0, win.height - kerf * 2);

        const ic1 = Math.floor((winUsableW + kerf) / (insW + kerf));
        const ir1 = Math.floor((winUsableH + kerf) / (insH + kerf));
        const icnt1 = Math.max(0, ic1 * ir1);

        const ic2 = Math.floor((winUsableW + kerf) / (insH + kerf));
        const ir2 = Math.floor((winUsableH + kerf) / (insW + kerf));
        const icnt2 = Math.max(0, ic2 * ir2);

        let iCols = ic1, iRows = ir1, iw = insW, ih = insH, iTotal = icnt1, iRot = false;
        if (icnt2 > icnt1) {
          iCols = ic2; iRows = ir2; iw = insH; ih = insW; iTotal = icnt2; iRot = true;
        }

        donorInsertsPerMain += iTotal;
        windowLayouts.push({ win, iCols, iRows, iw, ih, iTotal, iRot });
      });
    }

    const totalDonorParts = totalMain * donorInsertsPerMain;
    const usedArea = totalMain * (pw * ph) + totalDonorParts * (insW * insH);
    const eff = sw * sh > 0 ? Math.min(100, (usedArea / (sw * sh)) * 100).toFixed(1) : 0;

    return {
      sw, sh, pw, ph, kerf, margin,
      cols, rows, w, h, totalMain, rotated90,
      insW, insH, totalDonorParts, windowLayouts, eff
    };
  }

  function previewCncCanvas() {
    const res = computeNestingMath();
    document.getElementById('res-parts-per-sheet').textContent = `${res.totalMain} шт.`;
    document.getElementById('res-donor-parts').textContent = `${res.totalDonorParts} шт.`;
    document.getElementById('res-efficiency').textContent = `${res.eff}%`;
    document.getElementById('res-grid-info').textContent = `${res.cols} × ${res.rows}`;
    document.getElementById('rotation-badge').textContent = `Ориентация: ${res.rotated90 ? '90°' : '0°'}`;

    const canvas = document.getElementById('nesting-canvas');
    if (!canvas) return res;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pad = 12;
    const scale = Math.min((canvas.width - pad * 2) / res.sw, (canvas.height - pad * 2) / res.sh);
    const ox = pad + ((canvas.width - pad * 2) - res.sw * scale) / 2;
    const oy = pad + ((canvas.height - pad * 2) - res.sh * scale) / 2;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(ox, oy, res.sw * scale, res.sh * scale);

    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      ox + res.margin * scale,
      oy + res.margin * scale,
      (res.sw - res.margin * 2) * scale,
      (res.sh - res.margin * 2) * scale
    );
    ctx.restore();

    for (let r = 0; r < res.rows; r++) {
      for (let c = 0; c < res.cols; c++) {
        const partX = ox + (res.margin + c * (res.w + res.kerf)) * scale;
        const partY = oy + (res.margin + r * (res.h + res.kerf)) * scale;

        if (mainDxfData && mainDxfData.outerLoop && mainDxfData.outerLoop.pts.length >= 3) {
          const origW = mainDxfData.outerLoop.width;
          const origH = mainDxfData.outerLoop.height;

          ctx.beginPath();
          mainDxfData.outerLoop.pts.forEach((pt, idx) => {
            const tp = transformDxfPoint(pt, origW, origH, res.rotated90);
            const sx = partX + tp.x * scale;
            const sy = partY + tp.y * scale;
            if (idx === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.closePath();
          ctx.fillStyle = 'rgba(249, 115, 22, 0.85)';
          ctx.fill();
          ctx.strokeStyle = '#ffedd5';
          ctx.lineWidth = 1;
          ctx.stroke();

          mainDxfData.windows.forEach(win => {
            ctx.beginPath();
            win.pts.forEach((pt, idx) => {
              const tp = transformDxfPoint(pt, origW, origH, res.rotated90);
              const sx = partX + tp.x * scale;
              const sy = partY + tp.y * scale;
              if (idx === 0) ctx.moveTo(sx, sy);
              else ctx.lineTo(sx, sy);
            });
            ctx.closePath();
            ctx.fillStyle = '#0f172a';
            ctx.fill();

            if (isDonorModeEnabled && win.enabled) {
              ctx.save();
              ctx.setLineDash([3, 2]);
              ctx.strokeStyle = '#22d3ee';
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.restore();
            } else {
              ctx.strokeStyle = '#475569';
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          });

          if (isDonorModeEnabled && res.windowLayouts.length > 0) {
            res.windowLayouts.forEach(wl => {
              const winTopLeft = transformDxfPoint(
                { x: wl.win.relX, y: wl.win.relY + wl.win.height },
                origW, origH, res.rotated90
              );
              const baseWinX = partX + (winTopLeft.x + res.kerf) * scale;
              const baseWinY = partY + (winTopLeft.y + res.kerf) * scale;

              for (let ir = 0; ir < wl.iRows; ir++) {
                for (let ic = 0; ic < wl.iCols; ic++) {
                  const ix = baseWinX + ic * (wl.iw + res.kerf) * scale;
                  const iy = baseWinY + ir * (wl.ih + res.kerf) * scale;

                  if (insertDxfData && insertDxfData.pts && insertDxfData.pts.length >= 3) {
                    ctx.beginPath();
                    insertDxfData.pts.forEach((ipt, pidx) => {
                      const itp = transformDxfPoint(ipt, insertDxfData.width, insertDxfData.height, wl.iRot);
                      const px = ix + itp.x * scale;
                      const py = iy + itp.y * scale;
                      if (pidx === 0) ctx.moveTo(px, py);
                      else ctx.lineTo(px, py);
                    });
                    ctx.closePath();
                    ctx.fillStyle = '#10b981';
                    ctx.fill();
                    ctx.strokeStyle = '#a7f3d0';
                    ctx.lineWidth = 0.7;
                    ctx.stroke();
                  } else {
                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(ix, iy, wl.iw * scale, wl.ih * scale);
                    ctx.strokeStyle = '#a7f3d0';
                    ctx.lineWidth = 0.7;
                    ctx.strokeRect(ix, iy, wl.iw * scale, wl.ih * scale);
                  }
                }
              }
            });
          }
        } else {
          ctx.fillStyle = '#f97316';
          ctx.fillRect(partX, partY, res.w * scale, res.h * scale);
          ctx.strokeStyle = '#ffedd5';
          ctx.lineWidth = 1;
          ctx.strokeRect(partX, partY, res.w * scale, res.h * scale);
        }
      }
    }

    return res;
  }

  return {
    getDefaults: () => cncDefaults,
    setDefaults: (d) => { cncDefaults = d; localStorage.setItem('rl_master_cnc_defaults', JSON.stringify(d)); },
    getHistory: () => cncHistory,
    setHistory: (h) => { cncHistory = h; localStorage.setItem('rl_master_cnc_history', JSON.stringify(h)); },
    getMainDxf: () => mainDxfData,
    setMainDxf: (d) => { mainDxfData = d; },
    getInsertDxf: () => insertDxfData,
    setInsertDxf: (d) => { insertDxfData = d; },
    isDonorEnabled: () => isDonorModeEnabled,
    setDonorEnabled: (v) => { isDonorModeEnabled = v; },
    parseDxfText,
    previewCncCanvas
  };
})();
