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

    // Apply a lightweight parallax effect on the hero background when
    // scrolling. This improves interactivity on mobile devices by
    // updating the background position based on the scroll offset.
    const heroSection = document.getElementById('hero');
    if (heroSection) {
      window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        // Move the background at a slower rate (0.3) than the scroll for parallax.
        heroSection.style.backgroundPositionY = `${scrollTop * 0.3}px`;
      });
    }

    // Initialise interactive lookbook albums
    initLookbookAlbums();
  });
})();

/*
  Interactive lookbook implementation

  This function handles the dynamic album system. Albums open on hover (desktop)
  or long press (mobile). Once open, the images of the selected album are
  arranged around a circle and can be navigated by moving horizontally
  (mouse or swipe). Images orbit around the center rather than spinning on
  their own axes. Clicking (desktop) or swiping upward (mobile) zooms into
  the current image. A small tutorial overlay guides mobile users.
*/
function initLookbookAlbums() {
  const albumOverlay = document.getElementById('album-overlay');
  const albumContainer = albumOverlay ? albumOverlay.querySelector('.album-container') : null;
  const zoomOverlay = document.getElementById('zoom-overlay');
  const closeBtn = albumOverlay ? albumOverlay.querySelector('.close-overlay') : null;

  // Define albums: the first image is the cover but is still included in the gallery.
  const albums = {
    album1: ['lookbook5.jpeg', 'lookbook1.jpg', 'lookbook2.jpg'],
    album2: ['lookbook4.jpg'],
    album3: ['lookbook3.jpg']
  };

  // List of albums marked as coming soon / disabled
  const disabledAlbums = ['album2', 'album3'];

  let currentImages = [];
  let offset = 0;
  let touchStartX = null;
  let touchStartY = null;
  let longPressTimer = null;

  // Helper to check for touch devices
  function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  // Render images in orbit based on the current offset
  function renderImages() {
    if (!albumContainer) return;
    albumContainer.innerHTML = '';
    const n = currentImages.length;
    if (n === 0) return;
    // radius based on container size and image size (35% -> half width is 17.5%)
    const radius = albumContainer.clientWidth / 2 - (albumContainer.clientWidth * 0.175);
    for (let i = 0; i < n; i++) {
      const imgSrc = currentImages[i];
      // compute angle (offset reversed for intuitive direction)
      const angle = ((i + offset) / n) * 2 * Math.PI;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const imgEl = document.createElement('img');
      imgEl.src = imgSrc;
      imgEl.className = 'album-image';
      // center at 50/50 then translate
      imgEl.style.left = '50%';
      imgEl.style.top = '50%';
      imgEl.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      // Zoom on click for desktop
      imgEl.addEventListener('click', (e) => {
        if (isTouchDevice()) return;
        openZoom(imgSrc);
        e.stopPropagation();
      });
      // Zoom on tap for mobile (touchend on the image)
      imgEl.addEventListener('touchend', (e) => {
        if (!isTouchDevice()) return;
        // Prevent this touchend from bubbling up and interfering with container events
        e.stopPropagation();
        openZoom(imgSrc);
      });
      albumContainer.appendChild(imgEl);
    }
  }

  // Rotate images left (-1) or right (+1)
  function rotate(dir) {
    if (!currentImages.length) return;
    // direction sign: positive dir rotates forward; adjust offset accordingly
    offset = (offset + dir + currentImages.length) % currentImages.length;
    renderImages();
  }

  // Open the zoom overlay
  function openZoom(src) {
    if (!zoomOverlay) return;
    zoomOverlay.innerHTML = '';
    const img = document.createElement('img');
    img.src = src;
    zoomOverlay.appendChild(img);
    zoomOverlay.classList.add('active');
  }

  function closeZoom() {
    zoomOverlay && zoomOverlay.classList.remove('active');
  }

  // Open selected album
  function openAlbum(key) {
    // Do nothing if album is disabled
    if (disabledAlbums.includes(key)) return;
    currentImages = albums[key] ? [...albums[key]] : [];
    offset = 0;
    // Ensure the overlay is visible before positioning images so that
    // container dimensions are available. Otherwise images will stack.
    if (albumOverlay) albumOverlay.classList.add('active');
    // Render images after a short delay (next event loop) to let layout compute
    setTimeout(() => {
      renderImages();
    }, 20);
  }

  // Close overlay
  function closeAlbum() {
    albumOverlay && albumOverlay.classList.remove('active');
  }

  // Add event listeners to album covers
  const albumEls = document.querySelectorAll('.album');
  albumEls.forEach((albumEl) => {
    const key = albumEl.dataset.album;
    if (!key) return;
    // Desktop: open on hover
    // Skip adding interactions for disabled albums
    const isDisabled = disabledAlbums.includes(key);
    // Desktop: open on hover
    albumEl.addEventListener('mouseenter', () => {
      if (isDisabled) return;
      if (isTouchDevice()) return;
      openAlbum(key);
    });
    // Mobile: long press for 2 seconds
    albumEl.addEventListener('touchstart', () => {
      if (isDisabled) return;
      if (!isTouchDevice()) return;
      longPressTimer = setTimeout(() => {
        openAlbum(key);
      }, 2000);
    });
    albumEl.addEventListener('touchend', () => {
      if (!isTouchDevice()) return;
      clearTimeout(longPressTimer);
    });
    albumEl.addEventListener('touchmove', () => {
      if (!isTouchDevice()) return;
      clearTimeout(longPressTimer);
    });
  });

  // Close overlay on clicking the close button
  closeBtn && closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAlbum();
  });
  // Close overlay when clicking outside the container
  albumOverlay && albumOverlay.addEventListener('click', (e) => {
    if (e.target === albumOverlay) {
      closeAlbum();
    }
  });

  // Close zoom overlay on click
  zoomOverlay && zoomOverlay.addEventListener('click', () => {
    closeZoom();
  });

  // Desktop navigation: rotate on mouse move
  if (albumContainer) {
    let lastMoveTime = 0;
    albumContainer.addEventListener('mousemove', (e) => {
      if (isTouchDevice()) return;
      const now = Date.now();
      // throttle rotations to avoid rapid spinning
      if (now - lastMoveTime < 200) return;
      lastMoveTime = now;
      const rect = albumContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const center = rect.width / 2;
      // Determine direction by comparing to center
      if (x > center + rect.width * 0.15) {
        rotate(-1);
      } else if (x < center - rect.width * 0.15) {
        rotate(1);
      }
    });

    // Mobile navigation: horizontal swipe rotates; upward swipe zooms
    albumContainer.addEventListener('touchstart', (e) => {
      if (!isTouchDevice()) return;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    });
    albumContainer.addEventListener('touchmove', (e) => {
      if (!isTouchDevice()) return;
      if (touchStartX === null || touchStartY === null) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      // Horizontal swipe triggers rotation
      if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 40) {
        if (deltaX > 0) {
          rotate(-1);
        } else {
          rotate(1);
        }
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      }
    });
    albumContainer.addEventListener('touchend', () => {
      touchStartX = null;
      touchStartY = null;
    });
  }
}