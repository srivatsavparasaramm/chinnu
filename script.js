/* ==========================================================================
   UNCERTAIN. — JavaScript Logic & Interactions
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const pageHome = document.getElementById('page-home');
  const pageSecret = document.getElementById('page-secret');
  const pageFinal = document.getElementById('page-final');
  
  const btnStart = document.getElementById('btn-start');
  const secretForm = document.getElementById('secret-form');
  const secretInput = document.getElementById('secret-input');
  const secretError = document.getElementById('secret-error');
  const secretCard = document.querySelector('.secret-card');
  const hintClickable = document.getElementById('hint-clickable');
  const musicToggle = document.getElementById('music-toggle');
  
  const CORRECT_ANSWER = 'chinnuu';
  
  // ==========================================
  // PAGE NAVIGATION LOGIC
  // ==========================================

  function switchPage(fromPage, toPage) {
    fromPage.classList.remove('active');
    
    setTimeout(() => {
      toPage.classList.add('active');
      
      // Auto-focus input if entering secret page
      if (toPage === pageSecret) {
        secretInput.focus();
      }
      
      // Scroll to top of final page container when transitioning
      if (toPage === pageFinal) {
        pageFinal.scrollTop = 0;
      }
    }, 400);
  }

  // Event: Click "Click Here" on Home Page
  btnStart.addEventListener('click', () => {
    switchPage(pageHome, pageSecret);
    if (!isMusicPlaying) {
      userInteracted = true;
      playRomanticMusic();
    }
  });

  // Event: Click on Hint badge auto-fills input
  if (hintClickable) {
    hintClickable.addEventListener('click', () => {
      secretInput.value = CORRECT_ANSWER;
      secretInput.focus();
      if (secretError.classList.contains('visible')) {
        secretError.classList.remove('visible');
      }
    });
  }

  // Event: Submit secret code
  function handleSecretSubmit() {
    const userInput = secretInput.value.trim().toLowerCase();

    if (userInput === CORRECT_ANSWER) {
      // Success! Move to final page
      secretError.classList.remove('visible');
      secretError.textContent = '';
      switchPage(pageSecret, pageFinal);
      createHeartSurge();
    } else {
      // Wrong answer
      secretError.textContent = 'Not quite... maybe think a little more. ♡';
      secretError.classList.add('visible');
      
      // Trigger card shake
      secretCard.classList.remove('shake');
      // Trigger reflow to restart animation
      void secretCard.offsetWidth;
      secretCard.classList.add('shake');
      
      secretInput.select();
    }
  }

  secretForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSecretSubmit();
  });

  // Clear error message on input change
  secretInput.addEventListener('input', () => {
    if (secretError.classList.contains('visible')) {
      secretError.classList.remove('visible');
    }
  });

  // ==========================================
  // AMBIENT PARTICLES & FLOATING HEARTS CANVAS
  // ==========================================

  const canvas = document.getElementById('ambient-canvas');
  const ctx = canvas.getContext('2d');

  let width, height;
  let particles = [];

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor(isHeart = false) {
      this.reset(isHeart);
    }

    reset(isHeart = Math.random() < 0.35) {
      this.x = Math.random() * width;
      this.y = height + Math.random() * 50;
      this.speedY = 0.3 + Math.random() * 0.7;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.size = isHeart ? (8 + Math.random() * 12) : (1.5 + Math.random() * 2.5);
      this.opacity = 0.15 + Math.random() * 0.5;
      this.fadeSpeed = 0.001 + Math.random() * 0.003;
      this.isHeart = isHeart;
      this.oscillation = Math.random() * Math.PI * 2;
      this.oscillationSpeed = 0.01 + Math.random() * 0.02;
    }

    update() {
      this.y -= this.speedY;
      this.oscillation += this.oscillationSpeed;
      this.x += Math.sin(this.oscillation) * 0.5 + this.speedX;

      if (this.y < -30 || this.opacity <= 0) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;

      if (this.isHeart) {
        ctx.font = `${this.size}px serif`;
        ctx.fillStyle = '#ff85a2';
        ctx.shadowColor = '#ff85a2';
        ctx.shadowBlur = 8;
        ctx.fillText('♡', this.x, this.y);
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = '#f4abbf';
        ctx.shadowColor = '#ff85a2';
        ctx.shadowBlur = 6;
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // Initialize particles
  const particleCount = Math.min(50, Math.floor(window.innerWidth / 25));
  for (let i = 0; i < particleCount; i++) {
    const p = new Particle();
    p.y = Math.random() * height; // Pre-fill screen
    particles.push(p);
  }

  function animateCanvas() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animateCanvas);
  }

  animateCanvas();

  // Burst of extra hearts on unlock
  function createHeartSurge() {
    for (let i = 0; i < 25; i++) {
      const p = new Particle(true);
      p.y = height * 0.8 + Math.random() * (height * 0.2);
      p.opacity = 0.7 + Math.random() * 0.3;
      p.speedY = 1.2 + Math.random() * 1.5;
      particles.push(p);
    }
    // Limit array size over time
    setTimeout(() => {
      if (particles.length > particleCount) {
        particles.splice(particleCount);
      }
    }, 8000);
  }

  // Elements
  const musicPlayerWidget = document.getElementById('music-player-widget');
  const musicToggle = document.getElementById('music-toggle');
  const musicIcon = document.getElementById('music-icon');
  const musicBars = document.getElementById('music-bars');
  const musicStatus = document.getElementById('music-status');
  const romanticAudio = document.getElementById('romantic-audio');

  // ==========================================
  // ROMANTIC MUSIC & AUTOPLAY SYSTEM
  // ==========================================

  let isMusicPlaying = false;
  let audioCtx = null;
  let synthInterval = null;
  let synthGainNode = null;
  let userInteracted = false;

  // Initialize Web Audio Context on gesture if needed
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Romantic Piano Synthesizer (Zero-latency fallback / ambient layer)
  function startRomanticSynth() {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (synthGainNode) return; // Already running

    synthGainNode = ctx.createGain();
    synthGainNode.gain.setValueAtTime(0.01, ctx.currentTime);
    synthGainNode.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 2);

    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.setValueAtTime(550, ctx.currentTime);

    synthGainNode.connect(masterFilter);
    masterFilter.connect(ctx.destination);

    // Emotional romantic arpeggio notes (D, F#, A, B, E, C#)
    const romanticChords = [
      [146.83, 220.00, 293.66, 369.99, 440.00], // D Maj
      [110.00, 164.81, 220.00, 277.18, 329.63], // A Maj
      [123.47, 185.00, 246.94, 293.66, 369.99], // B Min
      [98.00,  146.83, 196.00, 246.94, 293.66], // G Maj
    ];

    let chordIndex = 0;
    let step = 0;

    function playPianoNote(freq, time, duration = 1.6) {
      if (!synthGainNode || !audioCtx) return;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq * 1.001, time); // Subtle romantic chorus

      noteGain.gain.setValueAtTime(0.001, time);
      noteGain.gain.exponentialRampToValueAtTime(0.12, time + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc1.connect(noteGain);
      osc2.connect(noteGain);
      noteGain.connect(synthGainNode);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + duration);
      osc2.stop(time + duration);
    }

    function tick() {
      if (!isMusicPlaying) return;
      const currentChord = romanticChords[chordIndex];
      const noteFreq = currentChord[step % currentChord.length];
      const now = ctx.currentTime;

      playPianoNote(noteFreq, now, 2.0);

      // Play soft bass root on step 0
      if (step === 0) {
        playPianoNote(currentChord[0] / 2, now, 3.2);
      }

      step++;
      if (step >= 4) {
        step = 0;
        chordIndex = (chordIndex + 1) % romanticChords.length;
      }
    }

    tick();
    synthInterval = setInterval(tick, 750);
  }

  function stopRomanticSynth() {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
    if (synthGainNode && audioCtx) {
      synthGainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
      setTimeout(() => {
        if (synthGainNode) {
          synthGainNode.disconnect();
          synthGainNode = null;
        }
      }, 850);
    }
  }

  function updateWidgetUI(playing, statusText) {
    isMusicPlaying = playing;
    if (playing) {
      if (musicPlayerWidget) musicPlayerWidget.classList.add('playing');
      if (musicBars) musicBars.classList.add('active');
      if (musicIcon) musicIcon.textContent = '🎵';
      if (musicStatus) musicStatus.textContent = statusText || 'Playing ♡';
    } else {
      if (musicPlayerWidget) musicPlayerWidget.classList.remove('playing');
      if (musicBars) musicBars.classList.remove('active');
      if (musicIcon) musicIcon.textContent = '🔇';
      if (musicStatus) musicStatus.textContent = statusText || 'Paused';
    }
  }

  // Play romantic music (both HTML5 Audio and Synthesizer fallback)
  function playRomanticMusic() {
    if (isMusicPlaying) return;

    if (romanticAudio) {
      romanticAudio.volume = 0.45;
      const playPromise = romanticAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            updateWidgetUI(true, 'Playing ♡');
          })
          .catch(() => {
            // If HTML5 audio is restricted/fails, start romantic synth
            getAudioContext();
            startRomanticSynth();
            updateWidgetUI(true, 'Playing ♡');
          });
      }
    } else {
      getAudioContext();
      startRomanticSynth();
      updateWidgetUI(true, 'Playing ♡');
    }
  }

  function pauseRomanticMusic() {
    if (romanticAudio) {
      try {
        romanticAudio.pause();
      } catch (e) {}
    }
    stopRomanticSynth();
    updateWidgetUI(false, 'Paused');
  }

  function toggleRomanticMusic() {
    if (isMusicPlaying) {
      pauseRomanticMusic();
    } else {
      getAudioContext();
      playRomanticMusic();
    }
  }

  // Autoplay handler with graceful interaction fallback
  function setupAutoplay() {
    if (!romanticAudio) return;

    romanticAudio.volume = 0.45;
    const initialPlay = romanticAudio.play();

    if (initialPlay !== undefined) {
      initialPlay
        .then(() => {
          // Autoplay succeeded right away!
          updateWidgetUI(true, 'Playing ♡');
        })
        .catch((err) => {
          // Autoplay blocked by browser policy until first interaction
          updateWidgetUI(false, 'Tap to play ♡');

          const startAudioOnFirstTouch = () => {
            if (!userInteracted) {
              userInteracted = true;
              getAudioContext();
              playRomanticMusic();
            }
            // Clean up event listeners
            window.removeEventListener('click', startAudioOnFirstTouch);
            window.removeEventListener('touchstart', startAudioOnFirstTouch);
            window.removeEventListener('keydown', startAudioOnFirstTouch);
          };

          window.addEventListener('click', startAudioOnFirstTouch, { passive: true });
          window.addEventListener('touchstart', startAudioOnFirstTouch, { passive: true });
          window.addEventListener('keydown', startAudioOnFirstTouch, { passive: true });
        });
    }
  }

  // Click on widget toggles music
  if (musicPlayerWidget) {
    musicPlayerWidget.addEventListener('click', (e) => {
      e.stopPropagation();
      userInteracted = true;
      toggleRomanticMusic();
    });

    musicPlayerWidget.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        userInteracted = true;
        toggleRomanticMusic();
      }
    });
  }

  // Start autoplay immediately
  setupAutoplay();
});
