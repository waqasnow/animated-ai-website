const TOTAL_FRAMES = 240;
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
const liveClockEl = document.getElementById('live-clock');

const canvasWrapper = document.getElementById('canvas-wrapper');
const heroTrack = document.getElementById('hero-track');
const scrollStepText = document.getElementById('scroll-step-text');
const heroLeftColumn = document.getElementById('hero-left-column');
const section2 = document.getElementById('section-2');

// Store loaded images
const images = [];
let loadedCount = 0;

// Path resolver for frame sequence
const getFramePath = (index) => {
  const frameNum = (index + 1).toString().padStart(3, '0');
  return `/frames/ezgif-frame-${frameNum}.jpg`;
};

// State for smooth lerp scrolling
let currentFrame = 0;
let targetFrame = 0;
const LERP_FACTOR = 0.12;

// Live Clock Updater
function updateLiveClock() {
  if (!liveClockEl) return;
  const now = new Date();
  const options = {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  const timeStr = now.toLocaleTimeString('en-US', options);
  liveClockEl.textContent = `${timeStr} (USA)`;
}
setInterval(updateLiveClock, 1000);
updateLiveClock();

// Set canvas dimensions handling HiDPI displays
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  renderFrame(Math.round(currentFrame));
}

window.addEventListener('resize', resizeCanvas);

// Draw frame with COVER fit
function renderFrame(index) {
  const imgIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, index));
  const img = images[imgIndex];

  if (!img || !img.complete || img.naturalWidth === 0) {
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      if (images[imgIndex - offset]?.complete) {
        drawImg(images[imgIndex - offset]);
        return;
      }
      if (images[imgIndex + offset]?.complete) {
        drawImg(images[imgIndex + offset]);
        return;
      }
    }
    return;
  }

  drawImg(img);
}

function drawImg(img) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const canvasRatio = canvas.width / canvas.height;
  const imgRatio = img.naturalWidth / img.naturalHeight;

  let renderWidth, renderHeight, offsetX, offsetY;

  if (canvasRatio > imgRatio) {
    renderWidth = canvas.width;
    renderHeight = img.naturalHeight * (canvas.width / img.naturalWidth);
    offsetX = 0;
    offsetY = (canvas.height - renderHeight) / 2;
  } else {
    renderHeight = canvas.height;
    renderWidth = img.naturalWidth * (canvas.height / img.naturalHeight);
    offsetX = (canvas.width - renderWidth) / 2;
    offsetY = 0;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
}

// Calculate target frame index
function updateScrollTarget() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
  const maxHeroScroll = Math.max(1, (heroTrack?.offsetHeight || 1) - window.innerHeight);
  
  const scrollFraction = Math.min(1, Math.max(0, scrollTop / maxHeroScroll));
  targetFrame = scrollFraction * (TOTAL_FRAMES - 1);

  if (heroLeftColumn) {
    if (scrollFraction > 0.75) {
      const fadeProgress = (scrollFraction - 0.75) / 0.20;
      heroLeftColumn.style.opacity = Math.max(0, 1 - fadeProgress).toString();
      heroLeftColumn.style.transform = `translate3d(0, ${-40 * fadeProgress}px, 0)`;
    } else {
      heroLeftColumn.style.opacity = '1';
      heroLeftColumn.style.transform = 'translate3d(0, 0, 0)';
    }
  }

  if (scrollStepText) {
    const bottomBar = document.querySelector('.hero-bottom-bar');
    if (scrollTop >= maxHeroScroll * 0.8) {
      bottomBar?.classList.add('scrolled-mode');
    } else {
      bottomBar?.classList.remove('scrolled-mode');
      scrollStepText.textContent = "Scroll Down";
    }
  }
}

window.addEventListener('scroll', updateScrollTarget, { passive: true });
window.addEventListener('resize', () => {
  resizeCanvas();
  updateScrollTarget();
});

// Scroll Down button click handler
document.getElementById('scroll-down-btn')?.addEventListener('click', () => {
  if (section2) {
    section2.scrollIntoView({ behavior: 'smooth' });
  }
});

// Main animation loop for buttery smooth lerped frame transitions
let lastRenderedIndex = -1;

function animationLoop() {
  currentFrame += (targetFrame - currentFrame) * LERP_FACTOR;
  const frameToRender = Math.round(currentFrame);

  if (frameToRender !== lastRenderedIndex) {
    renderFrame(frameToRender);
    lastRenderedIndex = frameToRender;
  }

  requestAnimationFrame(animationLoop);
}

// Preload sequence
function preloadImages() {
  resizeCanvas();

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = getFramePath(i);

    img.onload = () => {
      loadedCount++;
      const progress = Math.round((loadedCount / TOTAL_FRAMES) * 100);
      if (loaderText) {
        loaderText.textContent = `Loading ${progress}%`;
      }

      if (i === 0) {
        renderFrame(0);
      }

      if (loadedCount === TOTAL_FRAMES) {
        onPreloadComplete();
      }
    };

    img.onerror = () => {
      loadedCount++;
      if (loadedCount === TOTAL_FRAMES) {
        onPreloadComplete();
      }
    };

    images.push(img);
  }
}

function onPreloadComplete() {
  if (loader) {
    loader.classList.add('hidden');
  }
  updateScrollTarget();
  renderFrame(Math.round(currentFrame));
}


// ----------------------------------------------------
// 2D INTERACTIVE PHYSICS BUBBLE ENGINE ("HITTING A BALL")
// ----------------------------------------------------
const physicsContainer = document.getElementById('physics-bubbles-container');

if (physicsContainer) {
  const partnerData = [
    { title: 'Nerdist', sub: 'Media', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 19h20L12 2z"/><circle cx="12" cy="13" r="3"/></svg>', radius: 68 },
    { title: 'Scribol', sub: 'Publishing', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18"/></svg>', radius: 72 },
    { title: 'oötem', sub: 'Studio', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/></svg>', radius: 65 },
    { title: '30 MIN', sub: 'Network', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', radius: 64 },
    { title: 'FW', sub: 'Fashion', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M9 9h6v6H9z"/></svg>', radius: 62 },
    { title: 'HEARTLAND', sub: 'Sports', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', radius: 78 },
    { title: 'SHINEZ', sub: 'Entertainment', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>', radius: 75 },
    { title: 'Media Partners', sub: 'Agency', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>', radius: 82 },
    { title: 'Be Group', sub: 'Digital', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF5500" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9 9h6M9 15h6"/></svg>', radius: 85 },
    { title: 'Mercury', sub: 'Tech', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l9 4.9v9.8L12 22l-9-4.9V6.9L12 2z"/></svg>', radius: 68 },
    { title: 'Zantic', sub: 'AI Engine', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>', radius: 70 },
    { title: 'Crona', sub: 'Protocol', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>', radius: 66 },
    { title: 'Wage', sub: 'Finance', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', radius: 64 },
    { title: 'Vanguard', sub: 'Global', icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22L2 4h20L12 22z"/></svg>', radius: 70 }
  ];

  let containerBounds = physicsContainer.getBoundingClientRect();
  const bubbles = [];

  // Mouse Physics state
  const mouse = {
    x: -1000,
    y: -1000,
    px: -1000,
    py: -1000,
    vx: 0,
    vy: 0,
    isHovered: false
  };

  // Track mouse movement
  physicsContainer.addEventListener('mousemove', (e) => {
    const rect = physicsContainer.getBoundingClientRect();
    const nx = e.clientX - rect.left;
    const ny = e.clientY - rect.top;

    mouse.vx = nx - mouse.x;
    mouse.vy = ny - mouse.y;
    mouse.x = nx;
    mouse.y = ny;
    mouse.isHovered = true;
  });

  physicsContainer.addEventListener('mouseleave', () => {
    mouse.isHovered = false;
    mouse.x = -1000;
    mouse.y = -1000;
  });

  // Touch support for mobile devices
  physicsContainer.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      const rect = physicsContainer.getBoundingClientRect();
      const nx = e.touches[0].clientX - rect.left;
      const ny = e.touches[0].clientY - rect.top;

      mouse.vx = nx - mouse.x;
      mouse.vy = ny - mouse.y;
      mouse.x = nx;
      mouse.y = ny;
      mouse.isHovered = true;
    }
  }, { passive: true });

  // Create DOM elements and initial physics state
  partnerData.forEach((partner, i) => {
    const diameter = partner.radius * 2;
    const el = document.createElement('div');
    el.className = 'bubble-item';
    el.style.width = `${diameter}px`;
    el.style.height = `${diameter}px`;

    el.innerHTML = `
      <div class="bubble-icon">${partner.icon}</div>
      <div class="bubble-title">${partner.title}</div>
      <div class="bubble-sub">${partner.sub}</div>
    `;

    physicsContainer.appendChild(el);

    // Grid placement logic to start scattered naturally
    const cols = 5;
    const col = i % cols;
    const row = Math.floor(i / cols);

    const startX = 100 + col * 200 + (Math.random() * 40 - 20);
    const startY = 80 + row * 130 + (Math.random() * 40 - 20);

    bubbles.push({
      element: el,
      radius: partner.radius,
      x: startX,
      y: startY,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      mass: partner.radius * 0.1
    });
  });

  // Physics animation loop
  function updatePhysics() {
    containerBounds = physicsContainer.getBoundingClientRect();
    const width = containerBounds.width;
    const height = containerBounds.height;

    // 1. Mouse Repulsion ("Hitting a ball" logic)
    if (mouse.isHovered) {
      const mouseSpeed = Math.hypot(mouse.vx, mouse.vy);
      
      bubbles.forEach(b => {
        const dx = b.x - mouse.x;
        const dy = b.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        const hitRadius = b.radius + 35;

        if (dist < hitRadius && dist > 0) {
          const normX = dx / dist;
          const normY = dy / dist;

          // Force scales dynamically with mouse speed & proximity
          const forceStrength = Math.min(18, ((hitRadius - dist) / hitRadius) * 12 + mouseSpeed * 0.35);
          
          b.vx += normX * forceStrength;
          b.vy += normY * forceStrength;

          // Add mouse directional momentum transfer
          b.vx += mouse.vx * 0.25;
          b.vy += mouse.vy * 0.25;
        }
      });
    }

    // 2. Circle-to-Circle Elastic Collisions
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const b1 = bubbles[i];
        const b2 = bubbles[j];

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = b1.radius + b2.radius;

        if (dist < minDist && dist > 0) {
          // Overlap resolution
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          b1.x -= nx * overlap * 0.5;
          b1.y -= ny * overlap * 0.5;
          b2.x += nx * overlap * 0.5;
          b2.y += ny * overlap * 0.5;

          // Elastic bounce momentum swap
          const kx = b1.vx - b2.vx;
          const ky = b1.vy - b2.vy;
          const p = 2 * (nx * kx + ny * ky) / (b1.mass + b2.mass);

          b1.vx -= p * b2.mass * nx * 0.85;
          b1.vy -= p * b2.mass * ny * 0.85;
          b2.vx += p * b1.mass * nx * 0.85;
          b2.vy += p * b1.mass * ny * 0.85;
        }
      }
    }

    // 3. Update Positions & Boundary Bouncing
    const bounceDamping = -0.75;
    const friction = 0.975;

    bubbles.forEach(b => {
      // Gentle ambient drift so they keep moving pleasantly
      b.vx += (Math.random() - 0.5) * 0.08;
      b.vy += (Math.random() - 0.5) * 0.08;

      // Apply friction damping
      b.vx *= friction;
      b.vy *= friction;

      // Update positions
      b.x += b.vx;
      b.y += b.vy;

      // Wall Collisions
      if (b.x - b.radius < 0) {
        b.x = b.radius;
        b.vx *= bounceDamping;
      } else if (b.x + b.radius > width) {
        b.x = width - b.radius;
        b.vx *= bounceDamping;
      }

      if (b.y - b.radius < 0) {
        b.y = b.radius;
        b.vy *= bounceDamping;
      } else if (b.y + b.radius > height) {
        b.y = height - b.radius;
        b.vy *= bounceDamping;
      }

      // Render to DOM via Hardware-accelerated GPU transform
      b.element.style.transform = `translate3d(${b.x - b.radius}px, ${b.y - b.radius}px, 0)`;
    });

    requestAnimationFrame(updatePhysics);
  }

  window.addEventListener('resize', () => {
    containerBounds = physicsContainer.getBoundingClientRect();
  });

  requestAnimationFrame(updatePhysics);
}

// ----------------------------------------------------
// FULLY FUNCTIONAL NAVBAR LOGIC (SMOOTH SCROLL & SCROLLSPY)
// ----------------------------------------------------
function initNavbarLogic() {
  const navLinks = document.querySelectorAll('.nav-menu .nav-link, .dropdown-item');
  const sections = [
    { id: 'hero-track', linkId: 'link-home' },
    { id: 'section-2', linkId: 'link-how-it-works' },
    { id: 'about', linkId: 'link-about' },
    { id: 'features', linkId: 'link-features' },
    { id: 'product', linkId: 'link-product' },
    { id: 'partners', linkId: 'link-partners' },
    { id: 'testimonials', linkId: 'link-testimonials' },
    { id: 'contact', linkId: 'link-contact' }
  ];

  // 1. Smooth Scrolling on Link Clicks & Close Mobile Menu
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      navMenu.classList.toggle('mobile-active');
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      if (mobileToggle && navMenu) {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('mobile-active');
      }
      const targetHref = link.getAttribute('href');
      if (targetHref && targetHref.startsWith('#')) {
        e.preventDefault();
        const targetEl = document.querySelector(targetHref);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // 2. Brand Logo Click -> Scroll to Top
  const brandLogo = document.getElementById('nav-brand-logo');
  if (brandLogo) {
    brandLogo.style.cursor = 'pointer';
    brandLogo.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 3. Get Started Nav Button -> Scroll to Contact Section
  const getStartedNavBtn = document.getElementById('btn-nav-get-started');
  if (getStartedNavBtn) {
    getStartedNavBtn.addEventListener('click', () => {
      const contactSec = document.getElementById('contact');
      if (contactSec) {
        contactSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // 4. Scrollspy Active Link Observer & Bottom Floating Pill Updater
  function checkActiveSection() {
    const scrollPos = window.scrollY + 250;
    const scrollStepText = document.getElementById('scroll-step-text');
    const bottomBar = document.querySelector('.hero-bottom-bar');
    const scrollDownBtn = document.getElementById('scroll-down-btn');

    // Reset active states
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    let currentSectionName = "01 / Home";

    for (let i = sections.length - 1; i >= 0; i--) {
      const sec = document.getElementById(sections[i].id);
      if (sec) {
        const top = sec.offsetTop;
        if (scrollPos >= top) {
          const activeLink = document.getElementById(sections[i].linkId);
          if (activeLink) {
            activeLink.classList.add('active');
            
            // Format section display name for bottom bar
            const rawName = activeLink.textContent.replace(' ▾', '').trim();
            const secNum = (i + 1).toString().padStart(2, '0');
            currentSectionName = `${secNum} / ${rawName}`;
          }
          break;
        }
      }
    }

    // If scrolled past hero, update bottom pill indicator
    if (bottomBar && bottomBar.classList.contains('scrolled-mode') && scrollStepText) {
      scrollStepText.textContent = `${currentSectionName} • ↑ Top`;
    }
  }

  // Handle bottom pill button click (Scroll Down in Hero vs Scroll to Top in Lower Sections)
  const scrollDownBtn = document.getElementById('scroll-down-btn');
  if (scrollDownBtn) {
    scrollDownBtn.addEventListener('click', () => {
      const bottomBar = document.querySelector('.hero-bottom-bar');
      if (bottomBar && bottomBar.classList.contains('scrolled-mode')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const sec2 = document.getElementById('section-2');
        if (sec2) sec2.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  window.addEventListener('scroll', checkActiveSection, { passive: true });
  checkActiveSection();
}

// Initialize navbar logic
initNavbarLogic();

// Initialize
preloadImages();
requestAnimationFrame(animationLoop);
