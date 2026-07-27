(function() {
  const { useState, useEffect, useRef, createElement: e } = React;

  function AIPortalIntro() {
    const [isVisible, setIsVisible] = useState(true);
    
    const overlayRef = useRef(null);
    const portalRef = useRef(null);
    const logoRef = useRef(null);
    const textGroupRef = useRef(null);
    const svgCircleRef = useRef(null);
    const burstRingRef = useRef(null);
    const canvasRef = useRef(null);
    
    const isBurstingRef = useRef(false);

    useEffect(() => {
      const SESSION_KEY = 'nst_intro_seen_session';
      
      // Global replay function for manual re-trigger if needed
      window.replayPortalIntro = function() {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.reload();
      };

      const alreadyPlayed = sessionStorage.getItem(SESSION_KEY);

      // Skip intro immediately if already played in this browser session
      if (alreadyPlayed === 'true') {
        setIsVisible(false);
        finishIntroAndOpenPortfolio(true);
        return;
      }

      // Lock body scroll during the single intro reveal slide
      document.body.style.overflow = 'hidden';

      // Keep main navbar hidden initially until curtain slides open
      const nav = document.querySelector('.main-navbar');
      if (nav) {
        nav.style.opacity = '0';
        nav.style.transform = 'translateY(-20px)';
      }

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Mousemove ambient light tracking
      let mouseRaf;
      const handleMouseMove = (evt) => {
        if (mouseRaf) return;
        mouseRaf = requestAnimationFrame(() => {
          const x = (evt.clientX / window.innerWidth) * 100;
          const y = (evt.clientY / window.innerHeight) * 100;
          if (overlayRef.current) {
            overlayRef.current.style.setProperty('--mouse-x', `${x}%`);
            overlayRef.current.style.setProperty('--mouse-y', `${y}%`);
          }
          mouseRaf = null;
        });
      };
      window.addEventListener('mousemove', handleMouseMove);

      // Lightweight 60 FPS Particle Canvas Engine
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      
      let animationFrameId;
      let particles = [];
      let electricArcs = [];

      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      for (let i = 0; i < 30; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2 + 0.8,
          color: Math.random() > 0.4 ? '#00f0ff' : '#3b82f6',
          alpha: Math.random() * 0.5 + 0.2,
          vy: -(Math.random() * 0.3 + 0.1),
          vx: Math.random() * 0.2 - 0.1,
          pulseSpeed: Math.random() * 0.02 + 0.005
        });
      }

      const createElectricArc = () => {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2 - 40;
        const radius = 90;
        
        const angle = Math.random() * Math.PI * 2;
        const startX = centerX + Math.cos(angle) * (radius * 0.25);
        const startY = centerY + Math.sin(angle) * (radius * 0.25);
        const endX = centerX + Math.cos(angle) * (radius * 1.05);
        const endY = centerY + Math.sin(angle) * (radius * 1.05);

        const segments = 5;
        let points = [{ x: startX, y: startY }];
        for (let j = 1; j < segments; j++) {
          const t = j / segments;
          points.push({
            x: startX + (endX - startX) * t + (Math.random() * 10 - 5),
            y: startY + (endY - startY) * t + (Math.random() * 10 - 5)
          });
        }
        points.push({ x: endX, y: endY });
        electricArcs.push({ points, alpha: 1 });
      };

      const renderCanvas = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p) => {
          p.y += p.vy;
          p.x += p.vx;
          p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.01;

          if (p.y < 0) p.y = canvas.height;
          if (p.x < 0) p.x = canvas.width;

          ctx.save();
          ctx.globalAlpha = Math.max(0.1, Math.min(0.8, p.alpha));
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        if (isBurstingRef.current && Math.random() < 0.4) {
          createElectricArc();
        }

        electricArcs.forEach((arc, idx) => {
          ctx.save();
          ctx.globalAlpha = arc.alpha;
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          arc.points.forEach((pt, i) => {
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.stroke();
          ctx.restore();

          arc.alpha -= 0.12;
          if (arc.alpha <= 0) electricArcs.splice(idx, 1);
        });

        animationFrameId = requestAnimationFrame(renderCanvas);
      };

      renderCanvas();

      // GSAP One-Shot Timeline (NO INFINITE LOOPS, PLAYS ONCE AND STOPS)
      if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline({
          onComplete: () => {
            sessionStorage.setItem(SESSION_KEY, 'true');
            finishIntroAndOpenPortfolio(false);
          }
        });

        gsap.set(overlayRef.current, { xPercent: 0, opacity: 1 });
        gsap.set([logoRef.current, textGroupRef.current], { opacity: 0, y: 25 });
        gsap.set(portalRef.current, { scale: 0.85, opacity: 0 });
        gsap.set(burstRingRef.current, { scale: 0.8, opacity: 0 });

        // 0.0s: Logo & portal fade upward
        tl.to(portalRef.current, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }, 0.1);
        tl.to([logoRef.current, textGroupRef.current], { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }, 0.2);

        // 0.8s: Progress ring completes
        if (svgCircleRef.current) {
          tl.to(svgCircleRef.current, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, 0.7);
        }

        // 1.3s: Energy burst pulse
        tl.add(() => {
          isBurstingRef.current = true;
          setTimeout(() => { isBurstingRef.current = false; }, 400);
        }, 1.2);

        tl.to(burstRingRef.current, { opacity: 1, scale: 2.5, duration: 0.5, ease: 'power3.out' }, 1.2);
        tl.to(burstRingRef.current, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 1.5);

        // 1.8s - 2.7s: ELEGANT LEFT-TO-RIGHT SLIDE CURTAIN REVEAL TRANSITION
        if (!prefersReducedMotion) {
          tl.to(textGroupRef.current, { opacity: 0, y: -20, duration: 0.3, ease: 'power2.in' }, 1.7);
          tl.to(portalRef.current, { opacity: 0, scale: 0.9, duration: 0.3, ease: 'power2.in' }, 1.7);

          tl.to(overlayRef.current, {
            xPercent: 100,
            duration: 0.85,
            ease: 'power4.inOut'
          }, 1.9);
        } else {
          tl.to(overlayRef.current, {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.inOut'
          }, 1.8);
        }
      } else {
        setTimeout(() => {
          sessionStorage.setItem(SESSION_KEY, 'true');
          finishIntroAndOpenPortfolio(false);
        }, 2700);
      }

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', resizeCanvas);
        window.removeEventListener('mousemove', handleMouseMove);
        document.body.style.overflow = '';
      };
    }, []);

    // Terminate intro permanently, set display: none, unlock scroll, and reveal portfolio homepage
    const finishIntroAndOpenPortfolio = (isBypassed) => {
      document.body.style.overflow = '';
      setIsVisible(false);

      const introRoot = document.getElementById('intro-root');
      if (introRoot) {
        introRoot.style.display = 'none';
        introRoot.style.pointerEvents = 'none';
      }

      // Smoothly reveal main navbar
      const nav = document.querySelector('.main-navbar');
      if (nav) {
        nav.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        nav.style.opacity = '1';
        nav.style.transform = 'translateY(0)';
      }

      // Restore inline styles on hero elements cleanly
      const elementsToClear = [
        '.profile-image-wrapper',
        '.hero-tag',
        '.hero-greeting',
        '.hero-name',
        '.hero-typing-wrap',
        '.hero-description',
        '.hero-ctas',
        '.hero-socials',
        '.hero-text-col',
        '.hero-img-col'
      ];

      elementsToClear.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) {
          el.style.transform = '';
          el.style.opacity = '';
        }
      });

      // Trigger scroll reveal & start hero typing text
      if (window.triggerScrollReveal) {
        window.triggerScrollReveal();
      }
      if (window.startTypingEffect) {
        window.startTypingEffect();
      }
    };

    if (!isVisible) return null;

    return e('div', { className: 'intro-overlay', ref: overlayRef },
      e('div', { className: 'intro-mouse-glow' }),
      e('div', { className: 'intro-volumetric-light' }),
      e('canvas', { className: 'intro-canvas', ref: canvasRef }),
      e('div', { className: 'intro-content-wrap' },
        e('div', { className: 'ai-portal-container', ref: portalRef },
          e('div', { className: 'portal-ring-outer' }),
          e('div', { className: 'portal-ring-mid' }),
          e('div', { className: 'portal-energy-burst', ref: burstRingRef }),
          e('svg', { className: 'portal-svg-wrap', viewBox: '0 0 240 240' },
            e('circle', { className: 'portal-svg-circle-bg', cx: '120', cy: '120', r: '110' }),
            e('circle', { className: 'portal-svg-circle-progress', ref: svgCircleRef, cx: '120', cy: '120', r: '110' })
          ),
          e('div', { className: 'portal-glass-core' },
            e('div', { className: 'portal-glass-glare' }),
            e('div', { className: 'portal-logo', ref: logoRef }, 'NST')
          )
        ),
        e('div', { className: 'intro-text-group', ref: textGroupRef },
          e('div', { className: 'intro-sub-tag' }, 'WELCOME TO MY PORTFOLIO'),
          e('div', { className: 'intro-accent-line' }),
          e('h1', { className: 'intro-author-name' }, 'Nagaram Sai Tejachary'),
          e('div', { className: 'intro-roles-wrap' },
            e('span', { className: 'intro-role-badge' }, e('i', { className: 'fa-brands fa-python me-1 text-info' }), ' Python Developer'),
            e('span', { className: 'intro-role-badge' }, e('i', { className: 'fa-solid fa-chart-pie me-1 text-primary' }), ' Data Analyst'),
            e('span', { className: 'intro-role-badge' }, e('i', { className: 'fa-solid fa-brain me-1 text-cyan' }), ' Machine Learning Enthusiast')
          )
        )
      )
    );
  }

  function initIntro() {
    const container = document.getElementById('intro-root');
    if (container && typeof ReactDOM !== 'undefined') {
      const root = ReactDOM.createRoot(container);
      root.render(e(AIPortalIntro));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIntro);
  } else {
    initIntro();
  }
})();
