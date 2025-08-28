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

  This function handles the dynamic album system. Albums open on click (desktop
  and mobile). Once open, the images of the selected album are displayed in a
  horizontal slider similar to a phone gallery. Users can swipe (on touch
  devices) or use arrow buttons / keyboard (on desktop) to navigate between
  images. Tapping or clicking an image opens it in a zoom overlay.
*/
function initLookbookAlbums() {
  const albumOverlay = document.getElementById('album-overlay');
  // The slider container that will host the slide wrapper and navigation arrows
  const albumSlider = albumOverlay ? albumOverlay.querySelector('.album-slider') : null;
  const zoomOverlay = document.getElementById('zoom-overlay');
  const closeBtn = albumOverlay ? albumOverlay.querySelector('.close-overlay') : null;

      
  // Define albums: the first image is the cover but is still included in the gallery
  const albums = {
    album1: [
      'lookbook5.jpeg',
      'lookbook1.jpg',
      'lookbook2.jpg',
      // Newly added lifestyle photos
      'lifestyle1.jpg',
      'lifestyle2.jpg',
      'lifestyle3.jpg',
      'lifestyle4.jpg',
      // Apparel shots: white front/back then black front/back
      'white_front.jpg',
      'white_back.jpg',
      'black_front.jpg',
      'black_back.jpg'
    ],
    album2: ['lookbook4.jpg'],
    album3: ['lookbook3.jpg']
  };

  // Albums that are disabled (coming soon)
  const disabledAlbums = ['album2', 'album3'];

  let currentImages = [];
  let currentIndex = 0;
  let touchStartX = null;

  // Utility: detect touch devices
  function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  // Show a specific slide by updating transform
  function showSlide(index) {
    if (!albumSlider) return;
    const wrapper = albumSlider.querySelector('.slide-wrapper');
    if (!wrapper) return;
    currentIndex = (index + currentImages.length) % currentImages.length;
    const translateX = -currentIndex * 100;
    wrapper.style.transform = `translateX(${translateX}%)`;
  }

  // Navigate to previous and next slides
  function prevSlide() {
    showSlide(currentIndex - 1);
  }
  function nextSlide() {
    showSlide(currentIndex + 1);
  }

  // Open the zoom overlay with a given image
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

  // Render the slider for the currently selected album
  function renderSlider() {
    if (!albumSlider) return;
    albumSlider.innerHTML = '';
    if (currentImages.length === 0) return;
    // Create wrapper to hold slides
    const wrapper = document.createElement('div');
    wrapper.className = 'slide-wrapper';
    currentImages.forEach((src) => {
      const img = document.createElement('img');
      img.src = src;
      // Zoom on click/tap
      img.addEventListener('click', () => {
        openZoom(src);
      });
      // For mobile, pinch zoom isn't implemented; tapping suffices
      wrapper.appendChild(img);
    });
    albumSlider.appendChild(wrapper);
    // Add navigation arrows for desktop if more than one image
    if (currentImages.length > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'prev-slide';
      prevBtn.innerHTML = '&#10094;';
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        prevSlide();
      });
      const nextBtn = document.createElement('button');
      nextBtn.className = 'next-slide';
      nextBtn.innerHTML = '&#10095;';
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        nextSlide();
      });
      // Only show arrows on desktop
      if (!isTouchDevice()) {
        albumSlider.appendChild(prevBtn);
        albumSlider.appendChild(nextBtn);
      }
    }
    // Set up touch swipe for mobile navigation
    wrapper.addEventListener('touchstart', (e) => {
      if (!isTouchDevice()) return;
      touchStartX = e.touches[0].clientX;
    });
    wrapper.addEventListener('touchmove', (e) => {
      if (!isTouchDevice()) return;
      if (touchStartX === null) return;
      const deltaX = e.touches[0].clientX - touchStartX;
      // Minimal horizontal threshold for slide change
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          prevSlide();
        } else {
          nextSlide();
        }
        touchStartX = e.touches[0].clientX;
      }
    });
    wrapper.addEventListener('touchend', () => {
      touchStartX = null;
    });
    // Initially show the first slide
    showSlide(0);
  }

  // Open an album (if not disabled) and render its images
  function openAlbum(key) {
    if (disabledAlbums.includes(key)) return;
    currentImages = albums[key] ? [...albums[key]] : [];
    currentIndex = 0;
    if (albumOverlay) {
      albumOverlay.classList.add('active');
    }
    renderSlider();
  }

  // Close album overlay
  function closeAlbum() {
    albumOverlay && albumOverlay.classList.remove('active');
  }

  // Add event listeners to album covers
  const albumEls = document.querySelectorAll('.album');
  albumEls.forEach((albumEl) => {
    const key = albumEl.dataset.album;
    if (!key) return;
    const isDisabled = disabledAlbums.includes(key);
    // Do nothing for disabled albums
    if (isDisabled) return;
    // For both mobile and desktop, use click to open album.
    albumEl.addEventListener('click', (e) => {
      e.preventDefault();
      openAlbum(key);
    });
    // On touch devices, also bind touchend to open immediately and prevent the delayed click
    albumEl.addEventListener('touchend', (e) => {
      if (!isTouchDevice()) return;
      e.preventDefault();
      openAlbum(key);
    });
  });

  // Close overlay when clicking the close button or outside of slider
  closeBtn && closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAlbum();
  });
  albumOverlay && albumOverlay.addEventListener('click', (e) => {
    if (e.target === albumOverlay) {
      closeAlbum();
    }
  });
  // Close zoom overlay on click
  zoomOverlay && zoomOverlay.addEventListener('click', () => {
    closeZoom();
  });
  // Keyboard navigation for desktop
  document.addEventListener('keydown', (e) => {
    if (!albumOverlay || !albumOverlay.classList.contains('active')) return;
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  });
}
