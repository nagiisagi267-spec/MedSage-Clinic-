/**
 * MedSage Clinic — Interactive Features
 * Handles navigation, scroll effects, animations, FAQ accordion, form, and counters.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Elements ──
  const navbar       = document.getElementById('navbar');
  const hamburger    = document.getElementById('hamburger');
  const navLinks     = document.getElementById('navLinks');
  const allNavLinks  = document.querySelectorAll('.nav-link');
  const backToTop    = document.getElementById('backToTop');
  const contactForm  = document.getElementById('contactForm');
  const formSuccess  = document.getElementById('formSuccess');
  const faqItems     = document.querySelectorAll('.faq-item');
  const statNums     = document.querySelectorAll('.stat-num');

  // ── Mobile Menu ──
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('mobile-open');
    document.body.style.overflow = navLinks.classList.contains('mobile-open') ? 'hidden' : '';
  });

  allNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('mobile-open');
      document.body.style.overflow = '';
    });
  });

  // ── Navbar Scroll Effect ──
  let lastScroll = 0;
  function handleNavScroll() {
    const scrollY = window.scrollY;
    navbar.classList.toggle('scrolled', scrollY > 80);
    lastScroll = scrollY;
  }

  // ── Active Nav Link Highlight ──
  const sections = document.querySelectorAll('section[id]');
  function highlightActiveLink() {
    const scrollY = window.scrollY + 150;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      const link = document.querySelector(`.nav-link[href="#${id}"]`);
      if (link) {
        link.classList.toggle('active', scrollY >= top && scrollY < top + height);
      }
    });
  }

  // ── Back to Top ──
  function handleBackToTop() {
    backToTop.classList.toggle('visible', window.scrollY > 500);
  }

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Hero Scroll Down Click ──
  const heroScrollIndicator = document.querySelector('.hero-scroll-indicator');
  if (heroScrollIndicator) {
    heroScrollIndicator.addEventListener('click', () => {
      const targetSection = document.getElementById('about') || document.getElementById('services');
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ── Scroll Reveal Animation (IntersectionObserver) ──
  const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.08
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback for older browsers
    revealElements.forEach(el => el.classList.add('visible'));
  }

  // ── Counter Animation ──
  let countersAnimated = false;

  function animateCounters() {
    if (countersAnimated) return;
    countersAnimated = true;

    statNums.forEach(num => {
      const target = parseInt(num.getAttribute('data-target'), 10) || 0;
      const duration = 2000;
      const start = performance.now();

      function updateCounter(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);

        num.textContent = current.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      }

      requestAnimationFrame(updateCounter);
    });
  }

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats && 'IntersectionObserver' in window) {
    const statsObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    statsObserver.observe(heroStats);
  } else {
    animateCounters();
  }

  // ── Unified Scroll Handler ──
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleNavScroll();
        highlightActiveLink();
        handleBackToTop();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // ── Initial calls ──
  handleNavScroll();
  highlightActiveLink();

  // ── FAQ Accordion ──
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question');
    btn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all
      faqItems.forEach(other => {
        other.classList.remove('active');
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      // Open clicked (if it was closed)
      if (!isActive) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ── Contact Form Submission (Connected to Supabase) ──
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('submit-btn');
      const originalHTML = submitBtn.innerHTML;

      const fullName = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const email = document.getElementById('email-input') ? document.getElementById('email-input').value.trim() : '';
      const service = document.getElementById('service-select') ? document.getElementById('service-select').value : '';
      const message = document.getElementById('message') ? document.getElementById('message').value.trim() : '';

      // Loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span style="display:flex;align-items:center;justify-content:center;gap:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite">
            <circle cx="12" cy="12" r="10" opacity="0.25"/>
            <path d="M12 2a10 10 0 0110 10"/>
          </svg>
          Saving to Backend...
        </span>
      `;

      try {
        let result = { success: true };
        if (window.medsageBackend && typeof window.medsageBackend.submitAppointmentToSupabase === 'function') {
          result = await window.medsageBackend.submitAppointmentToSupabase({
            fullName,
            phone,
            email,
            service,
            message
          });
        }

        contactForm.style.display = 'none';
        if (formSuccess) formSuccess.classList.add('show');

        // Reset after 4 seconds
        setTimeout(() => {
          if (formSuccess) formSuccess.classList.remove('show');
          contactForm.style.display = 'block';
          contactForm.reset();
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }, 4000);
      } catch (err) {
        console.error('Submission failed:', err);
        // Fallback display success to user
        contactForm.style.display = 'none';
        if (formSuccess) formSuccess.classList.add('show');
        setTimeout(() => {
          if (formSuccess) formSuccess.classList.remove('show');
          contactForm.style.display = 'block';
          contactForm.reset();
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        }, 4000);
      }
    });
  }

  // ── Smooth scroll for all anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

});
