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
  const musicIcon = document.getElementById('music-icon');
  const musicBars = document.getElementById('music-bars');
  const musicStatus = document.getElementById('music-status');
  const romanticAudio = document.getElementById('romantic-audio');

  // ==========================================
  // ROMANTIC MELODY ENGINE (Web Audio API)
  // Plays a rich, soulful, continuous romantic piano & strings song
  // ==========================================

  let isMusicPlaying = false;
  let audioCtx = null;
  let synthInterval = null;
  let masterGain = null;
  let reverbNode = null;
  let userInteracted = false;

  // Initialize Web Audio Context
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

  // Create an acoustic concert hall reverb impulse response
  function createReverbBuffer(ctx, duration = 2.8, decay = 2.2) {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / rate;
      const factor = Math.exp(-t * decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  // Romantic Grand Piano Note Synthesizer
  function playAcousticPianoNote(ctx, dest, freq, time, duration = 2.5, velocity = 0.8, pan = 0) {
    if (!ctx || !dest || isNaN(freq) || freq <= 0) return;

    // 1. Oscillators: Fundamental + Natural Harmonics
    const oscFund = ctx.createOscillator();
    const oscHarm1 = ctx.createOscillator();
    const oscHarm2 = ctx.createOscillator();
    const oscWarmth = ctx.createOscillator();

    oscFund.type = 'sine';
    oscFund.frequency.setValueAtTime(freq, time);

    oscHarm1.type = 'sine';
    oscHarm1.frequency.setValueAtTime(freq * 2, time);

    oscHarm2.type = 'triangle';
    oscHarm2.frequency.setValueAtTime(freq * 3, time);

    oscWarmth.type = 'sine';
    oscWarmth.frequency.setValueAtTime(freq * 0.5, time); // Sub-octave resonance for deep notes

    // 2. Gain Envelope (Acoustic Piano Decay)
    const noteGain = ctx.createGain();
    const peakVol = Math.min(0.22, 0.05 + velocity * 0.15);

    noteGain.gain.setValueAtTime(0.0001, time);
    // Instant attack hammer strike
    noteGain.gain.linearRampToValueAtTime(peakVol, time + 0.008);
    // Fast initial decay
    noteGain.gain.exponentialRampToValueAtTime(peakVol * 0.55, time + 0.12);
    // Gentle singing sustain & natural fade
    noteGain.gain.exponentialRampToValueAtTime(0.00001, time + duration);

    // 3. Acoustic Lowpass Filter (warmer tone on higher notes)
    const noteFilter = ctx.createBiquadFilter();
    noteFilter.type = 'lowpass';
    noteFilter.frequency.setValueAtTime(Math.min(3200, freq * 4.5), time);
    noteFilter.Q.setValueAtTime(1.0, time);

    // 4. Stereo Panning (Grand piano spread: low notes left, high notes right)
    let panner = null;
    if (ctx.createStereoPanner) {
      panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-0.7, Math.min(0.7, pan)), time);
    }

    // Connect note graph
    oscFund.connect(noteGain);
    oscHarm1.connect(noteGain);
    oscHarm2.connect(noteGain);
    if (freq < 250) {
      oscWarmth.connect(noteGain);
    }

    noteGain.connect(noteFilter);

    if (panner) {
      noteFilter.connect(panner);
      panner.connect(dest);
    } else {
      noteFilter.connect(dest);
    }

    // Start and Stop
    const stopTime = time + duration + 0.05;
    oscFund.start(time);
    oscHarm1.start(time);
    oscHarm2.start(time);
    if (freq < 250) oscWarmth.start(time);

    oscFund.stop(stopTime);
    oscHarm1.stop(stopTime);
    oscHarm2.stop(stopTime);
    if (freq < 250) oscWarmth.stop(stopTime);
  }

  // Soft Cello / String Pad for emotional depth
  function playWarmPad(ctx, dest, freq, time, duration = 3.5, velocity = 0.35) {
    if (!ctx || !dest || isNaN(freq) || freq <= 0) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const padGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.003, time); // Gentle chorus detune

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);

    const padVol = 0.035 * velocity;
    padGain.gain.setValueAtTime(0.0001, time);
    padGain.gain.linearRampToValueAtTime(padVol, time + 0.8);
    padGain.gain.setValueAtTime(padVol, time + duration - 0.8);
    padGain.gain.exponentialRampToValueAtTime(0.00001, time + duration);

    osc1.connect(padGain);
    osc2.connect(padGain);
    padGain.connect(filter);
    filter.connect(dest);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + duration + 0.1);
    osc2.stop(time + duration + 0.1);
  }

  // Note Frequency Dictionary
  const N = {
    C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, Fs2: 92.50, G2: 98.00, A2: 110.00, B2: 123.47,
    C3: 130.81, Cs3: 138.59, D3: 146.83, E3: 164.81, Fs3: 185.00, G3: 196.00, A3: 220.00, B3: 246.94,
    C4: 261.63, Cs4: 277.18, D4: 293.66, E4: 329.63, Fs4: 369.99, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, Cs5: 554.37, D5: 587.33, E5: 659.25, Fs5: 739.99, G5: 783.99, A5: 880.00, B5: 987.77,
    C6: 1046.50, Cs6: 1108.73, D6: 1174.66, E6: 1318.51, Fs6: 1479.98
  };

  // Full Romantic Song Composition (Chords + Arpeggios + Soulful Singing Melody)
  const romanticSongMeasures = [
    // 1. D Major (Tender Beginning)
    {
      bass: N.D2, pad: N.D3,
      arpeggios: [N.D3, N.A3, N.D4, N.Fs4, N.A4, N.D4],
      melody: [
        { note: N.Fs5, beat: 0, dur: 1.4, vel: 0.95 },
        { note: N.E5,  beat: 1.5, dur: 0.8, vel: 0.85 },
        { note: N.D5,  beat: 2.2, dur: 1.5, vel: 0.9 }
      ]
    },
    // 2. A Major (Gentle Warmth)
    {
      bass: N.A2, pad: N.Cs3,
      arpeggios: [N.A2, N.E3, N.A3, N.Cs4, N.E4, N.A3],
      melody: [
        { note: N.Cs5, beat: 0, dur: 1.4, vel: 0.9 },
        { note: N.D5,  beat: 1.5, dur: 0.8, vel: 0.85 },
        { note: N.E5,  beat: 2.2, dur: 1.5, vel: 0.95 }
      ]
    },
    // 3. B Minor (Emotional Depth)
    {
      bass: N.B2, pad: N.D3,
      arpeggios: [N.B2, N.Fs3, N.B3, N.D4, N.Fs4, N.B3],
      melody: [
        { note: N.D5,  beat: 0, dur: 1.2, vel: 0.9 },
        { note: N.Fs5, beat: 1.2, dur: 1.0, vel: 0.95 },
        { note: N.B5,  beat: 2.2, dur: 1.6, vel: 1.0 }
      ]
    },
    // 4. F# Minor (Heartfelt Longing)
    {
      bass: N.Fs2, pad: N.Cs3,
      arpeggios: [N.Fs2, N.Cs3, N.A3, N.Cs4, N.Fs4, N.A3],
      melody: [
        { note: N.A5,  beat: 0, dur: 1.4, vel: 0.95 },
        { note: N.Fs5, beat: 1.4, dur: 0.8, vel: 0.85 },
        { note: N.Cs5, beat: 2.2, dur: 1.5, vel: 0.9 }
      ]
    },
    // 5. G Major (Sweet Hope)
    {
      bass: N.G2, pad: N.B2,
      arpeggios: [N.G2, N.D3, N.G3, N.B3, N.D4, N.G3],
      melody: [
        { note: N.B4, beat: 0, dur: 1.0, vel: 0.85 },
        { note: N.D5, beat: 1.0, dur: 1.0, vel: 0.9 },
        { note: N.G5, beat: 2.0, dur: 1.8, vel: 0.95 }
      ]
    },
    // 6. D Major / F# (Affection)
    {
      bass: N.Fs2, pad: N.A2,
      arpeggios: [N.Fs2, N.D3, N.A3, N.D4, N.Fs4, N.A3],
      melody: [
        { note: N.Fs5, beat: 0, dur: 1.2, vel: 0.9 },
        { note: N.D5,  beat: 1.2, dur: 1.0, vel: 0.85 },
        { note: N.A4,  beat: 2.2, dur: 1.5, vel: 0.85 }
      ]
    },
    // 7. G Major -> E Minor (Sweet Confession)
    {
      bass: N.E2, pad: N.G2,
      arpeggios: [N.E2, N.B2, N.E3, N.G3, N.B3, N.E3],
      melody: [
        { note: N.G4, beat: 0, dur: 0.8, vel: 0.85 },
        { note: N.B4, beat: 0.8, dur: 0.8, vel: 0.9 },
        { note: N.D5, beat: 1.6, dur: 1.0, vel: 0.95 },
        { note: N.E5, beat: 2.4, dur: 1.4, vel: 0.9 }
      ]
    },
    // 8. A Sus4 -> A Major (Tender Resolution)
    {
      bass: N.A2, pad: N.E3,
      arpeggios: [N.A2, N.E3, N.A3, N.D4, N.Cs4, N.A3],
      melody: [
        { note: N.E5,  beat: 0, dur: 1.0, vel: 0.9 },
        { note: N.Fs5, beat: 1.0, dur: 0.8, vel: 0.95 },
        { note: N.E5,  beat: 1.8, dur: 0.8, vel: 0.85 },
        { note: N.D5,  beat: 2.5, dur: 1.5, vel: 0.9 }
      ]
    },
    // 9. Emotional Climax Chorus - High D
    {
      bass: N.D2, pad: N.Fs3,
      arpeggios: [N.D2, N.A2, N.Fs3, N.A3, N.D4, N.Fs4],
      melody: [
        { note: N.D6,  beat: 0, dur: 1.4, vel: 1.0 },
        { note: N.Cs6, beat: 1.4, dur: 0.8, vel: 0.9 },
        { note: N.B5,  beat: 2.2, dur: 1.5, vel: 0.95 }
      ]
    },
    // 10. Chorus Continuation - High A
    {
      bass: N.A2, pad: N.E3,
      arpeggios: [N.A2, N.E3, N.A3, N.Cs4, N.E4, N.A4],
      melody: [
        { note: N.A5,  beat: 0, dur: 1.2, vel: 0.95 },
        { note: N.G5,  beat: 1.2, dur: 0.8, vel: 0.85 },
        { note: N.Fs5, beat: 2.0, dur: 1.8, vel: 0.95 }
      ]
    },
    // 11. Climax Swell - G to High B
    {
      bass: N.G2, pad: N.B2,
      arpeggios: [N.G2, N.D3, N.G3, N.B3, N.D4, N.G4],
      melody: [
        { note: N.B5,  beat: 0, dur: 1.4, vel: 1.0 },
        { note: N.A5,  beat: 1.4, dur: 0.8, vel: 0.9 },
        { note: N.G5,  beat: 2.2, dur: 1.6, vel: 0.95 }
      ]
    },
    // 12. Soft Loving Whisper
    {
      bass: N.A2, pad: N.Cs3,
      arpeggios: [N.A2, N.E3, N.A3, N.Cs4, N.E4, N.A3],
      melody: [
        { note: N.Fs5, beat: 0, dur: 1.0, vel: 0.9 },
        { note: N.E5,  beat: 1.0, dur: 0.8, vel: 0.85 },
        { note: N.Fs5, beat: 1.8, dur: 0.8, vel: 0.9 },
        { note: N.D5,  beat: 2.5, dur: 1.8, vel: 0.95 }
      ]
    }
  ];

  let currentMeasureIndex = 0;
  const BEAT_DURATION = 0.82; // ~73 BPM, romantic piano tempo

  function scheduleMeasure(ctx, dest, measureIndex, startTime) {
    const measure = romanticSongMeasures[measureIndex % romanticSongMeasures.length];

    // 1. Play deep bass root note
    playAcousticPianoNote(ctx, dest, measure.bass, startTime, 3.8, 0.9, -0.4);

    // 2. Play warm sustained pad underneath
    playWarmPad(ctx, dest, measure.pad, startTime, 3.6, 0.35);

    // 3. Play gentle rolling arpeggio notes in left/middle register
    if (measure.arpeggios) {
      const stepTime = (BEAT_DURATION * 3.5) / measure.arpeggios.length;
      measure.arpeggios.forEach((freq, idx) => {
        const noteTime = startTime + idx * stepTime;
        const pan = -0.35 + (idx / measure.arpeggios.length) * 0.7;
        playAcousticPianoNote(ctx, dest, freq, noteTime, 2.2, 0.65, pan);
      });
    }

    // 4. Play expressive romantic singing melody in right hand
    if (measure.melody) {
      measure.melody.forEach(m => {
        const noteTime = startTime + m.beat * BEAT_DURATION;
        playAcousticPianoNote(ctx, dest, m.note, noteTime, m.dur * BEAT_DURATION * 1.5, m.vel, 0.25);
      });
    }
  }

  function startRomanticSynth() {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (synthGainNode) return; // Already running

    // Master bus
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 1.5);

    // Reverb convolver
    try {
      reverbNode = ctx.createConvolver();
      reverbNode.buffer = createReverbBuffer(ctx, 3.2, 2.0);
      const reverbGain = ctx.createGain();
      reverbGain.gain.setValueAtTime(0.38, ctx.currentTime);

      masterGain.connect(ctx.destination);
      masterGain.connect(reverbNode);
      reverbNode.connect(reverbGain);
      reverbGain.connect(ctx.destination);
    } catch (e) {
      masterGain.connect(ctx.destination);
    }

    synthGainNode = masterGain;

    const measureDuration = BEAT_DURATION * 4.0; // 4 beats per measure

    function playLoop() {
      if (!isMusicPlaying || !audioCtx) return;
      const now = audioCtx.currentTime;
      scheduleMeasure(audioCtx, masterGain, currentMeasureIndex, now + 0.05);
      currentMeasureIndex = (currentMeasureIndex + 1) % romanticSongMeasures.length;
    }

    playLoop();
    synthInterval = setInterval(playLoop, measureDuration * 1000);
  }

  let synthGainNode = null;

  function stopRomanticSynth() {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
    if (masterGain && audioCtx) {
      masterGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
      setTimeout(() => {
        if (masterGain) {
          try { masterGain.disconnect(); } catch (e) {}
          masterGain = null;
          synthGainNode = null;
        }
      }, 700);
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

  // Play romantic music (Both live Web Audio romantic melody engine and audio elements)
  function playRomanticMusic() {
    if (isMusicPlaying) return;

    isMusicPlaying = true;
    updateWidgetUI(true, 'Playing ♡');

    // Start Web Audio Romantic Melody Engine (0 latency, pristine quality, works everywhere)
    getAudioContext();
    startRomanticSynth();

    // Also attempt background audio playback if available
    if (romanticAudio) {
      romanticAudio.volume = 0.35;
      romanticAudio.play().catch(() => {
        // Handled cleanly by synth engine
      });
    }
  }

  function pauseRomanticMusic() {
    isMusicPlaying = false;
    stopRomanticSynth();
    if (romanticAudio) {
      try {
        romanticAudio.pause();
      } catch (e) {}
    }
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

  // Instant Autoplay System with zero friction
  function setupAutoplay() {
    // 1. Attempt immediate playback on website open
    try {
      getAudioContext();
      playRomanticMusic();
    } catch (e) {}

    // 2. Multi-gesture instant trigger:
    // If the browser blocks unmuted audio on initial load, the very first touch,
    // mouse movement, click, or scroll instantly unlocks & starts the music!
    const instantAudioTrigger = () => {
      if (!userInteracted || !isMusicPlaying) {
        userInteracted = true;
        getAudioContext();
        playRomanticMusic();
      }
      // Remove one-time listeners once started
      cleanupTriggers();
    };

    const triggerEvents = ['pointerdown', 'touchstart', 'click', 'keydown', 'scroll', 'mousemove'];
    
    function cleanupTriggers() {
      triggerEvents.forEach(evt => {
        window.removeEventListener(evt, instantAudioTrigger);
      });
    }

    triggerEvents.forEach(evt => {
      window.addEventListener(evt, instantAudioTrigger, { passive: true, once: true });
    });
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

  // Start autoplay immediately on load
  setupAutoplay();
});

