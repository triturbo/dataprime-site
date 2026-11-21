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
  let releasedAt;

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
      restorePin();
      geometry = undefined;
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
      if (compact.matches) restorePin();
      measure();
      updateView();
    } catch {
      cache.delete(variant);
    }
  }

  function measure() {
    if (!hero.dataset.opticalScan || releasedAt !== undefined) return;
    let start;
    let end;
    if (compact.matches) {
      const artTop = scrollY + study.getBoundingClientRect().top;
      start = Math.max(0, artTop + study.offsetHeight * 0.45 - innerHeight);
      end = Math.max(start + 1, artTop);
    } else {
      const top = scrollY + hero.getBoundingClientRect().top;
      const pinnedAt = top - (parseFloat(getComputedStyle(grid).top) || 0);
      const runway = hero.offsetHeight - grid.offsetHeight;
      start = Math.max(0, top - innerHeight * 0.15);
      end = Math.max(start + 1, pinnedAt + runway);
    }
    geometry = { start, distance: end - start };
    schedule();
  }

  function paint() {
    frame = 0;
    if (!geometry) return;
    if (releasedAt !== undefined && !picture.hidden && scrollY <= releasedAt) {
      restorePin();
      measure();
    }
    const progress = clamp((scrollY - geometry.start) / geometry.distance);
    if (progress === lastProgress && hero.dataset.opticalPhase) return;
    lastProgress = progress;
    // The engraving replaces the photograph across the whole frame. The
    // transparent binary marks develop more slowly over that same image.
    stack.style.setProperty("--engraving-opacity", String(progress));
    stack.style.setProperty("--binary-opacity", String(progress * progress));
    hero.dataset.opticalPhase = progress === 0 ? "start" : progress === 1 ? "complete" : "scanning";
  }

  function schedule() {
    if (geometry && !frame) frame = requestAnimationFrame(paint);
  }

  function restorePin() {
    releasedAt = undefined;
    hero.removeAttribute("data-optical-section-flow");
    hero.style.removeProperty("--scan-section-offset");
  }

  function updateView() {
    if (!hero.dataset.opticalScan || compact.matches) return;
    if (picture.hidden && releasedAt === undefined) {
      // Preserve the figure's position when releasing the desktop pin.
      const offset = grid.getBoundingClientRect().top - hero.getBoundingClientRect().top;
      hero.style.setProperty("--scan-section-offset", `${Math.max(0, offset)}px`);
      hero.setAttribute("data-optical-section-flow", "");
      releasedAt = scrollY;
    }
    schedule();
  }

  const observer = new ResizeObserver(measure);
  observer.observe(study);
  observer.observe(grid);
  new MutationObserver(updateView).observe(picture, { attributeFilter: ["hidden"] });
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", measure, { passive: true });
  compact.addEventListener("change", prepare);
  motion.addEventListener("change", prepare);
  prepare();
})();
