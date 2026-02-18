const scrollLinks = document.querySelectorAll("[data-scroll-to]");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".site-nav");
const siteHeader = document.querySelector(".site-header");
const progressBar = document.querySelector(".scroll-progress span");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const lowPowerMode =
  prefersReducedMotion ||
  connection?.saveData ||
  (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

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

const smoothScrollTo = (selector) => {
  const target = document.querySelector(selector);
  if (!target) return;

  const headerPosition = siteHeader ? window.getComputedStyle(siteHeader).position : "";
  const useHeaderOffset = headerPosition === "sticky" || headerPosition === "fixed";
  const headerOffset = useHeaderOffset && siteHeader ? siteHeader.offsetHeight + 14 : 10;
  const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
  const behavior = prefersReducedMotion || lowPowerMode ? "auto" : "smooth";

  window.scrollTo({ top: Math.max(top, 0), behavior });
};

scrollLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    smoothScrollTo(link.dataset.scrollTo);
    closeMenu();
  });
});

navToggle?.addEventListener("click", () => {
  const isOpen = navMenu?.classList.contains("open");
  if (isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
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
    { threshold: 0.18, rootMargin: "0px 0px -5% 0px" }
  );

  revealNodes.forEach((node) => revealObserver.observe(node));
}

const contactForm = document.querySelector(".contact-form");
contactForm?.addEventListener("submit", () => {
  const submitButton = contactForm.querySelector("button[type='submit']");
  if (!submitButton) return;
  submitButton.disabled = true;
  submitButton.textContent = "Sending...";
});

let progressTicking = false;
const updateProgress = () => {
  if (!progressBar) return;
  const doc = document.documentElement;
  const scrollable = doc.scrollHeight - window.innerHeight;
  const value = scrollable <= 0 ? 0 : Math.min(window.scrollY / scrollable, 1);
  progressBar.style.transform = `scaleX(${value})`;
  siteHeader?.classList.toggle("is-scrolled", window.scrollY > 18);
};

updateProgress();
window.addEventListener(
  "scroll",
  () => {
    if (progressTicking) return;
    progressTicking = true;
    window.requestAnimationFrame(() => {
      updateProgress();
      progressTicking = false;
    });
  },
  { passive: true }
);

const ambientCanvas = document.getElementById("ambientCanvas");
const shouldAnimateCanvas =
  ambientCanvas && window.innerWidth > 860 && !prefersReducedMotion && !lowPowerMode;

if (shouldAnimateCanvas) {
  const ctx = ambientCanvas.getContext("2d", { alpha: true, desynchronized: true });
  const palette = ["76,165,255", "38,211,178", "143,134,255"];
  const nodeCount = 56;
  const points = Array.from({ length: nodeCount }, () => {
    const speed = 0.14 + Math.random() * 0.24;
    return {
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() > 0.5 ? 1 : -1) * speed,
      vy: (Math.random() > 0.5 ? 1 : -1) * speed,
      size: 1.2 + Math.random() * 2.3,
      color: palette[Math.floor(Math.random() * palette.length)],
    };
  });

  let width = window.innerWidth;
  let height = window.innerHeight;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.4);
    width = window.innerWidth;
    height = window.innerHeight;
    ambientCanvas.width = Math.floor(width * ratio);
    ambientCanvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  resize();

  let frameId;
  const connectionDistance = 140;

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
      ctx.fillStyle = `rgba(${point.color}, 0.45)`;
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

        const opacity = (1 - distance / connectionDistance) * 0.22;
        const gradient = ctx.createLinearGradient(x, y, ox, oy);
        gradient.addColorStop(0, `rgba(${point.color}, ${opacity})`);
        gradient.addColorStop(1, `rgba(${other.color}, ${opacity * 0.85})`);

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
      resizeTimer = setTimeout(resize, 180);
    },
    { passive: true }
  );

  document.addEventListener("visibilitychange", onVisibilityChange, { passive: true });
  frameId = window.requestAnimationFrame(draw);
}
