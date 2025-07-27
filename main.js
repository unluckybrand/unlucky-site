/*
  Main JavaScript for the (un)lucky one‑page site

  Handles:
  – Generating random philosophy phrases in the concept section
  – Observing elements with the `.fade-in` class to trigger
    animations when they come into view
*/

(function () {
  // Array of inspirational phrases reflecting the (un)lucky philosophy
  const phrases = [
    'La fortuna è un’arte, non un dono.',
    'Ogni scelta scolpisce il tuo destino.',
    'L’errore è il tuo maestro.',
    'Il coraggio crea opportunità.',
    'Il rischio è la scintilla della fortuna.',
    'Non aspettare, crea la tua strada.',
    'La fortuna ama gli audaci.',
    'Sbaglia, impara, rialzati.',
    'Il cambiamento è la vera costante.',
    'Coltiva la tua unicità.'
  ];

  function getRandomPhrase() {
    const index = Math.floor(Math.random() * phrases.length);
    return phrases[index];
  }

  function initPhraseGenerator() {
    const button = document.getElementById('generate-phrase');
    const display = document.getElementById('phrase-display');
    if (!button || !display) return;
    button.addEventListener('click', () => {
      const phrase = getRandomPhrase();
      display.textContent = phrase;
      // reset opacity for fade effect
      display.style.opacity = 0;
      // force reflow to restart transition
      void display.offsetWidth;
      display.style.opacity = 1;
    });
  }

  function initIntersectionAnimations() {
    const items = document.querySelectorAll('.fade-in');
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    items.forEach((item) => observer.observe(item));
  }

  // Fallback: after a delay, ensure all fade‑in elements become visible in case
  // the IntersectionObserver fails (e.g. on very old browsers or if the
  // observer is disconnected). This prevents elements from staying hidden.
  setTimeout(() => {
    const remaining = document.querySelectorAll('.fade-in:not(.visible)');
    remaining.forEach((el) => el.classList.add('visible'));
  }, 1500);

  document.addEventListener('DOMContentLoaded', () => {
    initPhraseGenerator();
    initIntersectionAnimations();
  });
})();