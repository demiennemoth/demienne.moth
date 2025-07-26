document.addEventListener("DOMContentLoaded", () => {
  const words = [
    "whisper", "follow", "echo", "grave", "gone", "error",
    "fade", "lost", "void", "memory"
  ];

  function spawnWord() {
    const word = document.createElement('div');
    word.className = 'word';
    word.textContent = words[Math.floor(Math.random() * words.length)];
    word.style.left = Math.random() * 100 + 'vw';
    word.style.animationDuration = (6 + Math.random() * 6) + 's';
    Object.assign(word.style, {
      position: 'absolute',
      color: 'rgba(240,240,240,0.1)',
      fontFamily: "'UnifrakturCook', cursive",
      fontSize: 'calc(16px + 0.5vw)',
      animation: 'fall linear infinite',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
      textShadow: '0 0 3px #888',
      zIndex: '0',
      top: '-60px'
    });
    document.body.appendChild(word);
    setTimeout(() => word.remove(), 16000);
  }

  setInterval(spawnWord, 350);

  const style = document.createElement('style');
  style.innerHTML = `
  @keyframes fall {
    0% {
      transform: translateX(0) rotate(0deg);
      opacity: 0.1;
    }
    100% {
      transform: translateX(30px) rotate(1deg);
      top: 100vh;
      opacity: 0.2;
    }
  }`;
  document.head.appendChild(style);
});