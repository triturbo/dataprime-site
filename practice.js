const practice = document.querySelector("#practice");

if (practice) {
  const tabList = practice.querySelector(".practice-tabs");
  const tabs = [...tabList.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));

  if (tabs.length && panels.every(Boolean)) {
    function selectPracticeStage(activeIndex) {
      tabs.forEach((tab, index) => {
        const selected = index === activeIndex;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[index].hidden = !selected;
        panels[index].inert = !selected;
      });
      practice.dataset.practiceActive = tabs[activeIndex].dataset.practiceStage;
    }

    panels.forEach((panel, index) => {
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabs[index].id);
      panel.tabIndex = 0;
    });

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectPracticeStage(index));
      tab.addEventListener("keydown", (event) => {
        let nextIndex;
        switch (event.key) {
          case "ArrowRight":
            nextIndex = (index + 1) % tabs.length;
            break;
          case "ArrowLeft":
            nextIndex = (index + tabs.length - 1) % tabs.length;
            break;
          case "Home":
            nextIndex = 0;
            break;
          case "End":
            nextIndex = tabs.length - 1;
            break;
          default:
            return;
        }

        event.preventDefault();
        selectPracticeStage(nextIndex);
        tabs[nextIndex].focus();
      });
    });

    selectPracticeStage(0);
    tabList.hidden = false;
  }
}
