(() => {
  const hero = document.querySelector(".hero");
  const grid = hero?.querySelector(".hero-grid");
  const study = grid?.querySelector(".study");
  const picture = study?.querySelector(".assembly-view");
  if (!picture || !("ResizeObserver" in window)) return;

  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const compact = matchMedia("(max-width: 760px)");
  const stack = document.createElement("div");
  const svgNamespace = "http://www.w3.org/2000/svg";
  const scanner = document.createElementNS(svgNamespace, "svg");
  const line = document.createElementNS(svgNamespace, "line");
  stack.className = "optical-scan-stack";
  scanner.classList.add("optical-scan-boundary");
  scanner.setAttribute("aria-hidden", "true");
  scanner.setAttribute("viewBox", "0 0 100 100");
  scanner.setAttribute("preserveAspectRatio", "none");
  line.setAttribute("x1", "100");
  line.setAttribute("y2", "100");
  line.setAttribute("vector-effect", "non-scaling-stroke");
  scanner.append(line);

  const cache = new Map();
  const clamp = (value) => Math.max(0, Math.min(1, value));
  let active;
  let geometry;
  let frame = 0;
  let lastPosition;
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
      stack.replaceChildren(picture, ...plates, scanner);
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
      start = Math.max(18, artTop - innerHeight * 0.58);
      end = Math.max(start + 90, artTop - innerHeight * 0.115);
    } else {
      const top = scrollY + hero.getBoundingClientRect().top;
      const pinnedAt = top - (parseFloat(getComputedStyle(grid).top) || 0);
      const runway = hero.offsetHeight - grid.offsetHeight;
      start = Math.max(14, pinnedAt - innerHeight * 0.065);
      end = Math.max(start + 90, pinnedAt + runway * 0.89);
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
    const position = Math.round((-9 + 124 * progress) * 100) / 100;
    if (position === lastPosition && hero.dataset.opticalPhase) return;
    lastPosition = position;
    stack.style.setProperty("--scan-front", `${position}%`);
    const intensity = clamp(progress / 0.12) * clamp((0.97 - progress) / 0.12);
    stack.style.setProperty("--scan-beam", String(intensity * 0.68));
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
