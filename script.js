const scrollLinks = document.querySelectorAll("[data-scroll-to]");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".site-nav");
const navAnchors = Array.from(document.querySelectorAll(".site-nav a"));
const siteHeader = document.querySelector(".site-header");
const progressBar = document.querySelector(".scroll-progress span");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer:fine)").matches;
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const lowPowerMode =
  prefersReducedMotion ||
  connection?.saveData ||
  (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
const canViewTransition =
  typeof document.startViewTransition === "function" && !prefersReducedMotion && !lowPowerMode;

const runViewTransition = (updateFn) => {
  if (!canViewTransition) {
    updateFn();
    return;
  }

  document.startViewTransition(updateFn);
};

document.body.classList.toggle("low-power", Boolean(lowPowerMode));

const closeMenu = () => {
  navMenu?.classList.remove("open");
  navToggle?.classList.remove("open");
  navToggle?.setAttribute("aria-expanded", "false");
};

const openMenu = () => {
  navMenu?.classList.add("open");
  navToggle?.classList.add("open");
  navToggle?.setAttribute("aria-expanded", "true");
};

const getHeaderOffset = () => {
  if (!siteHeader) return 12;
  const headerPosition = window.getComputedStyle(siteHeader).position;
  const shouldOffset = headerPosition === "sticky" || headerPosition === "fixed";
  return shouldOffset ? siteHeader.offsetHeight + 18 : 12;
};

const smoothScrollTo = (selector) => {
  const target = document.querySelector(selector);
  if (!target) return null;

  const top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
  const behavior = prefersReducedMotion || lowPowerMode ? "auto" : "smooth";
  window.scrollTo({ top: Math.max(0, top), behavior });
  return target;
};

const highlightTarget = (target) => {
  if (!target) return;
  const highlightedNode =
    target.querySelector(".section-head, .hero-copy, .contact-copy, .hero-stage") || target;
  highlightedNode.classList.remove("target-glow");
  void highlightedNode.offsetWidth;
  highlightedNode.classList.add("target-glow");
  window.setTimeout(() => highlightedNode.classList.remove("target-glow"), 900);
};

scrollLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const target = smoothScrollTo(link.dataset.scrollTo);
    runViewTransition(() => highlightTarget(target));
    closeMenu();
  });
});

navToggle?.addEventListener("click", () => {
  const isOpen = navMenu?.classList.contains("open");
  runViewTransition(() => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

document.addEventListener("click", (event) => {
  if (!navMenu?.classList.contains("open") || !siteHeader) return;
  if (!siteHeader.contains(event.target)) closeMenu();
});

const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const revealNodes = document.querySelectorAll(".reveal");
revealNodes.forEach((node) => {
  const delay = Number(node.dataset.delay || 0);
  node.style.setProperty("--reveal-delay", `${delay}ms`);
});

if (!("IntersectionObserver" in window) || prefersReducedMotion) {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -7% 0px" }
  );

  revealNodes.forEach((node) => revealObserver.observe(node));
}

const sectionAnchors = ["#hero", "#domains", "#services", "#outcomes", "#approach", "#contact"]
  .map((selector) => document.querySelector(selector))
  .filter(Boolean);

const setActiveNav = () => {
  if (!navAnchors.length || !sectionAnchors.length) return;

  const offset = getHeaderOffset() + window.innerHeight * 0.22;
  let currentId = sectionAnchors[0].id;

  sectionAnchors.forEach((section) => {
    if (window.scrollY + offset >= section.offsetTop) {
      currentId = section.id;
    }
  });

  navAnchors.forEach((anchor) => {
    const isActive = anchor.getAttribute("href") === `#${currentId}`;
    anchor.classList.toggle("is-active", isActive);
  });
};

const spotlightNodes = document.querySelectorAll(
  ".hero-note, .hero-stage, .stage-card, .domain-panel, .services-intro, .service-card, .outcome-panel, .approach-card, .contact-copy, .contact-form"
);

if (finePointer && !prefersReducedMotion && !lowPowerMode) {
  spotlightNodes.forEach((node) => {
    node.addEventListener("pointermove", (event) => {
      const rect = node.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      node.style.setProperty("--pointer-x", `${x}%`);
      node.style.setProperty("--pointer-y", `${y}%`);
    });

    node.addEventListener("pointerleave", () => {
      node.style.removeProperty("--pointer-x");
      node.style.removeProperty("--pointer-y");
    });
  });
}

const heroStage = document.querySelector(".hero-stage");
if (heroStage && finePointer && !prefersReducedMotion && !lowPowerMode) {
  heroStage.addEventListener("pointermove", (event) => {
    const rect = heroStage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const rotateX = ((50 - y) / 50) * 3.6;
    const rotateY = ((x - 50) / 50) * 3.6;
    heroStage.style.setProperty("--stage-rx", `${rotateX}deg`);
    heroStage.style.setProperty("--stage-ry", `${rotateY}deg`);
  });

  heroStage.addEventListener("pointerleave", () => {
    heroStage.style.removeProperty("--stage-rx");
    heroStage.style.removeProperty("--stage-ry");
  });
}

const contactForm = document.querySelector(".contact-form");
contactForm?.addEventListener("submit", () => {
  const submitButton = contactForm.querySelector("button[type='submit']");
  if (!submitButton) return;
  submitButton.disabled = true;
  submitButton.textContent = "Sending...";
});

let progressTicking = false;
const updateFrame = () => {
  const doc = document.documentElement;
  const scrollable = doc.scrollHeight - window.innerHeight;
  const value = scrollable <= 0 ? 0 : Math.min(window.scrollY / scrollable, 1);
  if (progressBar) {
    progressBar.style.transform = `scaleX(${value})`;
  }
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 16);
  setActiveNav();
};

updateFrame();
window.addEventListener(
  "scroll",
  () => {
    if (progressTicking) return;
    progressTicking = true;
    window.requestAnimationFrame(() => {
      updateFrame();
      progressTicking = false;
    });
  },
  { passive: true }
);

window.addEventListener(
  "resize",
  () => {
    updateFrame();
    if (window.innerWidth > 860) closeMenu();
  },
  { passive: true }
);

const ambientCanvas = document.getElementById("ambientCanvas");
const shouldAnimateCanvas =
  ambientCanvas && window.innerWidth > 900 && !prefersReducedMotion && !lowPowerMode;

if (shouldAnimateCanvas) {
  const ctx = ambientCanvas.getContext("2d", { alpha: true, desynchronized: true });
  const palette = ["114,227,255", "77,176,255", "156,143,255", "255,211,111"];
  const points = Array.from({ length: 64 }, () => {
    const speed = 0.14 + Math.random() * 0.26;
    return {
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() > 0.5 ? 1 : -1) * speed,
      vy: (Math.random() > 0.5 ? 1 : -1) * speed,
      size: 1.2 + Math.random() * 2.4,
      color: palette[Math.floor(Math.random() * palette.length)],
    };
  });

  let width = window.innerWidth;
  let height = window.innerHeight;
  let frameId;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    ambientCanvas.width = Math.floor(width * ratio);
    ambientCanvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  resize();

  const connectionDistance = 150;
  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      point.x += point.vx / width;
      point.y += point.vy / height;

      if (point.x <= 0 || point.x >= 1) point.vx *= -1;
      if (point.y <= 0 || point.y >= 1) point.vy *= -1;

      const x = point.x * width;
      const y = point.y * height;

      ctx.beginPath();
      ctx.fillStyle = `rgba(${point.color}, 0.48)`;
      ctx.arc(x, y, point.size, 0, Math.PI * 2);
      ctx.fill();

      for (let j = i + 1; j < points.length; j += 1) {
        const other = points[j];
        const ox = other.x * width;
        const oy = other.y * height;
        const dx = x - ox;
        const dy = y - oy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > connectionDistance) continue;

        const opacity = (1 - distance / connectionDistance) * 0.18;
        const gradient = ctx.createLinearGradient(x, y, ox, oy);
        gradient.addColorStop(0, `rgba(${point.color}, ${opacity})`);
        gradient.addColorStop(1, `rgba(${other.color}, ${opacity * 0.9})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ox, oy);
        ctx.stroke();
      }
    }

    frameId = window.requestAnimationFrame(draw);
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      window.cancelAnimationFrame(frameId);
      return;
    }

    frameId = window.requestAnimationFrame(draw);
  };

  let resizeTimer;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 180);
    },
    { passive: true }
  );

  document.addEventListener("visibilitychange", onVisibilityChange, { passive: true });
  frameId = window.requestAnimationFrame(draw);
}
