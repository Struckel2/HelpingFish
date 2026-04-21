// ============================================================
// ASSET LOADER
// ============================================================

function loadAssets() {
  const entries = Object.entries(ASSET_FILES);
  let loaded = 0;
  return new Promise((resolve) => {
    entries.forEach(([key, file]) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        drawLoadingScreen(loaded / entries.length);
        if (loaded === entries.length) resolve();
      };
      img.onerror = () => {
        console.warn('Failed to load:', file);
        loaded++;
        if (loaded === entries.length) resolve();
      };
      img.src = '/assets/' + encodeURIComponent(file);
      images[key] = img;
    });
  });
}

function drawLoadingScreen(progress) {
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🐟 Carregando...', W/2, H/2 - 40);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(W/2 - 150, H/2, 300, 30);
  ctx.fillStyle = '#4FC3F7';
  ctx.fillRect(W/2 - 150, H/2, 300 * progress, 30);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(W/2 - 150, H/2, 300, 30);
}
