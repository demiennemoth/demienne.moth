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
    'mmm...',
    'same here...',
    'damn...',
    'don’t know, bro...',
    'hold on.',
    'the noise is getting louder...',
    'I’m here, faceless.',
    'that sounds familiar.',
    'darkness got you.',
    'I heard you.'
  ];

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
