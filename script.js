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
  const buttonContainer = document.getElementById('buttonContainer');
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

  // Yes button grows with each Yes; No button shrinks with each No. Reset on reload.
  let yesScale = 1;
  let noScale = 1;
  const YES_SCALE_MAX = 1.35;
  const YES_SCALE_STEP = 1.03;
  const NO_SCALE_MIN = 0.4;
  const NO_SCALE_STEP = 0.94;

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

  // Repeat Yes: messages after first full loop
  const SUCCESS_MESSAGES_REPEAT = [
    { title: 'Roy is still happy', message: 'Same smile. Slightly smugger this time.', icon: '😌' },
    { title: 'Roy is happy on principle', message: 'At this point it is just his personality.', icon: '👍' },
  ];

  // Different success message for each Yes click (loops when exhausted)
  const SUCCESS_MESSAGES = [
    { title: 'Roy is happy', message: 'A small smile. Possibly a humming noise.', icon: '😊' },
    { title: 'Roy is glowing', message: 'His aura just hit S-tier. Witnesses report sparkles.', icon: '✨' },
    { title: 'Roy is grinning', message: 'It is alarming. In a good way.', icon: '😁' },
    { title: 'Roy is delighted', message: "He's already telling someone. We can't stop him.", icon: '🥰' },
    { title: 'Roy is thrilled', message: 'He just did a little victory shimmy. We saw.', icon: '💃' },
    { title: 'Roy is unstoppable', message: "Power level: rising. ETA to 'insufferable': 3 minutes.", icon: '🚀' },
    { title: 'Roy is touched', message: 'There may be one (1) tear. He insists it is allergies.', icon: '🥹' },
    { title: 'Roy is updating his LinkedIn', message: "Headline: 'Officially Approved Person.' We will not be stopping him.", icon: '💼' },
    { title: 'Roy is starting a fan club', message: 'Membership cards pending. Newsletter is just Roy.', icon: '👑' },
    { title: 'Roy is at peace', message: 'Inner harmony achieved. The universe nods. So does Roy.', icon: '🌟' },
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

  // The No button mutates as the user keeps insisting.
  // Indexed by noClickCount; clamped at the last entry.
  const NO_LABELS = [
    'No',
    'Are you sure?',
    'Wait...',
    'Hmm...',
    'Maybe?',
    '...fine',
    'I give up',
    'Yes (typo)',
  ];

  // Special success overlays at certain Yes-count thresholds.
  const MILESTONES = {
    5:   { title: "Roy's Acquaintance", message: 'Five yeses. Roy now sort of recognizes you.', icon: '🤝' },
    10:  { title: "Roy's Pal",          message: 'Double digits. Roy has memorized your shoe size.', icon: '🧢' },
    25:  { title: "Roy's BFF",          message: 'Friendship bracelet incoming. Wear it.',          icon: '💚' },
    50:  { title: "Roy's Inner Circle", message: 'You get the family WhatsApp invite.',             icon: '👑' },
    100: { title: 'Roy Hall of Fame',   message: 'Plaque is being engraved as we speak.',           icon: '🏆' },
  };

  // Emoji glyphs sprinkled into the confetti.
  const CONFETTI_GLYPHS = ['👑', '✨', '💚', '🎉', '⭐', '🌟'];
  const MILESTONE_GLYPHS = ['👑', '🏆', '✨', '🎉', '🌟', '💫'];

  // ========== Initialize ==========
  function init() {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    yesBtn.addEventListener('click', handleYesClick);
    noBtn.addEventListener('click', handleNoClick);
    modalYes.addEventListener('click', handleModalYes);
    modalNo.addEventListener('click', handleModalNo);

    // Runaway No: on hover-capable devices the button teleports out of the way.
    // We deliberately skip 'focus' so keyboard users can still tab to it and click.
    noBtn.addEventListener('pointerenter', handleNoPointerEnter);

    // Prevent accidental close via Escape or backdrop click; user must choose a button
    confirmModal.addEventListener('cancel', (e) => e.preventDefault());

    closeSuccessBtn.addEventListener('click', hideSuccessOverlay);

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

    // Milestone overrides the standard message and amps up the confetti.
    const milestone = MILESTONES[yesClickCount];
    if (milestone) msg = milestone;

    yesScale = Math.min(YES_SCALE_MAX, yesScale * YES_SCALE_STEP);
    resetNoButtonState();
    applyButtonScales();

    successTitle.textContent = msg.title;
    successMessage.textContent = msg.message;
    successIcon.textContent = msg.icon;

    saveYesCount();
    updateYesCounterDisplay();
    showSuccessOverlay();
    launchConfetti(Boolean(milestone));
    playSuccessSound();
  }

  // ========== NO Button Handler — Core Escalation Logic ==========
  function handleNoClick() {
    noClickCount++;
    noScale = Math.max(NO_SCALE_MIN, noScale * NO_SCALE_STEP);
    applyButtonScales();
    updateNoLabel();
    // Reposition again so the next attempt starts from a fresh spot
    // (this is the touch-device fallback; on hover-capable devices it just
    // adds extra chaos on top of the pointerenter teleport).
    teleportNoButton();

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
    noScale = Math.max(NO_SCALE_MIN, noScale * NO_SCALE_STEP);
    applyButtonScales();
    updateNoLabel();
    playSadSound();
    const messageIndex = (noClickCount - 1) % ESCALATING_MESSAGES.length;
    modalMessage.textContent = ESCALATING_MESSAGES[messageIndex];
  }

  // ========== Button Transform Helpers ==========
  function applyButtonScales() {
    yesBtn.style.setProperty('--yes-scale', String(yesScale));
    noBtn.style.setProperty('--no-scale', String(noScale));
  }

  function updateNoLabel() {
    const idx = Math.min(NO_LABELS.length - 1, noClickCount);
    noBtn.textContent = NO_LABELS[idx];
  }

  function resetNoButtonState() {
    noClickCount = 0;
    noScale = 1;
    noBtn.style.setProperty('--no-x', '0px');
    noBtn.style.setProperty('--no-y', '0px');
    noBtn.textContent = NO_LABELS[0];
  }

  // Hover-only entry point: the runaway only fires before a click on devices
  // that emit pointerenter without an immediate pointerdown (i.e. mouse).
  function handleNoPointerEnter(e) {
    if (e.pointerType === 'touch') return;
    teleportNoButton();
  }

  function teleportNoButton() {
    if (prefersReducedMotion) return;
    if (!buttonContainer) return;

    const container = buttonContainer.getBoundingClientRect();
    const btn = noBtn.getBoundingClientRect();

    // Strip current translate to find the button's "natural" position.
    const cs = getComputedStyle(noBtn);
    const currentX = parseFloat(cs.getPropertyValue('--no-x')) || 0;
    const currentY = parseFloat(cs.getPropertyValue('--no-y')) || 0;
    const baseLeft = btn.left - currentX;
    const baseTop = btn.top - currentY;

    const padding = 8;
    const minDx = container.left + padding - baseLeft;
    const maxDx = container.right - padding - btn.width - baseLeft;
    const minDy = container.top + padding - baseTop;
    const maxDy = container.bottom - padding - btn.height - baseTop;

    if (maxDx <= minDx || maxDy <= minDy) {
      noBtn.style.setProperty('--no-x', '0px');
      noBtn.style.setProperty('--no-y', '0px');
      return;
    }

    const nx = minDx + Math.random() * (maxDx - minDx);
    const ny = minDy + Math.random() * (maxDy - minDy);
    noBtn.style.setProperty('--no-x', nx.toFixed(1) + 'px');
    noBtn.style.setProperty('--no-y', ny.toFixed(1) + 'px');
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

  function launchConfetti(isMilestone) {
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

    const colors = ['#059669', '#0d9488', '#d97706', '#e11d48', '#6ee7b7'];
    const particles = [];
    const particleCount = isMilestone ? 160 : 80;
    const emojiRatio = isMilestone ? 0.6 : 0.35;
    const glyphPalette = isMilestone ? MILESTONE_GLYPHS : CONFETTI_GLYPHS;
    const burstSpeed = isMilestone ? 14 : 12;
    const burstLift = isMilestone ? 6 : 4;
    const cx = w / 2;
    const ch = h / 2;

    for (let i = 0; i < particleCount; i++) {
      const useGlyph = Math.random() < emojiRatio;
      particles.push({
        x: cx,
        y: ch,
        vx: (Math.random() - 0.5) * burstSpeed,
        vy: (Math.random() - 0.5) * burstSpeed - burstLift,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: useGlyph ? Math.random() * 14 + 18 : Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        glyph: useGlyph ? glyphPalette[Math.floor(Math.random() * glyphPalette.length)] : null,
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
        if (p.glyph) {
          ctx.font = p.size + 'px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.glyph, 0, 0);
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
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
