const study = document.querySelector(".study");
const viewControls = study.querySelector(".view-controls");
const assembly = study.querySelector(".assembly-view");
const section = study.querySelector(".section-view");
const viewButtons = [...viewControls.querySelectorAll("button")];

viewControls.addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;

  const showSection = button.dataset.view === "section";
  section.hidden = !showSection;
  assembly.hidden = showSection;
  viewButtons.forEach((option) =>
    option.setAttribute("aria-pressed", String(option === button)),
  );
});
viewControls.hidden = false;

const inspectionMotion = window.matchMedia(
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
);
study.addEventListener("pointermove", (event) => {
  if (!inspectionMotion.matches || assembly.hidden) return;
  const bounds = study.getBoundingClientRect();
  study.style.setProperty(
    "--study-x",
    `${(0.5 - (event.clientX - bounds.left) / bounds.width) * 2}%`,
  );
  study.style.setProperty(
    "--study-y",
    `${(0.5 - (event.clientY - bounds.top) / bounds.height) * 2}%`,
  );
});
study.addEventListener("pointerleave", () => {
  study.style.removeProperty("--study-x");
  study.style.removeProperty("--study-y");
});

const marketClocks = [...document.querySelectorAll("time[data-zone]")].map(
  (element) => ({
    element,
    format: new Intl.DateTimeFormat("en-GB", {
      timeZone: element.dataset.zone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }),
  }),
);

let clockTimer;
function refreshClocks() {
  clearTimeout(clockTimer);
  if (document.hidden) return;
  const now = new Date();
  for (const { element, format } of marketClocks) {
    element.textContent = format.format(now);
    element.dateTime = now.toISOString();
  }
  document.querySelector(".clock-strip").hidden = false;
  clockTimer = setTimeout(refreshClocks, 60000 - (now.getTime() % 60000));
}
document.addEventListener("visibilitychange", refreshClocks);
refreshClocks();
