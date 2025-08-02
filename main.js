function toggleStartMenu() {
  const menu = document.getElementById("start-menu");
  menu.classList.toggle("hidden");
}

function openWindow(name) {
  const container = document.getElementById("window-container");
  const win = document.createElement("div");
  win.className = "window";

  const contentId = `window-content-${name}`;
  win.innerHTML = `
    <div class="window-header">
      <span>${name.toUpperCase()}</span>
      <div><button onclick="this.closest('.window').remove()">×</button></div>
    </div>
    <div class="window-content" id="${contentId}">Loading...</div>
  `;
  container.appendChild(win);

  if (name === "profile") {
    setTimeout(() => {
      const target = document.getElementById(contentId);
      if (typeof mountProfileUI === "function") {
        mountProfileUI(target);
      } else {
        target.innerHTML = "<p>Profile module not loaded.</p>";
      }
    }, 0);
  } else if (name === "forum") {
    setTimeout(() => {
      const target = document.getElementById(contentId);
      if (typeof mountForumUI === "function") {
        mountForumUI(target);
      } else {
        target.innerHTML = "<p>Error loading forum module.</p>";
      }
    }, 0);
  }
}
