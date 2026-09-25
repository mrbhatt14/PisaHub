// Shared fixed-ratio image cropper (drag + zoom). The frame is locked to the output
// ratio, so whatever is inside it is exactly what gets saved as a JPEG - nothing is
// cropped or letterboxed later. Used for event posters (3:2) and team headshots (3:4).
//
//   openCropper(file, { outW, outH, title, hint, onApply(blob) })

const crop = { img: null, nw: 0, nh: 0, scale: 1, minScale: 1, x: 0, y: 0, vw: 0, vh: 0, drag: null, cfg: null, ready: false };

function initCropper() {
  if (crop.ready) return;
  crop.ready = true;
  const stage = document.getElementById("cropStage");
  document.getElementById("cropCancel").addEventListener("click", () => document.getElementById("cropBackdrop").classList.add("admin-hidden"));
  document.getElementById("cropApply").addEventListener("click", applyCrop);
  document.getElementById("cropZoom").addEventListener("input", (e) => setCropScale(crop.minScale * Number(e.target.value)));
  stage.addEventListener("pointerdown", (e) => {
    stage.setPointerCapture(e.pointerId);
    crop.drag = { px: e.clientX, py: e.clientY, x: crop.x, y: crop.y };
  });
  stage.addEventListener("pointermove", (e) => {
    if (!crop.drag) return;
    crop.x = crop.drag.x + (e.clientX - crop.drag.px);
    crop.y = crop.drag.y + (e.clientY - crop.drag.py);
    paintCrop();
  });
  ["pointerup", "pointercancel"].forEach((t) => stage.addEventListener(t, () => (crop.drag = null)));
}

function openCropper(file, cfg) {
  initCropper();
  crop.cfg = cfg;
  document.getElementById("cropTitle").textContent = cfg.title;
  document.getElementById("cropHint").textContent = cfg.hint;
  const stage = document.getElementById("cropStage");
  stage.style.aspectRatio = `${cfg.outW} / ${cfg.outH}`;
  // portrait frames must not be as wide as landscape ones
  stage.style.width = `${cfg.outW >= cfg.outH ? 600 : 360}px`;
  document.getElementById("cropZoom").parentElement.style.width = stage.style.width;

  const img = document.getElementById("cropImg");
  img.onload = () => {
    crop.img = img; crop.nw = img.naturalWidth; crop.nh = img.naturalHeight;
    document.getElementById("cropBackdrop").classList.remove("admin-hidden");
    const rect = stage.getBoundingClientRect();
    crop.vw = rect.width; crop.vh = rect.height;
    crop.minScale = Math.max(crop.vw / crop.nw, crop.vh / crop.nh); // cover: no empty space possible
    document.getElementById("cropZoom").value = 1;
    crop.scale = crop.minScale;
    crop.x = (crop.vw - crop.nw * crop.scale) / 2;
    crop.y = (crop.vh - crop.nh * crop.scale) / 2;
    paintCrop();
    const soft = crop.nw < cfg.outW || crop.nh < cfg.outH * 0.6;
    document.getElementById("cropQuality").textContent = `Original: ${crop.nw}×${crop.nh}px. ` + (soft
      ? `Smaller than the ${cfg.outW}px output, so it may look slightly soft — a larger image is better.`
      : "Resolution is good.");
  };
  img.onerror = () => alert("This image couldn't be opened. Use a JPG, PNG or WebP file.");
  img.src = URL.createObjectURL(file);
}

function setCropScale(s) {
  const cx = crop.vw / 2, cy = crop.vh / 2; // zoom around the frame centre
  const ratio = s / crop.scale;
  crop.x = cx - (cx - crop.x) * ratio;
  crop.y = cy - (cy - crop.y) * ratio;
  crop.scale = s;
  paintCrop();
}

function paintCrop() {
  crop.x = Math.min(0, Math.max(crop.vw - crop.nw * crop.scale, crop.x));
  crop.y = Math.min(0, Math.max(crop.vh - crop.nh * crop.scale, crop.y));
  crop.img.style.width = `${crop.nw * crop.scale}px`;
  crop.img.style.height = `${crop.nh * crop.scale}px`;
  crop.img.style.transform = `translate(${crop.x}px, ${crop.y}px)`;
}

function applyCrop() {
  const { outW, outH, onApply } = crop.cfg;
  const canvas = document.createElement("canvas");
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(crop.img, -crop.x / crop.scale, -crop.y / crop.scale, crop.vw / crop.scale, crop.vh / crop.scale, 0, 0, outW, outH);
  canvas.toBlob((blob) => {
    document.getElementById("cropBackdrop").classList.add("admin-hidden");
    onApply(blob);
  }, "image/jpeg", 0.9);
}
