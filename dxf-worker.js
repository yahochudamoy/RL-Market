self.onmessage = function (e) {
  try {
    const buffer = e.data;
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(buffer);
    const lines = text.split(/\r?\n/);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let inEntities = false;
    let currentEntity = '';
    const segments = [];
    const polylines = [];
    let currentPoly = [];
    let lastX = null, lastY = null;

    function addPoint(x, y) {
      if (!isFinite(x) || !isFinite(y)) return;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }

    for (let i = 0; i < lines.length - 1; i += 2) {
      const code = lines[i].trim();
      const val = lines[i + 1].trim();

      if (code === '0' && val === 'SECTION') {
        const nextCode = lines[i + 2]?.trim();
        const nextVal = lines[i + 3]?.trim();
        if (nextCode === '2' && nextVal === 'ENTITIES') {
          inEntities = true;
        }
        continue;
      }

      if (code === '0' && val === 'ENDSEC' && inEntities) {
        if (currentPoly.length > 1) polylines.push(currentPoly);
        break;
      }

      if (!inEntities) continue;

      if (code === '0') {
        if (currentPoly.length > 1) {
          polylines.push(currentPoly);
          currentPoly = [];
        }
        currentEntity = val;
        lastX = null;
        lastY = null;
        continue;
      }

      if (currentEntity === 'LINE') {
        if (code === '10') lastX = parseFloat(val);
        if (code === '20') lastY = parseFloat(val);
        if (code === '11') {
          const x2 = parseFloat(val);
          const y2 = parseFloat(lines[i + 3]?.trim() || '0');
          if (lastX !== null && lastY !== null) {
            addPoint(lastX, lastY);
            addPoint(x2, y2);
            segments.push([lastX, lastY, x2, y2]);
          }
        }
      } else if (currentEntity === 'LWPOLYLINE' || currentEntity === 'VERTEX') {
        if (code === '10') lastX = parseFloat(val);
        if (code === '20') {
          lastY = parseFloat(val);
          if (lastX !== null && lastY !== null) {
            addPoint(lastX, lastY);
            currentPoly.push([lastX, lastY]);
          }
        }
      } else if (currentEntity === 'CIRCLE' || currentEntity === 'ARC') {
        if (code === '10') lastX = parseFloat(val);
        if (code === '20') lastY = parseFloat(val);
        if (code === '40' && lastX !== null && lastY !== null) {
          const r = parseFloat(val);
          addPoint(lastX - r, lastY - r);
          addPoint(lastX + r, lastY + r);
        }
      }
    }

    if (!isFinite(minX) || !isFinite(maxX)) {
      self.postMessage({ error: 'В DXF-файле не найдены векторные контуры (ENTITIES).' });
      return;
    }

    const width = Math.round((maxX - minX) * 10) / 10;
    const height = Math.round((maxY - minY) * 10) / 10;

    const windows = [];
    polylines.forEach((poly) => {
      if (poly.length < 4) return;
      let pMinX = Infinity, pMinY = Infinity, pMaxX = -Infinity, pMaxY = -Infinity;
      poly.forEach(([px, py]) => {
        if (px < pMinX) pMinX = px;
        if (py < pMinY) pMinY = py;
        if (px > pMaxX) pMaxX = px;
        if (py > pMaxY) pMaxY = py;
      });
      const pw = pMaxX - pMinX;
      const ph = pMaxY - pMinY;
      if (pMinX > minX + 5 && pMaxX < maxX - 5 && pMinY > minY + 5 && pMaxY < maxY - 5) {
        if (pw >= 80 && ph >= 80) {
          windows.push({
            w: Math.round(pw),
            h: Math.round(ph),
            x: pMinX - minX,
            y: pMinY - minY
          });
        }
      }
    });

    const previewSegments = [];
    polylines.forEach((poly) => {
      for (let j = 0; j < poly.length - 1; j++) {
        previewSegments.push([
          (poly[j][0] - minX) / (width || 1),
          (poly[j][1] - minY) / (height || 1),
          (poly[j + 1][0] - minX) / (width || 1),
          (poly[j + 1][1] - minY) / (height || 1)
        ]);
      }
    });
    segments.forEach((s) => {
      previewSegments.push([
        (s[0] - minX) / (width || 1),
        (s[1] - minY) / (height || 1),
        (s[2] - minX) / (width || 1),
        (s[3] - minY) / (height || 1)
      ]);
    });

    const step = Math.max(1, Math.floor(previewSegments.length / 1500));
    const sampledPreview = previewSegments.filter((_, idx) => idx % step === 0);

    self.postMessage({
      width,
      height,
      windows,
      preview: sampledPreview
    });
  } catch (err) {
    self.postMessage({ error: 'Ошибка разбора DXF: ' + err.message });
  }
};
