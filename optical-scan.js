(() => {
  const hero = document.querySelector(".hero");
  const grid = hero?.querySelector(".hero-grid");
  const study = grid?.querySelector(".study");
  const viewport = study?.querySelector(".study-viewport");
  const picture = viewport?.querySelector(".assembly-view");
  if (!picture || !("ResizeObserver" in window)) return;

  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const compact = matchMedia("(max-width: 760px)");
  const stack = document.createElement("div");
  stack.className = "optical-scan-stack";

  const cache = new Map();
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const smooth = (value) => value * value * (3 - 2 * value);
  const restingOpacity = 0.30;
  let active;
  let geometry;
  let frame = 0;
  let lastProgress;

  function loadPlate(name, variant) {
    const plate = new Image();
    plate.className = `optical-scan-plate optical-scan-${name}`;
    plate.alt = "";
    plate.setAttribute("aria-hidden", "true");
    plate.src = `/assets/photonic-${name}-${variant}.webp?v=79847d54fa`;
    return plate;
  }

  function prepare() {
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
      cache.set(variant, [loadPlate("digital", variant), loadPlate("binary", variant)]);
    }
    if (!stack.isConnected) picture.before(stack);
    stack.replaceChildren(picture, ...cache.get(variant));
    active = variant;
    hero.dataset.opticalScan = "ready";
    measure();
  }

  function measure() {
    if (!hero.dataset.opticalScan) return;
    const art = viewport.getBoundingClientRect();
    const initialTop = scrollY + art.top;
    const restingCenter = innerHeight * (compact.matches ? 0.56 : 0.45);
    const end = scrollY + hero.getBoundingClientRect().bottom + innerHeight * 0.4;
    // Match the figure at the top, then settle into a viewport-relative position.
    // The figure still reserves its original space in the document.
    geometry = {
      initialTop,
      restingTop: Math.min(initialTop - art.height * 0.1, restingCenter - art.height * 0.5),
      distance: Math.max(1, end),
    };
    stack.style.setProperty("--cable-left", `${art.left}px`);
    stack.style.setProperty("--cable-width", `${art.width}px`);
    stack.style.setProperty("--cable-height", `${art.height}px`);
    lastProgress = undefined;
    cancelAnimationFrame(frame);
    paint();
  }

  function paint() {
    frame = 0;
    if (!geometry) return;
    const progress = clamp(scrollY / geometry.distance);
    if (progress === lastProgress && hero.dataset.opticalPhase) return;
    lastProgress = progress;
    // Traces emerge on the first pixel. Keep them bright while the binary
    // etching develops, then leave the completed plate behind the content.
    const firstTraces = 1 - (1 - clamp(scrollY / 150)) ** 3;
    const digital = 0.4 * firstTraces + 0.6 * (1 - (1 - clamp(progress / 0.58)) ** 1.9);
    const binary = 0.24 * firstTraces + 0.76 * (1 - (1 - clamp(progress / 0.65)) ** 1.65);
    const drift = 1 - (1 - progress) ** 2;
    const top = geometry.initialTop + (geometry.restingTop - geometry.initialTop) * drift;
    const fade = smooth(clamp((progress - 0.12) / 0.88));
    const opacity = 1 - (1 - restingOpacity) * fade;
    stack.style.setProperty("--engraving-opacity", String(digital));
    stack.style.setProperty("--binary-opacity", String(binary));
    stack.style.setProperty("--cable-contrast", String(1 + digital * 0.44));
    stack.style.setProperty("--cable-top", `${top}px`);
    stack.style.setProperty("--cable-scale", String(1 - 0.14 * drift));
    stack.style.setProperty("--cable-opacity", String(opacity));
    stack.style.setProperty("--section-cable-opacity", String(opacity * smooth(clamp((progress - 0.35) / 0.4))));
    hero.dataset.opticalPhase = progress === 0 ? "start" : binary === 1 ? "complete" : "scanning";
  }

  function schedule() {
    if (geometry && !frame) frame = requestAnimationFrame(paint);
  }

  const observer = new ResizeObserver(measure);
  observer.observe(viewport);
  observer.observe(grid);
  observer.observe(document.querySelector(".masthead"));
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  compact.addEventListener("change", prepare);
  motion.addEventListener("change", prepare);
  prepare();
})();
