const scrollButtons = document.querySelectorAll("[data-scroll-to]");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const lowPowerMode =
  prefersReducedMotion ||
  connection?.saveData ||
  (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

document.body.classList.toggle("low-power", Boolean(lowPowerMode));

scrollButtons.forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    const target = document.querySelector(btn.dataset.scrollTo);
    if (target) {
      const behavior = prefersReducedMotion || lowPowerMode ? "auto" : "smooth";
      target.scrollIntoView({ behavior, block: "start" });
    }
    if (navMenu?.classList.contains("open")) {
      navMenu.classList.remove("open");
      navToggle?.classList.remove("open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });
});

let ticking = false;
const updateScrollVar = () => {
  if (lowPowerMode) return;
  const scrolled = window.scrollY;
  document.body.style.setProperty("--scroll-y", `${scrolled}px`);
};

updateScrollVar();
if (!lowPowerMode) {
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollVar();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
}

navToggle?.addEventListener("click", () => {
  navMenu?.classList.toggle("open");
  navToggle?.classList.toggle("open");
  const isExpanded = navToggle?.classList.contains("open");
  navToggle?.setAttribute("aria-expanded", isExpanded ? "true" : "false");
});

document.getElementById("year").textContent = new Date().getFullYear();

const revealItems = document.querySelectorAll(".reveal");
if (revealItems.length) {
  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "60px" }
    );

    revealItems.forEach((section) => observer.observe(section));
  }
}

window.addEventListener("load", () => {
  const contactForm = document.querySelector(".contact-card");
  if (contactForm) {
    contactForm.addEventListener("submit", () => {
      const submitButton = contactForm.querySelector("button[type='submit']");
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
      }
    });
  }
});

const canvas = document.getElementById("orbitalCanvas");
const shouldAnimateCanvas =
  canvas && window.innerWidth > 768 && !prefersReducedMotion && !lowPowerMode;

if (shouldAnimateCanvas) {
  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  const orbCount = 6;
  const palette = [
    "rgba(42,167,168,0.35)",
    "rgba(255,155,134,0.3)",
    "rgba(243,192,107,0.28)",
    "rgba(31,111,120,0.26)",
  ];

  const orbs = Array.from({ length: orbCount }, () => ({
    x: Math.random(),
    y: Math.random(),
    radius: 70 + Math.random() * 100,
    speed: 0.00025 + Math.random() * 0.0006,
    angle: Math.random() * Math.PI * 2,
    color: palette[Math.floor(Math.random() * palette.length)],
  }));

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  resize();
  let resizeTimeout;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 250);
    },
    { passive: true }
  );

  let animationId;
  let lastFrame = 0;
  let pauseUntil = 0;
  const frameInterval = lowPowerMode ? 60 : 40;
  const render = (timestamp) => {
    if (!lastFrame) lastFrame = timestamp;
    if (timestamp < pauseUntil || timestamp - lastFrame < frameInterval) {
      animationId = requestAnimationFrame(render);
      return;
    }
    lastFrame = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    orbs.forEach((orb) => {
      orb.angle += orb.speed;
      const x = orb.x * window.innerWidth + Math.cos(orb.angle) * 110;
      const y = orb.y * window.innerHeight + Math.sin(orb.angle) * 80;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, orb.radius);
      gradient.addColorStop(0, orb.color);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    animationId = requestAnimationFrame(render);
  };

  const handleVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      lastFrame = 0;
      animationId = requestAnimationFrame(render);
    }
  };

  document.addEventListener("visibilitychange", handleVisibility, {
    passive: true,
  });
  window.addEventListener(
    "scroll",
    () => {
      pauseUntil = performance.now() + 180;
    },
    { passive: true }
  );
  requestAnimationFrame(render);
}
