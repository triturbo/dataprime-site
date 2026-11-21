(() => {
  const hero = document.querySelector(".hero");
  const grid = hero?.querySelector(".hero-grid");
  const study = grid?.querySelector(".study");
  const picture = study?.querySelector(".assembly-view");
  if (!picture || !("ResizeObserver" in window)) return;

  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const compact = matchMedia("(max-width: 760px)");
  const stack = document.createElement("div");
  stack.className = "optical-scan-stack";

  const cache = new Map();
  const clamp = (value) => Math.max(0, Math.min(1, value));
  let active;
  let geometry;
  let frame = 0;
  let lastProgress;

  function loadPlate(name, variant) {
    const plate = new Image();
    plate.className = `optical-scan-plate optical-scan-${name}`;
    plate.alt = "";
    plate.setAttribute("aria-hidden", "true");
    plate.fetchPriority = "low";
    plate.src = `/assets/photonic-${name}-${variant}.webp`;
    return plate.decode().then(() => plate);
  }

  async function prepare() {
    if (motion.matches) {
      delete hero.dataset.opticalScan;
      delete hero.dataset.opticalPhase;
      geometry = undefined;
      lastProgress = undefined;
      return;
    }

    const variant = compact.matches ? "mobile" : "desktop";
    if (variant === active && hero.dataset.opticalScan) {
      measure();
      return;
    }
    if (!cache.has(variant)) {
      cache.set(variant, Promise.all([loadPlate("digital", variant), loadPlate("binary", variant)]));
    }
    try {
      const plates = await cache.get(variant);
      if (motion.matches || variant !== (compact.matches ? "mobile" : "desktop")) return;
      if (!stack.isConnected) picture.before(stack);
      stack.replaceChildren(picture, ...plates);
      active = variant;
      hero.dataset.opticalScan = "ready";
      measure();
    } catch {
      cache.delete(variant);
    }
  }

  function measure() {
    if (!hero.dataset.opticalScan) return;
    const art = study.getBoundingClientRect();
    const start = Math.max(0, scrollY + art.top + art.height * 0.35 - innerHeight);
    // The artwork's travel comes from existing content, so the effect adds
    // no scroll distance. These landmarks themselves are never transformed.
    const end = scrollY + hero.getBoundingClientRect().bottom + innerHeight * 0.4;
    geometry = { start, distance: Math.max(1, end - start) };
    lastProgress = undefined;
    schedule();
  }

  function paint() {
    frame = 0;
    if (!geometry) return;
    const progress = clamp((scrollY - geometry.start) / geometry.distance);
    if (progress === lastProgress && hero.dataset.opticalPhase) return;
    lastProgress = progress;
    // Finish becoming linework while there is still enough light to read it.
    // Only the artwork moves at a different speed from the document.
    const digital = clamp(progress / 0.67);
    const travel = progress * geometry.distance;
    stack.style.setProperty("--engraving-opacity", String(digital));
    stack.style.setProperty("--binary-opacity", String(digital * digital));
    stack.style.setProperty("--cable-drift", `${travel * 0.68}px`);
    stack.style.setProperty("--cable-scale", String(1 - 0.16 * progress));
    stack.style.setProperty("--cable-opacity", String((1 - progress) ** 1.16));
    hero.dataset.opticalPhase = digital === 0 ? "start" : digital === 1 ? "complete" : "scanning";
  }

  function schedule() {
    if (geometry && !frame) frame = requestAnimationFrame(paint);
  }

  const observer = new ResizeObserver(measure);
  observer.observe(study);
  observer.observe(grid);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  compact.addEventListener("change", prepare);
  motion.addEventListener("change", prepare);
  prepare();
})();
