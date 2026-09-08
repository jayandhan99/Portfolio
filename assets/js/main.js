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
     Hero cursor trail: glowing dot + fading trail on the hero canvas.
     -------------------------------------------------------------------- */
  function initCursorTrail() {
    const hero = document.getElementById('hero');
    const canvas = document.getElementById('cursorTrail');
    if (!hero || !canvas || !canvas.getContext) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const ctx = canvas.getContext('2d');
    let points = [];
    let rafId = null;

    function resizeCanvas() {
      canvas.width = hero.clientWidth;
      canvas.height = hero.clientHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      points.forEach((p) => {
        p.life -= 0.035;
      });
      points = points.filter((p) => p.life > 0);

      points.forEach((p) => {
        const glowRadius = 22 * p.life;
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
        gradient.addColorStop(0, `rgba(56, 182, 255, ${0.5 * p.life})`);
        gradient.addColorStop(1, 'rgba(56, 182, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(226, 232, 240, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5 * p.life, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = points.length > 0 ? requestAnimationFrame(draw) : null;
    }

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      points.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, life: 1 });
      if (!rafId) rafId = requestAnimationFrame(draw);
    });

    hero.addEventListener('mouseleave', () => {
      points = [];
    });
  }

  /* --------------------------------------------------------------------
     Card rendering (shared by Projects and Mini Projects)
     -------------------------------------------------------------------- */
  function createCard(item, basePath) {
    const card = document.createElement('a');
    card.className = 'card';
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

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = item.title;
    body.appendChild(title);

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
    return card;
  }

  function renderProjects() {
    const grid = document.getElementById('projectGrid');
    if (!grid || typeof projects === 'undefined') return;
    projects.forEach((project) => grid.appendChild(createCard(project, 'projects')));
  }

  function renderMiniProjects() {
    const grid = document.getElementById('miniProjectGrid');
    if (!grid || typeof miniProjects === 'undefined') return;
    miniProjects.forEach((project) => grid.appendChild(createCard(project, 'mini_projects')));
  }

  /* --------------------------------------------------------------------
     Certifications
     -------------------------------------------------------------------- */
  function renderCertifications() {
    const row = document.getElementById('certRow');
    if (!row || typeof certifications === 'undefined') return;

    certifications.forEach((cert) => {
      const item = document.createElement('div');
      item.className = 'cert-card';

      const badge = document.createElement('div');
      badge.className = 'cert-badge';
      badge.setAttribute('aria-hidden', 'true');

      const name = document.createElement('h3');
      name.className = 'cert-name';
      name.textContent = cert.name;

      const issuer = document.createElement('p');
      issuer.className = 'cert-issuer';
      issuer.textContent = cert.issuer;

      const date = document.createElement('p');
      date.className = 'cert-date';
      date.textContent = cert.date;

      item.appendChild(badge);
      item.appendChild(name);
      item.appendChild(issuer);
      item.appendChild(date);
      row.appendChild(item);
    });
  }

  /* --------------------------------------------------------------------
     Skills
     -------------------------------------------------------------------- */
  function renderSkills() {
    const container = document.getElementById('skillsGroups');
    if (!container || typeof skills === 'undefined') return;

    skills.forEach((group) => {
      const wrap = document.createElement('div');
      wrap.className = 'skills-group';

      const heading = document.createElement('h3');
      heading.className = 'skills-group-title';
      heading.textContent = group.category;
      wrap.appendChild(heading);

      const pillRow = document.createElement('div');
      pillRow.className = 'skills-pill-row';
      (group.items || []).forEach((skill) => {
        const pill = document.createElement('span');
        pill.className = 'pill';
        pill.textContent = skill;
        pillRow.appendChild(pill);
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
    renderProjects();
    renderMiniProjects();
    renderCertifications();
    renderSkills();
    initProjectFilters();
    initCursorTrail();
  });
})();
