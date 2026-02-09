/* ============================================
   OUTDUN PRODUCTIONS - Main JavaScript
   ============================================ */

// --- Nav Scroll Effect (debounced) ---
const nav = document.querySelector('.nav');
if (nav) {
  let navTicking = false;
  window.addEventListener('scroll', () => {
    if (!navTicking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 50) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
        navTicking = false;
      });
      navTicking = true;
    }
  });
}

// --- Mobile Navigation Toggle ---
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.classList.toggle('menu-open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.classList.remove('menu-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// --- Back to Top Button (debounced) ---
const backToTop = document.createElement('button');
backToTop.className = 'back-to-top';
backToTop.setAttribute('aria-label', 'Back to top');
backToTop.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg>';
document.body.appendChild(backToTop);

let bttTicking = false;
window.addEventListener('scroll', () => {
  if (!bttTicking) {
    requestAnimationFrame(() => {
      if (window.scrollY > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
      bttTicking = false;
    });
    bttTicking = true;
  }
});

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// --- Scroll Fade-In Animation ---
const fadeElements = document.querySelectorAll('.fade-in');

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
};

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

fadeElements.forEach(el => fadeObserver.observe(el));

// --- Video Thumbnail Click-to-Play (YouTube IFrame API - Lazy Loaded) ---
var ytApiReady = false;
var ytApiLoading = false;
var pendingPlayers = [];

function loadYouTubeAPI() {
  if (ytApiLoading || ytApiReady) return;
  ytApiLoading = true;
  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

window.onYouTubeIframeAPIReady = function() {
  ytApiReady = true;
  pendingPlayers.forEach(function(fn) { fn(); });
  pendingPlayers = [];
};

var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
var playerCount = 0;
var activePlayers = [];

document.querySelectorAll('.video-card__thumb').forEach(thumb => {
  thumb.addEventListener('click', () => {
    const videoId = thumb.dataset.video;
    const embed = thumb.closest('.video-card__embed');
    const videoTitle = thumb.closest('.video-card').querySelector('.video-card__title');
    if (typeof gtag === 'function') {
      gtag('event', 'video_play', {
        video_id: videoId,
        video_title: videoTitle ? videoTitle.textContent : videoId
      });
    }
    const playerDiv = document.createElement('div');
    playerCount++;
    playerDiv.id = 'yt-player-' + playerCount;
    thumb.style.display = 'none';
    embed.appendChild(playerDiv);

    loadYouTubeAPI();

    function createPlayer() {
      activePlayers.forEach(function(p) {
        try { p.pauseVideo(); } catch(e) {}
      });

      var player = new YT.Player(playerDiv.id, {
        host: 'https://www.youtube-nocookie.com',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          mute: isMobile ? 1 : 0
        },
        events: {
          onReady: function(event) {
            activePlayers.forEach(function(p) {
              try { p.pauseVideo(); } catch(e) {}
            });
            activePlayers.push(player);
            event.target.playVideo();
            if (isMobile) {
              var unmuteBtn = document.createElement('button');
              unmuteBtn.className = 'video-unmute';
              unmuteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg> Tap to unmute';
              embed.appendChild(unmuteBtn);
              unmuteBtn.addEventListener('click', function() {
                player.unMute();
                player.setVolume(100);
                unmuteBtn.remove();
              });
            }
          },
          onStateChange: (function() {
            var endTimer = null;
            return function(event) {
              if (event.data === YT.PlayerState.PLAYING) {
                clearTimeout(endTimer);
                var duration = player.getDuration();
                var current = player.getCurrentTime();
                var remaining = (duration - current - 0.5) * 1000;
                if (remaining > 0) {
                  endTimer = setTimeout(function() {
                    activePlayers = activePlayers.filter(function(p) { return p !== player; });
                    var iframe = player.getIframe();
                    player.destroy();
                    if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
                    thumb.style.display = '';
                  }, remaining);
                }
              } else {
                clearTimeout(endTimer);
              }
            };
          })()
        }
      });
    }

    if (ytApiReady) {
      createPlayer();
    } else {
      pendingPlayers.push(createPlayer);
    }
  });
});

// --- Contact Form Handling (Formspree) ---
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

if (contactForm && formStatus) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = contactForm.querySelector('.form-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Sending...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        formStatus.textContent = 'Message sent successfully! We\'ll get back to you soon.';
        formStatus.className = 'form-status form-status--success';
        if (typeof gtag === 'function') {
          gtag('event', 'form_submission', {
            form_name: 'contact',
            project_type: contactForm.querySelector('#project-type').value || 'not specified'
          });
        }
        contactForm.reset();
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      formStatus.textContent = 'Something went wrong. Please email us directly at info@outdunproductions.com';
      formStatus.className = 'form-status form-status--error';
    }

    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  });
}
