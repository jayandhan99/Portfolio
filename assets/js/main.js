// Entry point for site behavior.
(function () {
  'use strict';

  /* --------------------------------------------------------------------
     Mobile nav toggle
     -------------------------------------------------------------------- */
  function initNavToggle() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    menu.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* --------------------------------------------------------------------
     Nav: solid-ish background once the page scrolls, and highlight the
     link for whichever section is currently in view.
     -------------------------------------------------------------------- */
  function initNavState() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!('IntersectionObserver' in window)) return;

    // The mini-projects section belongs to the Projects nav item.
    const linkFor = { 'mini-projects': 'projects' };
    const links = new Map();
    document.querySelectorAll('.nav-menu .nav-link[href^="#"]').forEach((link) => {
      links.set(link.getAttribute('href').slice(1), link);
    });

    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const key = linkFor[entry.target.id] || entry.target.id;
        links.forEach((link, id) => link.classList.toggle('is-active', id === key));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    // The hero has no nav link, so observing it clears the highlight at the top of the page.
    ['hero', 'about', 'projects', 'mini-projects', 'certifications', 'skills'].forEach((id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* --------------------------------------------------------------------
     Scroll reveal: fade/slide elements in as they enter the viewport.
     -------------------------------------------------------------------- */
  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-visible');
        observer.unobserve(el);
        // Once faded in, drop the reveal transition so it can't override hover transitions.
        setTimeout(() => el.classList.remove('reveal', 'is-visible'), 1200);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach((el) => observer.observe(el));
  }

  /* --------------------------------------------------------------------
     Hero counters, derived from the data files so they never go stale.
     -------------------------------------------------------------------- */
  function renderHeroStats() {
    const counts = {
      projects: typeof projects === 'undefined' ? null : projects.length,
      miniProjects: typeof miniProjects === 'undefined' ? null : miniProjects.length,
      certifications: typeof certifications === 'undefined' ? null : certifications.length,
    };

    document.querySelectorAll('[data-stat]').forEach((el) => {
      const value = counts[el.dataset.stat];
      if (value !== null && value !== undefined) el.textContent = String(value);
    });
  }

  /* --------------------------------------------------------------------
     Card rendering (shared by Projects and Mini Projects)
     -------------------------------------------------------------------- */
  const STATUS_LABELS = {
    ongoing: 'Ongoing project',
    soon: 'Updating soon',
  };

  function createCard(item, basePath, index) {
    const card = document.createElement('a');
    card.className = 'card reveal';
    card.style.setProperty('--i', String(index % 3));
    card.href = `${basePath}/${item.slug}.html`;
    card.dataset.tags = (item.tags || []).join(',');

    const cover = document.createElement('div');
    cover.className = 'card-cover';
    if (item.cover) {
      const img = document.createElement('img');
      img.src = item.cover;
      img.alt = '';
      img.loading = 'lazy';
      cover.appendChild(img);
    } else {
      cover.setAttribute('aria-hidden', 'true');
      const coverLabel = document.createElement('span');
      coverLabel.textContent = item.title.charAt(0);
      cover.appendChild(coverLabel);
    }

    const body = document.createElement('div');
    body.className = 'card-body';

    const head = document.createElement('div');
    head.className = 'card-head';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = item.title;
    head.appendChild(title);

    const arrow = document.createElement('span');
    arrow.className = 'card-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    head.appendChild(arrow);

    body.appendChild(head);

    if (item.context) {
      const context = document.createElement('p');
      context.className = 'card-context';
      context.textContent = item.context;
      body.appendChild(context);
    }

    const tagRow = document.createElement('div');
    tagRow.className = 'card-tags';
    (item.tags || []).forEach((tag) => {
      const pill = document.createElement('span');
      pill.className = 'pill';
      pill.textContent = tag;
      tagRow.appendChild(pill);
    });
    body.appendChild(tagRow);

    card.appendChild(cover);
    card.appendChild(body);

    if (item.status && STATUS_LABELS[item.status]) {
      const badge = document.createElement('span');
      badge.className = `status-badge status-${item.status}`;
      badge.textContent = STATUS_LABELS[item.status];
      card.appendChild(badge);
    }

    return card;
  }

  function renderProjects() {
    const grid = document.getElementById('projectGrid');
    if (!grid || typeof projects === 'undefined') return;
    projects.forEach((project, i) => grid.appendChild(createCard(project, 'projects', i)));
  }

  function renderMiniProjects() {
    const grid = document.getElementById('miniProjectGrid');
    if (!grid || typeof miniProjects === 'undefined') return;
    miniProjects.forEach((project, i) => grid.appendChild(createCard(project, 'mini_projects', i)));
  }

  /* --------------------------------------------------------------------
     Certifications
     -------------------------------------------------------------------- */
  function createCertCard(cert) {
    const item = document.createElement('a');
    item.className = 'cert-card';
    item.href = cert.image;
    item.target = '_blank';
    item.rel = 'noopener noreferrer';

    const img = document.createElement('img');
    img.className = 'cert-image';
    img.src = cert.image;
    img.alt = `${cert.name} certificate`;
    img.loading = 'lazy';

    const body = document.createElement('div');
    body.className = 'cert-body';

    const name = document.createElement('h3');
    name.className = 'cert-name';
    name.textContent = cert.name;

    const issuer = document.createElement('p');
    issuer.className = 'cert-issuer';
    issuer.textContent = cert.issuer;

    const date = document.createElement('p');
    date.className = 'cert-date';
    date.textContent = cert.date;

    body.appendChild(name);
    body.appendChild(issuer);
    body.appendChild(date);

    item.appendChild(img);
    item.appendChild(body);
    return item;
  }

  function renderCertifications() {
    const row = document.getElementById('certRow');
    if (!row || typeof certifications === 'undefined' || certifications.length === 0) return;

    const track = document.createElement('div');
    track.className = 'cert-track';

    // Render the list twice back-to-back so the scroll animation can loop seamlessly.
    for (let pass = 0; pass < 2; pass++) {
      certifications.forEach((cert) => {
        track.appendChild(createCertCard(cert));
      });
    }

    row.appendChild(track);
  }

  /* --------------------------------------------------------------------
     Certification carousel: auto-scrolls, but native overflow scrolling
     stays live so a hover/touch can freely browse instead of just pausing.
     -------------------------------------------------------------------- */
  function initCertCarousel() {
    const row = document.getElementById('certRow');
    const track = row ? row.querySelector('.cert-track') : null;
    if (!row || !track) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const speed = 0.4; // pixels per animation frame
    let paused = false;

    function step() {
      if (!paused) {
        const halfWidth = track.scrollWidth / 2;
        row.scrollLeft += speed;
        if (row.scrollLeft >= halfWidth) {
          row.scrollLeft -= halfWidth;
        }
      }
      requestAnimationFrame(step);
    }

    row.addEventListener('mouseenter', () => { paused = true; });
    row.addEventListener('mouseleave', () => { paused = false; });
    row.addEventListener('touchstart', () => { paused = true; }, { passive: true });
    row.addEventListener('touchend', () => { paused = false; });
    row.addEventListener('focusin', () => { paused = true; });
    row.addEventListener('focusout', () => { paused = false; });

    requestAnimationFrame(step);
  }

  /* --------------------------------------------------------------------
     Skills
     -------------------------------------------------------------------- */
  function renderSkills() {
    const container = document.getElementById('skillsGroups');
    if (!container || typeof skills === 'undefined') return;

    skills.forEach((group, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'skills-group reveal';
      wrap.style.setProperty('--i', String(i % 2));

      const head = document.createElement('div');
      head.className = 'skills-group-head';

      const index = document.createElement('span');
      index.className = 'skills-group-index';
      index.setAttribute('aria-hidden', 'true');
      index.textContent = String(i + 1).padStart(2, '0');
      head.appendChild(index);

      const heading = document.createElement('h3');
      heading.className = 'skills-group-title';
      heading.textContent = group.category;
      head.appendChild(heading);
      wrap.appendChild(head);

      const pillRow = document.createElement('div');
      pillRow.className = 'skills-pill-row';
      (group.items || []).forEach((skill) => {
        const chip = document.createElement('span');
        chip.className = 'skill-chip';
        chip.textContent = skill;
        pillRow.appendChild(chip);
      });
      wrap.appendChild(pillRow);

      container.appendChild(wrap);
    });
  }

  /* --------------------------------------------------------------------
     Project filters
     -------------------------------------------------------------------- */
  function initProjectFilters() {
    const filterBar = document.getElementById('projectFilters');
    const grid = document.getElementById('projectGrid');
    if (!filterBar || !grid) return;

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      filterBar.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const filter = btn.dataset.filter;
      grid.querySelectorAll('.card').forEach((card) => {
        const tags = card.dataset.tags ? card.dataset.tags.split(',') : [];
        const isMatch = filter === 'all' || tags.includes(filter);
        card.classList.toggle('is-hidden', !isMatch);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNavToggle();
    initNavState();
    renderHeroStats();
    renderProjects();
    renderMiniProjects();
    renderCertifications();
    initCertCarousel();
    renderSkills();
    initProjectFilters();
    initReveal();
  });
})();
