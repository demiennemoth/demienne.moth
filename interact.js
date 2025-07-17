console.log("interact.js connected");

// === CURSOR TRAIL EFFECT ===
document.addEventListener('mousemove', (e) => {
  const dot = document.createElement('div');
  dot.className = 'cursor-trail';
  dot.style.left = `${e.clientX}px`;
  dot.style.top = `${e.clientY}px`;
  document.body.appendChild(dot);
  setTimeout(() => dot.remove(), 800);
});

// === CHAT INTERFACE ===
document.addEventListener('DOMContentLoaded', () => {
  const chatBox = document.createElement('div');
  chatBox.className = 'chat-kadabura';

  const portrait = document.createElement('img');
  portrait.src = 'images/char_jester.png';
  portrait.alt = 'chat-portrait';

  const textWindow = document.createElement('div');
  textWindow.className = 'chat-text';

  const message = document.createElement('p');
  message.textContent = '"Do you really want to know?"';

  const respond = document.createElement('button');
  respond.textContent = '🗯 Speak';
  respond.className = 'speak-btn';

  const phrases = [
    "the noise is getting louder...",
    "you looked. now it knows.",
    "this isn’t silence. it’s waiting.",
    "я видел, как ты смотришь в пол.",
    "everything echoes in the void",
    "you’re still breathing. unfortunately.",
    "не пугайся. ты уже мёртв.",
    "I heard you.",
    "am I thinking this or are you?",
    "hope is a glitch."
  ];

  respond.addEventListener('click', () => {
    const reply = phrases[Math.floor(Math.random() * phrases.length)];
    message.textContent = `🤖 ${reply}`;
  });

  textWindow.appendChild(message);
  textWindow.appendChild(respond);
  chatBox.appendChild(portrait);
  chatBox.appendChild(textWindow);

  document.body.appendChild(chatBox);
});
