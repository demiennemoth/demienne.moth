// Chatbot: 'I heard you.'
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
  input.placeholder = 'Speak, freak';
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

  // Whispers on hover (titles)
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
});
