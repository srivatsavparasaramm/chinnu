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
  
  // Audio state (Web Audio API Synthesizer)
  let audioCtx = null;
  let isPlayingSound = false;
  let synthNodes = [];

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
    initAudioOnUserGesture();
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

  // ==========================================
  // OPTIONAL AMBIENT AUDIO SYNTHESIZER
  // ==========================================

  function initAudioOnUserGesture() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playAmbientTone() {
    if (!audioCtx) initAudioOnUserGesture();
    if (!audioCtx) return;

    if (isPlayingSound) {
      stopAmbientTone();
      return;
    }

    try {
      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 3);

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, audioCtx.currentTime);

      // Warm chord notes (Fmaj7 / Am frequencies: A3, C4, E4, G4)
      const freqs = [220, 261.63, 329.63, 392.00];

      synthNodes = freqs.map((freq, index) => {
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        // LFO for slow dreamy shimmer
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 0.1 + index * 0.05;
        lfoGain.gain.value = 1.5;
        lfo.connect(osc.frequency);
        lfo.start();

        const oscGain = audioCtx.createGain();
        oscGain.gain.value = 0.25;

        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();

        return { osc, lfo };
      });

      filter.connect(masterGain);
      masterGain.connect(audioCtx.destination);

      synthNodes.masterGain = masterGain;
      isPlayingSound = true;
      musicToggle.style.boxShadow = '0 0 20px rgba(255, 133, 162, 0.8)';
      musicToggle.style.borderColor = 'var(--pink-accent)';
    } catch (e) {
      console.log('Audio init prevented or unsupported:', e);
    }
  }

  function stopAmbientTone() {
    if (synthNodes.masterGain && audioCtx) {
      synthNodes.masterGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
      setTimeout(() => {
        if (synthNodes.length) {
          synthNodes.forEach(node => {
            try {
              node.osc.stop();
              node.lfo.stop();
            } catch (e) {}
          });
        }
        synthNodes = [];
      }, 1000);
    }
    isPlayingSound = false;
    musicToggle.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    musicToggle.style.borderColor = 'rgba(255, 255, 255, 0.15)';
  }

  musicToggle.addEventListener('click', () => {
    initAudioOnUserGesture();
    playAmbientTone();
  });
});
