// Chatbot + Interact Features (English)
document.addEventListener('DOMContentLoaded', () => {
  const chatSection = document.createElement('section');
  chatSection.id = 'chat';
  chatSection.style.padding = '40px';
  chatSection.style.maxWidth = '800px';
  chatSection.style.margin = 'auto';
  chatSection.style.backgroundColor = 'rgba(20, 20, 20, 0.85)';
  chatSection.style.border = '1px solid #333';
  chatSection.style.borderRadius = '6px';

  const title = document.createElement('h2');
  title.textContent = '🤖 Chat: "I heard you"';
  title.style.color = '#c66';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Say something...';
  input.style.width = '80%';
  input.style.padding = '10px';
  input.style.marginRight = '10px';
  input.style.backgroundColor = '#111';
  input.style.color = '#ccc';
  input.style.border = '1px solid #444';

  const button = document.createElement('button');
  button.textContent = '🗯';
  button.style.padding = '10px 15px';
  button.style.backgroundColor = '#222';
  button.style.color = '#eee';
  button.style.border = '1px solid #555';

  const response = document.createElement('p');
  response.style.marginTop = '20px';
  response.style.color = '#aaa';
  response.style.fontStyle = 'italic';

  const phrases = [
    "same here...",
    "the noise is getting louder...",
    "I’m here, faceless.",
    "damn...",
    "hold on.",
    "mmm...",
    "you blinked. it stayed.",
    "don’t know, bro...",
    "everything echoes in the void",
    "I heard you.",
    "who’s talking through me?",
    "am I thinking this or are you?",
    "shadows don’t lie, people do.",
    "this isn’t silence. it’s waiting.",
    "why are the lights still on?",
    "you’re not supposed to be here.",
    "dreams rot quietly in corners",
    "madness never knocks. it lives here.",
    "it’s colder inside than outside.",
    "nothing feels real anymore.",
    "I thought I turned it off.",
    "hope is a glitch.",
    "you’re still breathing. unfortunately.",
    "static comforts me.",
    "you looked. now it knows.",
    "молчи, оно услышит.",
    "не пугайся. ты уже мёртв.",
    "тебя вообще кто-то звал?",
    "тишина — это не покой.",
    "я видел, как ты смотришь в пол.",
    "иногда мне снится, что я реальный.",
    "а ты знал, что я не человек?",
    "всё началось с одного шороха.",
    "зачем ты вернулся сюда?",
    "я не твой голос, просто совпадение.",
    "это не мысли. это шум.",
    "не спи. пока не поздно.",
    "у меня тоже всё дрожит внутри.",
    "ты правда хочешь это услышать?",
    "ещё немного, и он выйдет.",
    "мне нравится, когда ты один.",
    "сейчас он говорит через меня.",
    "это место стало тобой.",
    "не бойся. он уже внутри.",
    "почему ты опять забыл имя?",
    "уже поздно что-то менять.",
    "ты снова перепутал сны с кодом.",
    "я здесь, потому что ты один.",
    "всё было напрасно. кроме этой боли.",
    "ещё немного — и ты вспомнишь."
  ];;

  button.addEventListener('click', () => {
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    response.textContent = `🤖: ${phrase}`;
    input.value = '';
  });

  chatSection.appendChild(title);
  chatSection.appendChild(input);
  chatSection.appendChild(button);
  chatSection.appendChild(response);

  document.body.appendChild(chatSection);

  // Whisper audio on hover
  const whisperAudio = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_69f8415e17.mp3');
  document.querySelectorAll('h2').forEach(h => {
    h.addEventListener('mouseenter', () => {
      whisperAudio.currentTime = 0;
      whisperAudio.play();
    });
  });

  // VHS glitch effect on scroll
  window.addEventListener('scroll', () => {
    document.body.style.filter = 'contrast(1.2) brightness(0.9)';
    setTimeout(() => {
      document.body.style.filter = 'none';
    }, 150);
  });

  // Mini game: Psychosis test
  const quizBtn = document.createElement('button');
  quizBtn.textContent = '🧪 Take the Psychosis Test';
  quizBtn.style.marginTop = '30px';
  quizBtn.style.background = '#111';
  quizBtn.style.color = '#c55';
  quizBtn.style.border = '1px solid #333';
  quizBtn.style.padding = '10px';

  const quizResult = document.createElement('p');
  quizResult.style.color = '#c77';
  quizResult.style.marginTop = '10px';

  const quizOutcomes = [
    'You have an elegant delusion of grandeur. Congrats!',
    'Certified hallucinator.',
    'Mild psychosis with high potential.',
    'Schizotypal brilliance is off the charts.',
    'You’ve been out of your mind for a while — and it shows.'
  ];

  quizBtn.addEventListener('click', () => {
    const result = quizOutcomes[Math.floor(Math.random() * quizOutcomes.length)];
    quizResult.textContent = result;
  });

  chatSection.appendChild(quizBtn);
  chatSection.appendChild(quizResult);

  // Shadow figure hiding game
  const shadow = document.createElement('div');
  shadow.style.width = '40px';
  shadow.style.height = '40px';
  shadow.style.background = 'radial-gradient(circle, #000 0%, transparent 70%)';
  shadow.style.position = 'absolute';
  shadow.style.borderRadius = '50%';
  shadow.style.zIndex = '9999';
  document.body.appendChild(shadow);

  document.addEventListener('click', () => {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    shadow.style.left = `${x}px`;
    shadow.style.top = `${y}px`;
  });

  // Random floating dark quotes
  const darkQuotes = [
    'everything echoes in the void',
    'you are watched, not seen',
    'dreams rot quietly in corners',
    'madness never knocks, it lives here',
    'hope is a glitch',
    'you blinked. it stayed.'
  ];

  setInterval(() => {
    const quote = document.createElement('div');
    quote.textContent = darkQuotes[Math.floor(Math.random() * darkQuotes.length)];
    quote.style.position = 'fixed';
    quote.style.left = `${Math.random() * 80 + 10}%`;
    quote.style.top = `${Math.random() * 80 + 10}%`;
    quote.style.color = '#991111';
    quote.style.fontSize = '12px';
    quote.style.opacity = '0.6';
    quote.style.zIndex = '999';
    quote.style.pointerEvents = 'none';
    document.body.appendChild(quote);
    setTimeout(() => {
      quote.remove();
    }, 5000);
  }, 10000);

  // Tombstone generator
  const graveBtn = document.createElement('button');
  graveBtn.textContent = '⚰ Generate Epitaph';
  graveBtn.style.marginTop = '30px';
  graveBtn.style.background = '#111';
  graveBtn.style.color = '#aaa';
  graveBtn.style.border = '1px solid #333';
  graveBtn.style.padding = '10px';

  const graveText = document.createElement('p');
  graveText.style.color = '#666';
  graveText.style.marginTop = '10px';
  graveText.style.fontStyle = 'italic';

  const epitaphs = [
    'Here lies someone who tried.',
    'Born tired. Died exhausted.',
    'Ctrl+C. Ctrl+V. Ctrl+Alt+Del.',
    'Was it ever real?',
    '404: soul not found.',
    'Finally stopped pretending to be okay.'
  ];

  graveBtn.addEventListener('click', () => {
    const quote = epitaphs[Math.floor(Math.random() * epitaphs.length)];
    graveText.textContent = `🪦 ${quote}`;
  });

  chatSection.appendChild(graveBtn);
  chatSection.appendChild(graveText);
});
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('[data-random]').forEach(el => {
    const x = Math.floor(Math.random() * 90); // %
    const y = Math.floor(Math.random() * 90); // %
    el.style.top = `${y}vh`;
    el.style.left = `${x}vw`;
  });
});
<!-- Добавить в любой раздел сайта, например в main -->
<section id="destruction-game" style="text-align:center; margin-top:50px;">
  <button id="destroyBtn" style="background-color:#110000;color:#ccc;padding:10px 20px;font-size:16px;border:1px solid #330000;cursor:pointer;">
    Разрушь себя
  </button>
</section>

<script>
  const destroyBtn = document.getElementById('destroyBtn');
  let destructionStarted = false;

  destroyBtn.addEventListener('click', () => {
    if (destructionStarted) return;
    destructionStarted = true;
    destroyBtn.disabled = true;

    const elements = [...document.body.querySelectorAll('*:not(script):not(style):not(#destroyBtn):not(#destruction-game)')];
    let i = 0;

    const glitchInterval = setInterval(() => {
      if (i >= elements.length) {
        clearInterval(glitchInterval);
        showFinale();
        return;
      }
      const el = elements[i];
      if (el.tagName === 'IMG') {
        el.style.filter = 'grayscale(100%) blur(3px)';
        el.style.opacity = '0.1';
      } else {
        el.style.transition = 'all 0.4s ease';
        el.style.opacity = '0.1';
        el.style.transform = `translate(${Math.random() * 30 - 15}px, ${Math.random() * 30 - 15}px) rotate(${Math.random() * 10 - 5}deg)`;
        el.style.color = '#222';
        el.style.textShadow = 'none';
      }
      i++;
    }, 100);

    function showFinale() {
      const msg1 = document.createElement('div');
      msg1.innerText = 'you did this.';
      msg1.style = 'position:fixed;top:40%;left:50%;transform:translateX(-50%);font-size:28px;color:#990000;text-shadow:0 0 10px #400000;font-family:monospace;z-index:9999;';

      const msg2 = document.createElement('div');
      msg2.innerText = 'now he can see.';
      msg2.style = 'position:fixed;top:50%;left:50%;transform:translateX(-50%);font-size:20px;color:#770000;font-family:monospace;z-index:9999;';

      const restartBtn = document.createElement('button');
      restartBtn.innerText = 'Restart';
      restartBtn.style = 'position:fixed;top:60%;left:50%;transform:translateX(-50%);padding:10px 20px;background:#220000;color:#ccc;border:1px solid #550000;font-family:monospace;cursor:pointer;z-index:9999;';
      restartBtn.onclick = () => location.reload();

      document.body.appendChild(msg1);
      document.body.appendChild(msg2);
      document.body.appendChild(restartBtn);
    }
  });
</script>

