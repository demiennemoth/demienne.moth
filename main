function toggleStartMenu() {
  const menu = document.getElementById("start-menu");
  menu.classList.toggle("hidden");
}

function openWindow(name) {
  const container = document.getElementById("window-container");
  const win = document.createElement("div");
  win.className = "window";
  win.innerHTML = `
    <div class="window-header">
      <span>${name.toUpperCase()}</span>
      <div>
        <button onclick="this.closest('.window').remove()">×</button>
      </div>
    </div>
    <div class="window-content">Content for ${name} window.</div>
  `;
  container.appendChild(win);
}
