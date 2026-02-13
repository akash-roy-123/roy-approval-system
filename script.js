/**
 * Roy Review System™ — Interactive Logic
 *
 * ESCALATING "NO" BEHAVIOR:
 * When users click "No," we don't accept it immediately. Instead, we trigger
 * a series of progressively more persuasive/funny confirmation dialogs.
 * The user is nudged (or worn down) into selecting Yes, at which point we trigger celebration.
 */

(function () {
  'use strict';

  // ========== DOM References ==========
  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const confirmModal = document.getElementById('confirmModal');
  const modalMessage = document.getElementById('modalMessage');
  const modalYes = document.getElementById('modalYes');
  const modalNo = document.getElementById('modalNo');
  const successOverlay = document.getElementById('successOverlay');
  const successTitle = document.getElementById('successTitle');
  const successMessage = document.getElementById('successMessage');
  const successIcon = document.getElementById('successIcon');
  const closeSuccessBtn = document.getElementById('closeSuccessBtn');
  const confettiCanvas = document.getElementById('confettiCanvas');
  const yesCountEl = document.getElementById('yesCount');
  const resetYesCountBtn = document.getElementById('resetYesCount');
  const noCountEl = document.getElementById('noCount');
  const resetNoCountBtn = document.getElementById('resetNoCount');
  const annoyedBar = document.getElementById('annoyedBar');
  const annoyedFill = document.getElementById('annoyedFill');
  const ratingDisclaimer = document.getElementById('ratingDisclaimer');
  const entertainingBtn = document.getElementById('entertainingBtn');

  // ========== Storage key for persistent Yes count ==========
  const YES_COUNT_KEY = 'roy-review-yes-count';

  // ========== Escalation State ==========
  let noClickCount = 0;
  let yesClickCount = loadYesCount();
  let confettiAnimationId = null;
  let prefersReducedMotion = false;

  function loadYesCount() {
    try {
      const n = parseInt(localStorage.getItem(YES_COUNT_KEY), 10);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch (e) {
      return 0;
    }
  }

  function saveYesCount() {
    try {
      localStorage.setItem(YES_COUNT_KEY, String(yesClickCount));
    } catch (e) {}
  }

  function updateYesCounterDisplay() {
    if (yesCountEl) yesCountEl.textContent = String(yesClickCount);
  }

  function resetYesCounter() {
    yesClickCount = 0;
    try {
      localStorage.removeItem(YES_COUNT_KEY);
    } catch (e) {}
    updateYesCounterDisplay();
  }

  function resetNoCounter() {
    if (noCountEl) noCountEl.textContent = '0';
  }

  // Repeat Yes: messages after first full loop
  const SUCCESS_MESSAGES_REPEAT = [
    { title: 'Still Correct!', message: "Roy is still pleased. You're on a roll.", icon: '😌' },
    { title: 'Again!', message: 'The approval meter nods in approval. Again.', icon: '👍' },
  ];

  // Different success message for each Yes click (loops when exhausted)
  const SUCCESS_MESSAGES = [
    { title: 'Correct Answer!', message: 'You have excellent judgment. Roy appreciates you.', icon: '🎉' },
    { title: 'Exactly Right!', message: "Roy knew you'd see it his way. Good call.", icon: '✨' },
    { title: 'So Wise!', message: 'Your wisdom has been recorded. Roy is pleased.', icon: '🌟' },
    { title: 'Perfect Choice!', message: 'The approval meter just smiled. You did it.', icon: '👍' },
    { title: 'Roy Approved!', message: "You're officially on Roy's good list. Welcome.", icon: '👑' },
    { title: 'Great Minds Think Alike!', message: 'You and Roy agree. As it should be.', icon: '🤝' },
    { title: 'Another Win!', message: 'Consistency is key. You keep making the right choice.', icon: '🏆' },
    { title: 'Couldn\'t Agree More!', message: 'Roy is nodding approvingly from wherever he is.', icon: '😌' },
    { title: 'You Get It!', message: 'Finally, someone who understands. Roy salutes you.', icon: '🎖️' },
    { title: 'Legendary Choice!', message: 'Future generations will study this moment. Well done.', icon: '📜' },
  ];

  // Progressive messages shown when user insists on "No"
  const ESCALATING_MESSAGES = [
    'Are you sure?',
    'Really sure?',
    'Last chance?',
    "This might hurt Roy's feelings...",
    "Someone's going to be sad. (It's Roy.)",
    "The approval meter is watching.",
    "Okay but... why though?",
    "We could just pretend you meant Yes?",
    "Roy believes in second chances.",
    "Just... think about it?",
    "We're not mad. Just disappointed.",
    "The No button is tired. Let it rest.",
    "Yes is literally right there. Right. There.",
    "Roy is waiting. Patiently. Maybe too patiently.",
  ];

  // ========== Initialize ==========
  function init() {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    yesBtn.addEventListener('click', handleYesClick);
    noBtn.addEventListener('click', handleNoClick);
    modalYes.addEventListener('click', handleModalYes);
    modalNo.addEventListener('click', handleModalNo);

    // Prevent accidental close via Escape or backdrop click; user must choose a button
    confirmModal.addEventListener('cancel', (e) => e.preventDefault());

    closeSuccessBtn.addEventListener('click', hideSuccessOverlay);
    if (resetYesCountBtn) resetYesCountBtn.addEventListener('click', resetYesCounter);
    if (resetNoCountBtn) resetNoCountBtn.addEventListener('click', resetNoCounter);

    initAudio();
    updateYesCounterDisplay();
    initRatingBars();
  }

  // ========== Rating bars (annoyed fill sync + humorous disclaimer) ==========
  const DISCLAIMER_TEXTS = [
    'Roy has been notified. He is not worried.',
    'Data may or may not be used against Roy. No refunds.',
    "Roy's lawyer has been CC'd. (He doesn't have one.)",
    'This scale goes to ∞. Roy goes further.',
    'Results are 100% scientific. Probably.',
    "Roy believed in you. We hope you're proud of yourself.",
  ];

  function initRatingBars() {
    if (!annoyedBar || !annoyedFill) return;
    function syncAnnoyedFill() {
      const val = Number(annoyedBar.value);
      if (annoyedFill) annoyedFill.style.width = val + '%';
      if (ratingDisclaimer) {
        const i = Math.min(DISCLAIMER_TEXTS.length - 1, Math.floor((val / 100) * DISCLAIMER_TEXTS.length));
        ratingDisclaimer.textContent = DISCLAIMER_TEXTS[i];
      }
    }
    syncAnnoyedFill();
    annoyedBar.addEventListener('input', syncAnnoyedFill);
    if (entertainingBtn) {
      entertainingBtn.addEventListener('click', function () {
        const was = entertainingBtn.textContent;
        entertainingBtn.textContent = 'Correct.';
        entertainingBtn.disabled = true;
        setTimeout(function () {
          entertainingBtn.textContent = was;
          entertainingBtn.disabled = false;
        }, 1200);
      });
    }
  }

  // ========== YES Button Handler ==========
  function handleYesClick() {
    const baseLength = SUCCESS_MESSAGES.length;
    const repeatLength = SUCCESS_MESSAGES_REPEAT.length;
    let msg;
    if (yesClickCount < baseLength) {
      msg = SUCCESS_MESSAGES[yesClickCount];
    } else {
      msg = SUCCESS_MESSAGES_REPEAT[(yesClickCount - baseLength) % repeatLength];
    }
    yesClickCount++;

    successTitle.textContent = msg.title;
    successMessage.textContent = msg.message;
    successIcon.textContent = msg.icon;

    saveYesCount();
    updateYesCounterDisplay();
    showSuccessOverlay();
    launchConfetti();
    playSuccessSound();
  }

  // ========== NO Button Handler — Core Escalation Logic ==========
  function handleNoClick() {
    noClickCount++;
    const messageIndex = (noClickCount - 1) % ESCALATING_MESSAGES.length;
    modalMessage.textContent = ESCALATING_MESSAGES[messageIndex];
    confirmModal.showModal();
  }

  // ========== Modal Handlers ==========
  function handleModalYes() {
    confirmModal.close();
    handleYesClick();
  }

  function handleModalNo() {
    noClickCount++;
    playSadSound();
    const messageIndex = (noClickCount - 1) % ESCALATING_MESSAGES.length;
    modalMessage.textContent = ESCALATING_MESSAGES[messageIndex];
  }

  // ========== Success Overlay & Confetti ==========
  function showSuccessOverlay() {
    successOverlay.setAttribute('aria-hidden', 'false');
    successOverlay.classList.add('active');
    // Move focus so keyboard users aren't trapped
    closeSuccessBtn.focus();
  }

  function hideSuccessOverlay() {
    successOverlay.setAttribute('aria-hidden', 'true');
    successOverlay.classList.remove('active');
    if (confettiAnimationId != null) {
      cancelAnimationFrame(confettiAnimationId);
      confettiAnimationId = null;
    }
    const ctx = confettiCanvas.getContext('2d');
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    yesBtn.focus();
  }

  function launchConfetti() {
    if (prefersReducedMotion) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    confettiCanvas.width = w * dpr;
    confettiCanvas.height = h * dpr;
    confettiCanvas.style.width = w + 'px';
    confettiCanvas.style.height = h + 'px';
    const ctx = confettiCanvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const colors = ['#2d9d8a', '#3dbda8', '#2e8b6e', '#b8923d', '#c45c5c'];
    const particles = [];
    const particleCount = 80;
    const cx = w / 2;
    const ch = h / 2;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: cx,
        y: ch,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      const allOffScreen = particles.every(
        (p) => p.y > h + 20 || p.x < -20 || p.x > w + 20
      );
      if (!allOffScreen) {
        confettiAnimationId = requestAnimationFrame(animate);
      } else {
        confettiAnimationId = null;
      }
    }

    confettiAnimationId = requestAnimationFrame(animate);
  }

  // ========== Optional Sound Effects (Web Audio API) ==========
  let audioContext = null;

  function initAudio() {
    // Audio context is created on first user interaction (browser policy)
    document.addEventListener('click', function init() {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      document.removeEventListener('click', init);
    }, { once: true });
  }

  function playSuccessSound() {
    if (!audioContext) return;
    try {
      const times = [0, 0.1, 0.2];
      const freqs = [523.25, 659.25, 783.99];
      const t0 = audioContext.currentTime;
      freqs.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0, t0);
        gain.gain.setValueAtTime(0.12, t0 + times[i]);
        gain.gain.exponentialRampToValueAtTime(0.01, t0 + times[i] + 0.12);
        osc.start(t0 + times[i]);
        osc.stop(t0 + times[i] + 0.12);
      });
    } catch (e) {}
  }

  function playSadSound() {
    if (!audioContext || prefersReducedMotion) return;
    try {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.setValueAtTime(200, audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioContext.currentTime + 0.25);
      gain.gain.setValueAtTime(0.08, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + 0.25);
    } catch (e) {}
  }

  // ========== Start ==========
  init();
})();
