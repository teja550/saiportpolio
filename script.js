/* ==========================================================================
   PREMIUM PERSONAL PORTFOLIO INTERACTION LOGIC
   Author: Nagaram Sai Tejachary
   Theme: Modern Luxury UI (Apple, Stripe, Vercel, Framer inspired)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  /* --------------------------------------------------------------------------
     1. PRELOADER & HERO ENTRANCE EFFECT
     -------------------------------------------------------------------------- */
  const preloader = document.getElementById('preloader');
  
  window.addEventListener('load', () => {
    // Graceful fade out
    setTimeout(() => {
      preloader.classList.add('fade-out');
      // Trigger reveal for elements inside the viewport on load
      triggerScrollReveal();
    }, 800);
  });

  /* --------------------------------------------------------------------------
     2. CUSTOM CURSOR
     -------------------------------------------------------------------------- */
  const cursor = document.getElementById('customCursor');
  const cursorDot = document.getElementById('customCursorDot');
  
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Instant dot movement
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
  });
  
  // Custom cursor ring smooth lag (inertia animation loop)
  function animateCursor() {
    const delay = 8; // Division factor for lag speed
    cursorX += (mouseX - cursorX) / delay;
    cursorY += (mouseY - cursorY) / delay;
    
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
    
    requestAnimationFrame(animateCursor);
  }
  animateCursor();
  
  // Hover expansion triggers
  const interactiveElements = document.querySelectorAll('a, button, input, textarea, .pointer-glow, .navbar-toggler, .social-circle-link');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
  });

  /* --------------------------------------------------------------------------
     3. DARK / LIGHT THEME TOGGLER
     -------------------------------------------------------------------------- */
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const body = document.body;
  
  // Check cached preference
  const savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') {
    body.classList.add('light-theme');
  } else {
    body.classList.remove('light-theme');
  }
  
  themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    const activeTheme = body.classList.contains('light-theme') ? 'light' : 'dark';
    localStorage.setItem('theme', activeTheme);
  });

  /* --------------------------------------------------------------------------
     4. TYPING TEXT EFFECT (HERO SECTION)
     -------------------------------------------------------------------------- */
  const typingTextSpan = document.getElementById('typingText');
  const titles = ["Python Full Stack Developer"];
  let titleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  
  function typeEffect() {
    if (!typingTextSpan) return;
    
    const currentTitle = titles[titleIndex];
    
    if (isDeleting) {
      typingTextSpan.textContent = currentTitle.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingTextSpan.textContent = currentTitle.substring(0, charIndex + 1);
      charIndex++;
    }
    
    let typeSpeed = isDeleting ? 40 : 80;
    
    if (!isDeleting && charIndex === currentTitle.length) {
      typeSpeed = 2000; // Pause at completion
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      titleIndex = (titleIndex + 1) % titles.length;
      typeSpeed = 400; // Delay before starting next word
    }
    
    setTimeout(typeEffect, typeSpeed);
  }
  
  // Start typing
  setTimeout(typeEffect, 1200);

  /* --------------------------------------------------------------------------
     5. SCROLL PROGRESS BAR
     -------------------------------------------------------------------------- */
  const scrollProgressBar = document.getElementById('scrollProgress');
  
  window.addEventListener('scroll', () => {
    const windowScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = (window.scrollY / windowScrollHeight) * 100;
    scrollProgressBar.style.width = `${scrollPercentage}%`;
  });

  /* --------------------------------------------------------------------------
     6. ACTIVE LINK NAVIGATION TRACKING
     -------------------------------------------------------------------------- */
  const sections = document.querySelectorAll('section, header');
  const navLinks = document.querySelectorAll('.nav-links-list .nav-link');
  
  function activeNavLinkHighlight() {
    let currentActiveSection = 'home';
    const scrollPosition = window.scrollY + 200; // Offset threshold
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPosition >= sectionTop && scrollPosition < (sectionTop + sectionHeight)) {
        currentActiveSection = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentActiveSection}`) {
        link.classList.add('active');
      }
    });
  }
  
  window.addEventListener('scroll', activeNavLinkHighlight);

  /* --------------------------------------------------------------------------
     7. FLOATING CONTROLS VISIBILITY (SCROLL TO TOP / FLOATING CONTACT)
     -------------------------------------------------------------------------- */
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  const floatingContactBtn = document.getElementById('floatingContactBtn');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      scrollToTopBtn.classList.add('show');
      floatingContactBtn.classList.add('show');
    } else {
      scrollToTopBtn.classList.remove('show');
      floatingContactBtn.classList.remove('show');
    }
  });
  
  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* --------------------------------------------------------------------------
     8. MOUSE HOVER GLOW EFFECT (CARD GRADIENTS)
     -------------------------------------------------------------------------- */
  const glowCards = document.querySelectorAll('.pointer-glow');
  
  glowCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  /* --------------------------------------------------------------------------
     9. 3D TILT EFFECT ON CARDS
     -------------------------------------------------------------------------- */
  const tiltCards = document.querySelectorAll('[data-tilt]');
  
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate rotation bounds based on mouse position relative to center
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -8; // Limit to 8 deg
      const rotateY = ((x - centerX) / centerX) * 8;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });
    
    card.addEventListener('mouseleave', () => {
      // Revert transformation smoothly
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });

  /* --------------------------------------------------------------------------
     10. SCROLL REVEAL ANIMATIONS (INTERSECTION OBSERVER)
     -------------------------------------------------------------------------- */
  const revealElements = document.querySelectorAll('.reveal-fade-up');
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        
        // Custom sub triggers inside parent reveal
        if (entry.target.id === 'skills') {
          animateSkillProgress();
        }
        if (entry.target.classList.contains('achievements-section')) {
          startAchievementCounters();
        }
        
        observer.unobserve(entry.target); // Animate once
      }
    });
  }, {
    threshold: 0.15, // Trigger when 15% visible
    rootMargin: '0px 0px -50px 0px' // Offset scroll viewport bottom
  });
  
  revealElements.forEach(el => revealObserver.observe(el));
  
  // Fallback trigger check for elements in viewport on start
  function triggerScrollReveal() {
    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight - 50) {
        el.classList.add('active');
        if (el.id === 'skills') animateSkillProgress();
        if (el.classList.contains('achievements-section')) startAchievementCounters();
      }
    });
  }

  /* --------------------------------------------------------------------------
     11. SKILL PROGRESS BAR ANIMATION
     -------------------------------------------------------------------------- */
  function animateSkillProgress() {
    const progressFills = document.querySelectorAll('.progress-bar-fill');
    progressFills.forEach(fill => {
      const targetVal = fill.getAttribute('data-progress');
      fill.style.width = `${targetVal}%`;
    });
  }

  /* --------------------------------------------------------------------------
     12. ACHIEVEMENT COUNTER ANIMATION
     -------------------------------------------------------------------------- */
  let countersStarted = false;
  
  function startAchievementCounters() {
    if (countersStarted) return;
    countersStarted = true;
    
    const counters = document.querySelectorAll('.counter-number');
    
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'), 10);
      const duration = 1800; // Counter total speed ms
      const startTime = performance.now();
      
      function updateCount(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (easeOutQuad)
        const currentCount = Math.floor(progress * (2 - progress) * target);
        
        counter.textContent = currentCount;
        
        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          counter.textContent = target; // Ensure exact final value
        }
      }
      
      requestAnimationFrame(updateCount);
    });
  }

  /* --------------------------------------------------------------------------
     13. CANVAS AMBIENT PARTICLE BACKGROUND
     -------------------------------------------------------------------------- */
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  
  let particlesArray = [];
  let isCanvasActive = true;
  
  // Adjust sizing
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5; // Small size for professional styling
      this.speedX = Math.random() * 0.2 - 0.1; // Smooth floating speed
      this.speedY = Math.random() * 0.2 - 0.1;
      this.color = Math.random() > 0.5 ? '#2563EB' : '#0EA5E9';
      this.alpha = Math.random() * 0.4 + 0.1;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      // Out of bounds reset
      if (this.x < 0 || this.x > canvas.width) this.speedX = -this.speedX;
      if (this.y < 0 || this.y > canvas.height) this.speedY = -this.speedY;
    }
    
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.restore();
    }
  }
  
  function initParticles() {
    particlesArray = [];
    const maxParticles = Math.min(Math.floor((canvas.width * canvas.height) / 18000), 75); // Density scale
    for (let i = 0; i < maxParticles; i++) {
      particlesArray.push(new Particle());
    }
  }
  initParticles();
  window.addEventListener('resize', initParticles);
  
  function animateParticles() {
    if (!isCanvasActive) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particlesArray.forEach(p => {
      p.update();
      p.draw();
    });
    
    requestAnimationFrame(animateParticles);
  }
  
  // Start particle loop
  animateParticles();
  
  // Pause/Resume background execution on viewport focus checks for battery longevity
  document.addEventListener('visibilitychange', () => {
    isCanvasActive = !document.hidden;
    if (isCanvasActive) {
      animateParticles();
    }
  });

  /* --------------------------------------------------------------------------
     14. CONTACT FORM CLIENT VALIDATION & API SUBMISSION
     -------------------------------------------------------------------------- */
  const contactForm = document.getElementById('contactForm');
  const formFeedback = document.getElementById('formFeedback');
  const submitBtn = document.getElementById('submitBtn');
  
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Read form input values
      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const subject = document.getElementById('contactSubject').value.trim();
      const message = document.getElementById('contactMessage').value.trim();
      const botCheck = document.getElementById('contactHoneypot') ? document.getElementById('contactHoneypot').value : '';

      // Reset previous feedback message state
      formFeedback.classList.add('d-none');
      formFeedback.className = 'form-feedback-message mt-3 d-none';
      formFeedback.innerHTML = '';

      // Client-side Validation: All fields required
      if (!name || !email || !subject || !message) {
        formFeedback.className = 'form-feedback-message error mt-3';
        formFeedback.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-2"></i>Please fill in all required fields.';
        formFeedback.classList.remove('d-none');
        return;
      }

      // Email format regex validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        formFeedback.className = 'form-feedback-message error mt-3';
        formFeedback.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-2"></i>Please enter a valid email address.';
        formFeedback.classList.remove('d-none');
        return;
      }

      // Lock submit button & show loading spinner
      submitBtn.disabled = true;
      const initialBtnHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Sending...';

      try {
        // Send request to relative endpoint /api/contact (works on localhost:3000 & Vercel deployment)
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            subject,
            message,
            bot_check: botCheck,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data.success) {
          formFeedback.className = 'form-feedback-message success mt-3';
          formFeedback.innerHTML = '<i class="fa-solid fa-circle-check me-2"></i>Message sent successfully! I’ll get back to you soon.';
          formFeedback.classList.remove('d-none');
          contactForm.reset();
        } else {
          console.error('Contact Form Submission Error:', data.error || response.statusText);
          formFeedback.className = 'form-feedback-message error mt-3';
          formFeedback.innerHTML = `<i class="fa-solid fa-triangle-exclamation me-2"></i>${data.error || 'Unable to send your message. Please try again.'}`;
          formFeedback.classList.remove('d-none');
        }
      } catch (err) {
        console.error('Network Error while submitting contact form:', err);
        formFeedback.className = 'form-feedback-message error mt-3';
        if (window.location.protocol === 'file:') {
          formFeedback.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-2"></i>Please open http://localhost:3000 (run "npm start") or deploy to Vercel to send messages.';
        } else {
          formFeedback.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-2"></i>Unable to send your message. Please try again.';
        }
        formFeedback.classList.remove('d-none');
      } finally {
        // Re-enable submit button and restore original text
        submitBtn.disabled = false;
        submitBtn.innerHTML = initialBtnHtml;
      }
    });
  }

  /* --------------------------------------------------------------------------
     15. PROJECTS CAROUSEL (SWIPER INITIALIZATION)
     -------------------------------------------------------------------------- */
  if (typeof Swiper !== 'undefined') {
    const projectsSwiper = new Swiper('.projects-swiper', {
      loop: true,
      grabCursor: true,
      spaceBetween: 24,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      navigation: {
        nextEl: '.swiper-nav-next',
        prevEl: '.swiper-nav-prev',
      },
      pagination: {
        el: '.projects-swiper-pagination',
        clickable: true,
        dynamicBullets: false,
      },
      breakpoints: {
        // Mobile layout
        0: {
          slidesPerView: 1,
        },
        // Tablet layout
        768: {
          slidesPerView: 2,
        },
        // Desktop layout
        992: {
          slidesPerView: 3,
        }
      }
    });
  }
});
