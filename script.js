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

  // ── Scroll Reveal Animation ──
  const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

  function revealOnScroll() {
    const windowHeight = window.innerHeight;
    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < windowHeight * 0.88) {
        el.classList.add('visible');
      }
    });
  }

  // ── Counter Animation ──
  let countersAnimated = false;

  function animateCounters() {
    if (countersAnimated) return;

    const heroStats = document.querySelector('.hero-stats');
    if (!heroStats) return;

    const rect = heroStats.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;

    countersAnimated = true;

    statNums.forEach(num => {
      const target = parseInt(num.getAttribute('data-target'), 10);
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

  // ── Unified Scroll Handler ──
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handleNavScroll();
        highlightActiveLink();
        handleBackToTop();
        revealOnScroll();
        animateCounters();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // ── Initial calls ──
  handleNavScroll();
  highlightActiveLink();
  revealOnScroll();

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

  // ── Contact Form Submission ──
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const originalHTML = submitBtn.innerHTML;

    // Loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span style="display:flex;align-items:center;gap:8px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite">
          <circle cx="12" cy="12" r="10" opacity="0.25"/>
          <path d="M12 2a10 10 0 0110 10"/>
        </svg>
        Sending...
      </span>
    `;

    // Simulate submission delay
    setTimeout(() => {
      contactForm.style.display = 'none';
      formSuccess.classList.add('show');

      // Reset after 4 seconds
      setTimeout(() => {
        formSuccess.classList.remove('show');
        contactForm.style.display = 'block';
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
      }, 4000);
    }, 1500);
  });

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

// Add spin keyframe dynamically for the loading spinner
const style = document.createElement('style');
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
