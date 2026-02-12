/**
 * Roy Review System™ — Interactive Logic
 *
 * ESCALATING "NO" BEHAVIOR:
 * When users click "No," we don't accept it immediately. Instead, we trigger
 * a series of progressively more persuasive/funny confirmation dialogs.
 * As they persist, we also apply UX "frustration" tactics:
 * - Shrink the No button
 * - Make the Yes button grow and pulse
 * - Move the No button to random positions (it "runs away")
 * - More intense modal messages
 *
 * Eventually the user is nudged (or worn down) into selecting Yes,
 * at which point we trigger celebration.
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
  const approvalMeter = document.getElementById('approvalMeter');
  const approvalValue = document.getElementById('approvalValue');

  // ========== Escalation State ==========
  let noClickCount = 0;
  let yesClickCount = 0;

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
    "Roy's mom will be sad.",
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
    yesBtn.addEventListener('click', handleYesClick);
    noBtn.addEventListener('click', handleNoClick);
    modalYes.addEventListener('click', handleModalYes);
    modalNo.addEventListener('click', handleModalNo);

    // Prevent accidental close via Escape or backdrop click; user must choose a button
    confirmModal.addEventListener('cancel', (e) => e.preventDefault());

    closeSuccessBtn.addEventListener('click', hideSuccessOverlay);

    // Optional: Preload any sound (we use Web Audio for lightweight beeps)
    initAudio();
  }

  // ========== YES Button Handler ==========
  function handleYesClick() {
    // Pick a different message for each Yes click (loops through array)
    const msgIndex = yesClickCount % SUCCESS_MESSAGES.length;
    const msg = SUCCESS_MESSAGES[msgIndex];
    yesClickCount++;

    successTitle.textContent = msg.title;
    successMessage.textContent = msg.message;
    successIcon.textContent = msg.icon;

    spikeApprovalMeter();
    showSuccessOverlay();
    launchConfetti();
    playSuccessSound();
  }

  // ========== NO Button Handler — Core Escalation Logic ==========
  function handleNoClick(e) {
    noClickCount++;

    // Always show modal; messages loop infinitely so it never gets stuck
    const messageIndex = (noClickCount - 1) % ESCALATING_MESSAGES.length;
    modalMessage.textContent = ESCALATING_MESSAGES[messageIndex];
    confirmModal.showModal();

    // Apply progressive UX "frustration" based on click count
    applyEscalatingBehavior();
  }

  /**
   * Applies visual/UX changes to make choosing "No" harder.
   * - Early: Just the modal
   * - Mid: Shrink No, grow Yes
   * (Buttons stay stable — no moving/repositioning)
   */
  function applyEscalatingBehavior() {
    // From click 3 onward: shrink No button
    if (noClickCount >= 3) {
      noBtn.classList.add('shrinking');
    }

    // From click 5 onward: grow and pulse Yes button
    if (noClickCount >= 5) {
      yesBtn.classList.add('growing');
    }
  }

  // ========== Modal Handlers ==========
  function handleModalYes() {
    confirmModal.close();
    handleYesClick();
  }

  function handleModalNo() {
    // User doubled down on No — increment count, loop to next message
    noClickCount++;
    applyEscalatingBehavior();

    const messageIndex = (noClickCount - 1) % ESCALATING_MESSAGES.length;
    modalMessage.textContent = ESCALATING_MESSAGES[messageIndex];
  }

  // ========== Success Overlay & Confetti ==========
  function showSuccessOverlay() {
    successOverlay.setAttribute('aria-hidden', 'false');
    successOverlay.classList.add('active');
  }

  function hideSuccessOverlay() {
    successOverlay.setAttribute('aria-hidden', 'true');
    successOverlay.classList.remove('active');
  }

  function launchConfetti() {
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const colors = ['#5b9a8b', '#7eb8a8', '#f4c430', '#e8a87c', '#9dc6d8'];
    const particles = [];
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: confettiCanvas.width / 2,
        y: confettiCanvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      const allOffScreen = particles.every(
        (p) => p.y > confettiCanvas.height + 20 || p.x < -20 || p.x > confettiCanvas.width + 20
      );

      if (!allOffScreen) {
        requestAnimationFrame(animate);
      }
    }

    animate();
  }

  // ========== Approval Meter ==========
  function spikeApprovalMeter() {
    const currentWidth = parseFloat(approvalMeter.style.width) || 47;
    const targetWidth = 99;

    let width = currentWidth;
    const step = () => {
      width += (targetWidth - width) * 0.15;
      approvalMeter.style.width = `${width}%`;
      approvalValue.textContent = `${Math.round(width)}%`;

      if (width < targetWidth - 0.5) {
        requestAnimationFrame(step);
      } else {
        approvalMeter.style.width = '99%';
        approvalValue.textContent = '99%';
      }
    };

    requestAnimationFrame(step);
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
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.setValueAtTime(523.25, audioContext.currentTime);
      osc.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);

      gain.gain.setValueAtTime(0.15, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + 0.4);
    } catch (e) {
      // Silently fail if audio not supported
    }
  }

  // ========== Start ==========
  init();
})();
