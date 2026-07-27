const { useState, useEffect, useRef } = React;

function AIPortalIntro() {
  const [isVisible, setIsVisible] = useState(true);
  const [introFinished, setIntroFinished] = useState(false);
  
  const overlayRef = useRef(null);
  const portalRef = useRef(null);
  const logoRef = useRef(null);
  const textGroupRef = useRef(null);
  const svgCircleRef = useRef(null);
  const burstRingRef = useRef(null);
  const warpLinesRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Ref to trigger electric arc generation on burst
  const isBurstingRef = useRef(false);

  useEffect(() => {
    // 1. Session Storage check
    const SESSION_KEY = 'nst_portal_intro_played';
    const alreadyPlayed = sessionStorage.getItem(SESSION_KEY);
    
    // Global replay function attached to window for footer link
    window.replayPortalIntro = () => {
      sessionStorage.removeItem(SESSION_KEY);
      window.location.reload();
    };

    if (alreadyPlayed === 'true') {
      setIsVisible(false);
      setIntroFinished(true);
      revealHeroDirectly();
      return;
    }

    // Lock scroll during intro
    document.body.style.overflow = 'hidden';

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 2. Interactive Mouse Background Light Effect
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      if (overlayRef.current) {
        overlayRef.current.style.setProperty('--mouse-x', `${x}%`);
        overlayRef.current.style.setProperty('--mouse-y', `${y}%`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 3. Canvas Particle & Electric Arc Engine
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

    // Create 70 floating glowing particles
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2.5 + 0.8,
        color: Math.random() > 0.4 ? '#00f0ff' : '#0077ff',
        alpha: Math.random() * 0.6 + 0.2,
        vy: -(Math.random() * 0.4 + 0.15),
        vx: Math.random() * 0.3 - 0.15,
        pulseSpeed: Math.random() * 0.02 + 0.005
      });
    }

    // Function to generate dynamic electric lightning arcs across portal core
    const createElectricArc = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 120;
      
      const angle = Math.random() * Math.PI * 2;
      const startX = centerX + Math.cos(angle) * (radius * 0.3);
      const startY = centerY + Math.sin(angle) * (radius * 0.3);
      const endX = centerX + Math.cos(angle) * (radius * 1.1);
      const endY = centerY + Math.sin(angle) * (radius * 1.1);

      const segments = 6;
      let points = [{ x: startX, y: startY }];
      
      for (let j = 1; j < segments; j++) {
        const t = j / segments;
        const px = startX + (endX - startX) * t + (Math.random() * 16 - 8);
        const py = startY + (endY - startY) * t + (Math.random() * 16 - 8);
        points.push({ x: px, y: py });
      }
      points.push({ x: endX, y: endY });

      electricArcs.push({
        points,
        alpha: 1,
        life: 1
      });
    };

    // Main 60 FPS Render Loop
    const renderCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render floating particles
      particles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;
        p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.01;

        if (p.y < 0) p.y = canvas.height;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;

        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.min(0.9, p.alpha));
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Spawn electric arcs when burst mode active
      if (isBurstingRef.current && Math.random() < 0.45) {
        createElectricArc();
      }

      // Draw electric arcs
      electricArcs.forEach((arc, idx) => {
        ctx.save();
        ctx.globalAlpha = arc.alpha;
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = Math.random() * 2 + 1;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f0ff';
        ctx.beginPath();
        arc.points.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.restore();

        arc.alpha -= 0.1;
        if (arc.alpha <= 0) {
          electricArcs.splice(idx, 1);
        }
      });

      animationFrameId = requestAnimationFrame(renderCanvas);
    };

    renderCanvas();

    // 4. GSAP Precision Timeline Animation Sequence
    if (typeof gsap !== 'undefined') {
      const tl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem(SESSION_KEY, 'true');
          document.body.style.overflow = '';
          setIsVisible(false);
          setIntroFinished(true);
          triggerHeroAnimations();
        }
      });

      // Set initial states
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set([logoRef.current, textGroupRef.current], { opacity: 0, y: 30 });
      gsap.set(portalRef.current, { scale: 0.8, opacity: 0 });
      gsap.set(burstRingRef.current, { scale: 0.8, opacity: 0 });
      gsap.set(warpLinesRef.current, { opacity: 0 });

      // 0s: Background fades in
      tl.to(overlayRef.current, {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out'
      }, 0);

      // 0.5s: Logo & portal fade upward
      tl.to(portalRef.current, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.4)'
      }, 0.5);

      tl.to([logoRef.current, textGroupRef.current], {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out'
      }, 0.5);

      // 1.0s: Portal rotation accelerates
      tl.to('.portal-ring-outer', {
        scale: 1.05,
        duration: 0.5,
        ease: 'sine.inOut'
      }, 1.0);

      // 1.5s: Loading SVG ring completes (dashoffset: 690 -> 0)
      if (svgCircleRef.current) {
        tl.to(svgCircleRef.current, {
          strokeDashoffset: 0,
          duration: 0.8,
          ease: 'power2.inOut'
        }, 1.2);
      }

      // 2.0s: Energy burst from portal
      tl.add(() => {
        isBurstingRef.current = true;
        setTimeout(() => { isBurstingRef.current = false; }, 800);
      }, 2.0);

      tl.to(burstRingRef.current, {
        opacity: 1,
        scale: 3.2,
        duration: 0.7,
        ease: 'power3.out'
      }, 2.0);

      tl.to(burstRingRef.current, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in'
      }, 2.4);

      // 2.5s: Portal expands
      tl.to(portalRef.current, {
        scale: prefersReducedMotion ? 1.05 : 1.25,
        boxShadow: '0 0 80px rgba(0, 240, 255, 0.9)',
        duration: 0.5,
        ease: 'power2.out'
      }, 2.5);

      // 3.0s: Camera flies into portal (warp zoom effect)
      if (!prefersReducedMotion) {
        tl.to(warpLinesRef.current, {
          opacity: 0.8,
          duration: 0.3,
          ease: 'power2.in'
        }, 2.9);

        tl.to(portalRef.current, {
          scale: 25,
          opacity: 0,
          duration: 0.6,
          ease: 'power4.in'
        }, 3.0);

        tl.to(textGroupRef.current, {
          opacity: 0,
          scale: 1.5,
          duration: 0.4,
          ease: 'power2.in'
        }, 3.0);

        tl.to(warpLinesRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        }, 3.3);
      }

      // 3.5s: Intro overlay fades out to reveal hero
      tl.to(overlayRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.inOut'
      }, 3.4);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.style.overflow = '';
    };
  }, []);

  // Directly set final hero states when intro is bypassed
  const revealHeroDirectly = () => {
    const nav = document.querySelector('.main-navbar');
    const profileImg = document.querySelector('.profile-image-wrapper');
    const heroTextCol = document.querySelector('.hero-text-col');
    const heroImgCol = document.querySelector('.hero-img-col');

    if (nav) {
      nav.style.transform = 'translateY(0)';
      nav.style.opacity = '1';
    }
    if (profileImg) {
      profileImg.style.transform = 'scale(1)';
      profileImg.style.opacity = '1';
    }
    if (heroTextCol) {
      heroTextCol.style.opacity = '1';
      heroTextCol.style.transform = 'translateY(0)';
    }
    if (heroImgCol) {
      heroImgCol.style.opacity = '1';
      heroImgCol.style.transform = 'translateY(0)';
    }
  };

  // Trigger smooth staggered entrance animations for hero elements at 3.5s
  const triggerHeroAnimations = () => {
    if (typeof gsap === 'undefined') {
      revealHeroDirectly();
      return;
    }

    const nav = document.querySelector('.main-navbar');
    const profileWrapper = document.querySelector('.profile-image-wrapper');
    const heroBadge = document.querySelector('.hero-tag');
    const heroGreeting = document.querySelector('.hero-greeting');
    const heroName = document.querySelector('.hero-name');
    const heroTyping = document.querySelector('.hero-typing-wrap');
    const heroDesc = document.querySelector('.hero-description');
    const heroCtas = document.querySelector('.hero-ctas');
    const heroSocials = document.querySelector('.hero-socials');

    // Set initial entrance states
    if (nav) gsap.set(nav, { y: -50, opacity: 0 });
    if (profileWrapper) gsap.set(profileWrapper, { scale: 0.85, opacity: 0 });

    const heroElements = [heroBadge, heroGreeting, heroName, heroTyping, heroDesc, heroCtas, heroSocials].filter(Boolean);
    gsap.set(heroElements, { y: 35, opacity: 0 });

    // Animate Navbar fade down
    if (nav) {
      gsap.to(nav, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out'
      });
    }

    // Animate Profile image scale 0.85 -> 1 with spring easing
    if (profileWrapper) {
      gsap.to(profileWrapper, {
        scale: 1,
        opacity: 1,
        duration: 1.0,
        delay: 0.2,
        ease: 'back.out(1.5)'
      });
    }

    // Line by line heading and CTAs reveal
    if (heroElements.length > 0) {
      gsap.to(heroElements, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.12,
        delay: 0.1,
        ease: 'power3.out'
      });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="intro-overlay" ref={overlayRef}>
      {/* Interactive Ambient Mouse Light */}
      <div className="intro-mouse-glow" />
      
      {/* Volumetric Radial Light */}
      <div className="intro-volumetric-light" />

      {/* Particle & Electric Arc Canvas */}
      <canvas className="intro-canvas" ref={canvasRef} />

      {/* Speed Lines during warp zoom fly-in */}
      <div className="intro-warp-lines" ref={warpLinesRef} />

      <div className="intro-content-wrap">
        {/* Glowing Circular AI Portal */}
        <div className="ai-portal-container" ref={portalRef}>
          <div className="portal-ring-outer" />
          <div className="portal-ring-mid" />
          
          {/* Energy Burst Ring */}
          <div className="portal-energy-burst" ref={burstRingRef} />

          {/* Progress Circle SVG */}
          <svg className="portal-svg-wrap" viewBox="0 0 240 240">
            <circle className="portal-svg-circle-bg" cx="120" cy="120" r="110" />
            <circle 
              className="portal-svg-circle-progress" 
              ref={svgCircleRef} 
              cx="120" 
              cy="120" 
              r="110" 
            />
          </svg>

          {/* Glass Reflection Core */}
          <div className="portal-glass-core">
            <div className="portal-glass-glare" />
            {/* Logo: NST */}
            <div className="portal-logo" ref={logoRef}>
              NST
            </div>
          </div>
        </div>

        {/* Text Container Below Portal */}
        <div className="intro-text-group" ref={textGroupRef}>
          <div className="intro-sub-tag">WELCOME TO MY PORTFOLIO</div>
          <div className="intro-accent-line" />
          <h1 className="intro-author-name">Nagaram Sai Tejachary</h1>
          
          <div className="intro-roles-wrap">
            <span className="intro-role-badge"><i className="fa-brands fa-python me-1 text-info"></i> Python Developer</span>
            <span className="intro-role-badge"><i className="fa-solid fa-chart-pie me-1 text-primary"></i> Data Analyst</span>
            <span className="intro-role-badge"><i className="fa-solid fa-brain me-1 text-cyan"></i> Machine Learning Enthusiast</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Render React component into #intro-root
const container = document.getElementById('intro-root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<AIPortalIntro />);
}
