/* =========================================================
   PISA HUB — main.js
   Vanilla JS. No build step. Everything driven from the
   EVENTS / TEAM / ROLES data objects below — edit those to
   update real content. See README.md for details.
========================================================= */
(() => {
  "use strict";

  /* ---------------------------------------------------------
     ICONS (small inline SVG strings, reused across components)
  --------------------------------------------------------- */
  const ICONS = {
    instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg>`,
    linkedin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="7.5" y1="10" x2="7.5" y2="17"/><circle cx="7.5" cy="6.7" r="0.9" fill="currentColor" stroke="none"/><path d="M11.5 17v-4.2c0-1.6 1-2.6 2.4-2.6 1.4 0 2.1 1 2.1 2.6V17"/></svg>`,
    mic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="16" rx="2.5"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2.5" x2="8" y2="6.5"/><line x1="16" y1="2.5" x2="16" y2="6.5"/></svg>`,
    camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.6"/></svg>`,
    megaphone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 10v4a1 1 0 0 0 1 1h2l5 4V5L6 9H4a1 1 0 0 0-1 1Z"/><path d="M16 8a4 4 0 0 1 0 8"/><path d="M19 5a8 8 0 0 1 0 14"/></svg>`,
    tool: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a4 4 0 0 0-5.4 5l-6 6 2.4 2.4 6-6a4 4 0 0 0 5-5.4l-2.6 2.6-2-2Z"/></svg>`,
    handshake: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12l4-4 4 3 3-3 3 3 4-4 2 2-5 6-3-2-3 3-3-3-2 2Z"/><path d="M8 15l2.5 2.5a1.8 1.8 0 0 0 2.5 0L15 15.5"/></svg>`,
    link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10 14a4.8 4.8 0 0 0 7 0l2.5-2.5a4.9 4.9 0 0 0-7-7L11 6"/><path d="M14 10a4.8 4.8 0 0 0-7 0L4.5 12.5a4.9 4.9 0 0 0 7 7L13 18"/></svg>`
  };

  /* ---------------------------------------------------------
     DATA — EVENTS (single source of truth)
     status is computed live from `date` (+ optional `endDate`):
       now < date               -> "upcoming"
       date <= now <= end       -> "live"
       now > end                -> "closed"  -> auto-moves to
                                   Our Journey / History page
  --------------------------------------------------------- */
  const EVENTS = [
    {
      id: "orientation",
      title: "Spring Orientation Mixer",
      tagline: "First hello of the semester — icebreakers, chai and new faces.",
      date: "2026-02-10T18:00:00",
      location: "Kessel Student Center, Pace University",
      registerLink: "https://settersync.com/pisa/orientation-mixer",
      poster: "https://picsum.photos/seed/pisa-orientation/900/640",
      gallery: [
        "https://picsum.photos/seed/pisa-orientation-1/800/600",
        "https://picsum.photos/seed/pisa-orientation-2/800/600",
        "https://picsum.photos/seed/pisa-orientation-3/800/600",
        "https://picsum.photos/seed/pisa-orientation-4/800/600"
      ],
      description: "Our very first mixer of the spring semester — a low-key evening of introductions, snacks and sign-ups that set the tone for everything PISA built afterward."
    },
    {
      id: "beginning",
      title: "The Beginning — Welcome Kickoff",
      tagline: "Where it all started: chai, samosas and two hundred new friends.",
      date: "2026-08-18T17:00:00",
      location: "One Pace Plaza Lobby, New York",
      registerLink: "https://settersync.com/pisa/welcome-kickoff",
      poster: "https://picsum.photos/seed/pisa-beginning/900/640",
      gallery: [
        "https://picsum.photos/seed/pisa-begin-1/800/600",
        "https://picsum.photos/seed/pisa-begin-2/800/600",
        "https://picsum.photos/seed/pisa-begin-3/800/600",
        "https://picsum.photos/seed/pisa-begin-4/800/600",
        "https://picsum.photos/seed/pisa-begin-5/800/600"
      ],
      description: "The kickoff that opened Fall 2026 — new members, returning faces, and the first taste of what the semester would become."
    },
    {
      id: "akshardham",
      title: "Akshardham Cultural Visit",
      tagline: "A day trip to BAPS Swaminarayan Akshardham, Robbinsville.",
      date: "2026-08-24T09:00:00",
      endDate: "2026-08-24T20:00:00",
      location: "Meet at One Pace Plaza Lobby",
      registerLink: "https://settersync.com/pisa/akshardham-visit",
      poster: "https://picsum.photos/seed/pisa-akshardham/900/640",
      gallery: [
        "https://picsum.photos/seed/pisa-aksh-1/800/600",
        "https://picsum.photos/seed/pisa-aksh-2/800/600",
        "https://picsum.photos/seed/pisa-aksh-3/800/600"
      ],
      description: "A full-day cultural excursion to one of the largest Hindu temple complexes in the world — coach transport, guided tour and a shared meal included."
    },
    {
      id: "milan",
      title: "Milan — A Bollywood Welcome Night",
      tagline: "Culture. Community. Connection.",
      date: "2026-09-08T15:30:00",
      endDate: "2026-09-08T22:00:00",
      location: "Pace University, New York",
      registerLink: "https://settersync.com/pisa/milan",
      poster: "https://picsum.photos/seed/pisa-milan/900/640",
      gallery: [
        "https://picsum.photos/seed/pisa-milan-1/800/600",
        "https://picsum.photos/seed/pisa-milan-2/800/600",
        "https://picsum.photos/seed/pisa-milan-3/800/600"
      ],
      description: "Our biggest welcome night of the year — music, dance and a first taste of PISA for every new student at Pace."
    },
    {
      id: "garba",
      title: "Garba Night",
      tagline: "Dance. Dandiya. Delight.",
      date: "2026-10-13T17:00:00",
      endDate: "2026-10-13T23:00:00",
      location: "Pace University, New York",
      registerLink: "https://settersync.com/pisa/garba-night",
      poster: "https://picsum.photos/seed/pisa-garba/900/640",
      gallery: [
        "https://picsum.photos/seed/pisa-garba-1/800/600",
        "https://picsum.photos/seed/pisa-garba-2/800/600",
        "https://picsum.photos/seed/pisa-garba-3/800/600"
      ],
      description: "Two nights of dandiya sticks, circles of dancers and the loudest dhol on campus. Runs October 13 & 20."
    },
    {
      id: "diwali",
      title: "Diwali 2K26",
      tagline: "Lights, laddoos and the biggest night of the semester.",
      date: "2026-11-08T18:00:00",
      endDate: "2026-11-08T23:30:00",
      location: "Pace University, New York",
      registerLink: "https://settersync.com/pisa/diwali-2k26",
      poster: "https://picsum.photos/seed/pisa-diwali/900/640",
      gallery: [
        "https://picsum.photos/seed/pisa-diwali-1/800/600",
        "https://picsum.photos/seed/pisa-diwali-2/800/600",
        "https://picsum.photos/seed/pisa-diwali-3/800/600"
      ],
      description: "The festival of lights, PISA-style — diyas, a full dinner spread and a dance floor that doesn't stop."
    },

    /* ---- past semesters (populate Our Journey & the Gallery) ---- */
    {
      id: "holi-2025",
      title: "Holi Rangotsav 2025",
      tagline: "A riot of color on the Pace plaza lawn.",
      date: "2025-03-14T13:00:00",
      endDate: "2025-03-14T17:00:00",
      location: "One Pace Plaza Lawn, New York",
      registerLink: "https://settersync.com/pisa/holi-2025",
      poster: "https://picsum.photos/seed/pisa-holi25/900/640",
      gallery: [
        "https://picsum.photos/seed/pisa-holi25-1/800/600",
        "https://picsum.photos/seed/pisa-holi25-2/800/600",
        "https://picsum.photos/seed/pisa-holi25-3/800/600",
        "https://picsum.photos/seed/pisa-holi25-4/800/600",
        "https://picsum.photos/seed/pisa-holi25-5/800/600",
        "https://picsum.photos/seed/pisa-holi25-6/800/600"
      ],
      description: "Our first outdoor Holi — clouds of gulaal, dhol beats and the whole community drenched in color under a spring sky."
    },
    {
      id: "basant-2025",
      title: "Basant Spring Formal 2025",
      tagline: "An elegant close to the spring semester.",
      date: "2025-04-19T18:30:00",
      endDate: "2025-04-19T23:00:00",
      location: "Kessel Student Center, Pace University",
      registerLink: "https://settersync.com/pisa/basant-2025",
      poster: "https://picsum.photos/seed/pisa-basant25/900/640",
      gallery: [
        "https://picsum.photos/seed/pisa-basant25-1/800/600",
        "https://picsum.photos/seed/pisa-basant25-2/800/600",
        "https://picsum.photos/seed/pisa-basant25-3/800/600",
        "https://picsum.photos/seed/pisa-basant25-4/800/600",
        "https://picsum.photos/seed/pisa-basant25-5/800/600"
      ],
      description: "A dressed-up evening of dinner, awards and dancing to send off the graduating class of spring 2025."
    },
    {
      id: "navratri-2025",
      title: "Navratri Garba 2025",
      tagline: "Nine nights, one unforgettable circle.",
      date: "2025-10-03T18:00:00",
      endDate: "2025-10-03T23:00:00",
      location: "Pace University, New York",
      registerLink: "https://settersync.com/pisa/navratri-2025",
      poster: "https://picsum.photos/seed/pisa-navratri25/900/640",
      gallery: [
        "https://picsum.photos/seed/pisa-nav25-1/800/600",
        "https://picsum.photos/seed/pisa-nav25-2/800/600",
        "https://picsum.photos/seed/pisa-nav25-3/800/600",
        "https://picsum.photos/seed/pisa-nav25-4/800/600",
        "https://picsum.photos/seed/pisa-nav25-5/800/600",
        "https://picsum.photos/seed/pisa-nav25-6/800/600"
      ],
      description: "The fall semester kicked off with dandiya sticks, spinning chaniya cholis and the largest garba circle PISA had ever hosted."
    },
    {
      id: "diwali-2025",
      title: "Diwali 2K25",
      tagline: "The night the plaza glowed.",
      date: "2025-11-01T18:00:00",
      endDate: "2025-11-01T23:30:00",
      location: "One Pace Plaza, New York",
      registerLink: "https://settersync.com/pisa/diwali-2025",
      poster: "https://picsum.photos/seed/pisa-diwali25/900/640",
      gallery: [
        "https://picsum.photos/seed/pisa-diw25-1/800/600",
        "https://picsum.photos/seed/pisa-diw25-2/800/600",
        "https://picsum.photos/seed/pisa-diw25-3/800/600",
        "https://picsum.photos/seed/pisa-diw25-4/800/600",
        "https://picsum.photos/seed/pisa-diw25-5/800/600",
        "https://picsum.photos/seed/pisa-diw25-6/800/600",
        "https://picsum.photos/seed/pisa-diw25-7/800/600"
      ],
      description: "Hundreds of diyas, a catered dinner and a packed dance floor — the celebration that set the bar for every Diwali since."
    }
  ];

  /* ---------------------------------------------------------
     DATA — TEAM
     Replace photoSeed with a real image path once you have
     headshots — see README.md.
  --------------------------------------------------------- */
  /* Teams are keyed by semester so members can be browsed term-by-term. */
  const TEAMS_BY_SEM = {
    "Fall 2026": {
      exec: [
        { name: "Pritha Arora", role: "President", quote: "Trust the process.", photoSeed: "pritha-arora-president", instagram: "https://instagram.com", linkedin: "https://linkedin.com" },
        { name: "Add Name", role: "Vice President", quote: "Add a quote.", photoSeed: "vp-f26", instagram: "#", linkedin: "#" },
        { name: "Add Name", role: "Secretary", quote: "Add a quote.", photoSeed: "sec-f26", instagram: "#", linkedin: "#" },
        { name: "Add Name", role: "Treasurer", quote: "Add a quote.", photoSeed: "trs-f26", instagram: "#", linkedin: "#" }
      ],
      committee: [
        { name: "Add Name", role: "Marketing Lead", photoSeed: "mkt-f26", instagram: "#", linkedin: "#" },
        { name: "Add Name", role: "Events Lead", photoSeed: "evt-f26", instagram: "#", linkedin: "#" },
        { name: "Add Name", role: "Outreach Lead", photoSeed: "out-f26", instagram: "#", linkedin: "#" },
        { name: "Add Name", role: "Operations Lead", photoSeed: "ops-f26", instagram: "#", linkedin: "#" }
      ]
    },
    "Fall 2025": {
      exec: [
        { name: "Aarav Mehta", role: "President", quote: "Build something people remember.", photoSeed: "prez-f25", instagram: "#", linkedin: "#" },
        { name: "Isha Kapoor", role: "Vice President", quote: "Every event is a team win.", photoSeed: "vp-f25", instagram: "#", linkedin: "#" },
        { name: "Rohan Nair", role: "Secretary", quote: "Details make the difference.", photoSeed: "sec-f25", instagram: "#", linkedin: "#" },
        { name: "Ananya Rao", role: "Treasurer", quote: "Dream big, budget smart.", photoSeed: "trs-f25", instagram: "#", linkedin: "#" }
      ],
      committee: [
        { name: "Karan Shah", role: "Marketing Lead", photoSeed: "mkt-f25", instagram: "#", linkedin: "#" },
        { name: "Diya Patel", role: "Events Lead", photoSeed: "evt-f25", instagram: "#", linkedin: "#" },
        { name: "Vikram Iyer", role: "Outreach Lead", photoSeed: "out-f25", instagram: "#", linkedin: "#" }
      ]
    },
    "Spring 2025": {
      exec: [
        { name: "Aarav Mehta", role: "President", quote: "Where it all began.", photoSeed: "prez-s25", instagram: "#", linkedin: "#" },
        { name: "Meera Joshi", role: "Vice President", quote: "Community first, always.", photoSeed: "vp-s25", instagram: "#", linkedin: "#" },
        { name: "Rohan Nair", role: "Secretary", quote: "Show up for each other.", photoSeed: "sec-s25", instagram: "#", linkedin: "#" },
        { name: "Sana Gupta", role: "Treasurer", quote: "Small org, big heart.", photoSeed: "trs-s25", instagram: "#", linkedin: "#" }
      ],
      committee: [
        { name: "Karan Shah", role: "Marketing Lead", photoSeed: "mkt-s25", instagram: "#", linkedin: "#" },
        { name: "Neha Reddy", role: "Events Lead", photoSeed: "evt-s25", instagram: "#", linkedin: "#" }
      ]
    }
  };

  /* ---------------------------------------------------------
     DATA — VOLUNTEER ROLES
  --------------------------------------------------------- */
  const ROLES = [
    { id: "performer", title: "Performer", desc: "Dance, sing or showcase your talent on stage at PISA events.", icon: ICONS.mic },
    { id: "organizer", title: "Event Organizer", desc: "Plan logistics, timelines and run-of-show from start to finish.", icon: ICONS.calendar },
    { id: "media", title: "Photographer / Videographer", desc: "Capture the moments that become Our Journey.", icon: ICONS.camera },
    { id: "marketing", title: "Marketing & Social Media", desc: "Design posts, write captions and help us grow our reach.", icon: ICONS.megaphone },
    { id: "logistics", title: "Logistics & Setup", desc: "Decor, sound, seating — the backbone of every great event.", icon: ICONS.tool },
    { id: "outreach", title: "Outreach & Hospitality", desc: "Welcome guests and build ties with other student orgs.", icon: ICONS.handshake }
  ];

  /* ---------------------------------------------------------
     HELPERS
  --------------------------------------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function fmtTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  function semesterOf(iso) {
    const d = new Date(iso);
    const m = d.getMonth() + 1; // 1-12
    const y = d.getFullYear();
    if (m >= 8 && m <= 12) return `Fall ${y}`;
    if (m >= 1 && m <= 5) return `Spring ${y}`;
    return `Summer ${y}`;
  }
  function semesterSortKey(sem) {
    const [term, yr] = sem.split(" ");
    const t = term === "Fall" ? 3 : term === "Summer" ? 2 : 1;
    return Number(yr) * 10 + t;
  }
  function sortSemestersDesc(list) {
    return Array.from(new Set(list)).sort((a, b) => semesterSortKey(b) - semesterSortKey(a));
  }
  function getStatus(ev) {
    const now = new Date();
    const start = new Date(ev.date);
    const end = ev.endDate ? new Date(ev.endDate) : new Date(start.getTime() + 6 * 60 * 60 * 1000);
    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "live";
    return "closed";
  }
  function avatarUrl(seed) {
    return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=d9c7a0,e08a3c,5c7a54`;
  }
  function teamCardMarkup(member, small) {
    return `
      <article class="team-card">
        <div class="team-card__photo"><img src="${avatarUrl(member.photoSeed)}" alt="${member.name}" loading="lazy"></div>
        <span class="team-card__role">${member.role}</span>
        <div class="team-card__body">
          <h3>${member.name}</h3>
          ${member.quote ? `<p class="team-card__quote">"${member.quote}"</p>` : ""}
          <div class="team-card__socials">
            <a href="${member.instagram}" target="_blank" rel="noopener" aria-label="${member.name} on Instagram">${ICONS.instagram}</a>
            <a href="${member.linkedin}" target="_blank" rel="noopener" aria-label="${member.name} on LinkedIn">${ICONS.linkedin}</a>
          </div>
        </div>
      </article>`;
  }

  /* ===========================================================
     ROUTER
  =========================================================== */
  const ROUTES = ["home", "history", "team", "volunteer", "events", "gallery"];
  let currentRoute = "home";

  function resolveRoute() {
    const hash = (location.hash || "#home").replace("#", "");
    return ROUTES.includes(hash) ? hash : "home";
  }

  function navigate(route, { replace = false } = {}) {
    if (!ROUTES.includes(route)) route = "home";
    currentRoute = route;

    $$(".page").forEach((p) => p.classList.toggle("is-active", p.dataset.page === route));
    $$('[data-route]').forEach((el) => el.classList.toggle("is-active", el.dataset.route === route && el.tagName === "A" && el.closest(".nav__links, .mobile-menu")));

    window.scrollTo({ top: 0, behavior: "auto" });
    closeMobileMenu();
    updateNavChrome();

    if (route === "history") renderTimeline();
    if (route === "team") renderTeam();
    if (route === "volunteer") renderVolunteer();
    if (route === "events") renderLiveEvents();
    if (route === "home") renderHome();
    if (route === "gallery") renderGallery();

    if (!replace) history.pushState({ route }, "", `#${route}`);
  }

  window.addEventListener("popstate", () => navigate(resolveRoute(), { replace: true }));
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-route]");
    if (!link) return;
    e.preventDefault();
    navigate(link.dataset.route);
  });

  /* ===========================================================
     NAV CHROME (scrolled state + dark/light theme)
  =========================================================== */
  const nav = $("#mainNav");

  function updateNavChrome() {
    const scrolled = window.scrollY > 40;
    nav.classList.toggle("is-scrolled", scrolled);

    let onDark;
    if (currentRoute === "home") {
      onDark = window.scrollY < window.innerHeight * 0.92;
    } else {
      onDark = window.scrollY < 380;
    }
    nav.classList.toggle("is-on-dark", onDark);
  }

  window.addEventListener("scroll", () => {
    updateNavChrome();
    if (currentRoute === "home") updateGateProgress();
  }, { passive: true });

  /* mobile menu */
  const burger = $("#navBurger");
  const mobileMenu = $("#mobileMenu");
  function closeMobileMenu() {
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("is-open");
  }
  burger.addEventListener("click", () => {
    const open = burger.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    mobileMenu.classList.toggle("is-open", open);
  });

  /* ===========================================================
     GATE HERO — scroll-linked opening animation
  =========================================================== */
  const gateHero = $("#gateHero");
  const gateSticky = $("#gateSticky");
  const leafLeft = $("#leafLeft");
  const leafRight = $("#leafRight");
  const gateCaption = $("#gateCaption");

  // ease so the doors hold, then swing — reads more like real hinges than a linear slide
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function updateGateProgress() {
    if (!gateHero) return;
    const start = gateHero.offsetTop;
    const total = gateHero.offsetHeight - window.innerHeight;
    let progress = (window.scrollY - start) / total;
    progress = Math.min(Math.max(progress, 0), 1);

    // publish progress so CSS can drive the dolly-in, threshold and daylight glow
    if (gateSticky) gateSticky.style.setProperty("--gp", progress.toFixed(4));

    // doors swing on eased progress and lean toward the viewer as they open
    const doorP = easeInOut(progress);
    const angle = doorP * 116;
    const lift = doorP * 60;
    leafLeft.style.transform = `translateZ(${lift}px) rotateY(-${angle}deg)`;
    leafRight.style.transform = `translateZ(${lift}px) rotateY(${angle}deg)`;

    // caption fades and recedes into the gateway as you step through
    const captionOpacity = 1 - Math.min(progress / 0.32, 1);
    gateCaption.style.opacity = captionOpacity;
    gateCaption.style.transform =
      `translateY(${(1 - captionOpacity) * -14}px) translateZ(${progress * -180}px) scale(${1 - progress * 0.06})`;
    gateCaption.classList.toggle("is-visible", true);
  }

  /* ===========================================================
     SCROLL REVEALS (generic .reveal-up)
  =========================================================== */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, { threshold: 0.2 });

  function observeReveals(root = document) {
    $$(".reveal-up", root).forEach((el) => revealObserver.observe(el));
  }

  /* ===========================================================
     HOME PAGE RENDER
  =========================================================== */
  function renderHome() {
    const upcoming = EVENTS.filter((e) => getStatus(e) !== "closed").sort((a, b) => new Date(a.date) - new Date(b.date));
    const next = upcoming[0];

    // Happening Next
    const card = $("#happeningCard");
    if (next) {
      const status = getStatus(next);
      card.innerHTML = `
        <div>
          <span class="happening-card__badge"><span class="dot"></span>${status === "live" ? "Live Now" : "Next Up"}</span>
          <h3>${next.title}</h3>
          <p class="tagline">${next.tagline}</p>
          <div class="happening-card__meta">
            <span>🗓 ${fmtDate(next.date)}</span>
            <span>⏰ ${fmtTime(next.date)}</span>
            <span>📍 ${next.location}</span>
          </div>
          <div class="happening-card__ctas">
            <a class="btn btn--primary" href="${next.registerLink}" target="_blank" rel="noopener">Register Now →</a>
            <a class="btn btn--ghost" href="#events" data-route="events">View Details</a>
          </div>
        </div>
        <div class="happening-card__visual"><img src="${next.poster}" alt="${next.title}" loading="lazy"></div>`;
    } else {
      card.innerHTML = `<p>No upcoming events right now — check back soon.</p>`;
    }

    // Upcoming grid (skip the "next" one shown above, show next 3)
    const grid = $("#upcomingGrid");
    grid.innerHTML = upcoming.slice(1, 4).map((ev) => eventCardMarkup(ev)).join("") ||
      upcoming.slice(0, 3).map((ev) => eventCardMarkup(ev)).join("");

    // Journey strip (most recent 5 history items)
    const history = EVENTS.filter((e) => getStatus(e) === "closed").sort((a, b) => new Date(a.date) - new Date(b.date));
    const strip = $("#journeyStrip");
    strip.innerHTML = history.map((ev, i) => `
      <a class="journey-card" href="#history" data-route="history">
        <div class="journey-card__img"><img src="${ev.poster}" alt="${ev.title}" loading="lazy"></div>
        <div class="journey-card__body">
          <span class="num">0${i + 1}</span>
          <h4>${ev.title}</h4>
        </div>
      </a>`).join("") || `<p style="color:var(--brown-mid)">Our first completed event will appear here once it wraps up.</p>`;

    observeReveals();
  }

  function eventCardMarkup(ev) {
    const status = getStatus(ev);
    const statusLabel = status === "live" ? "Live Now" : status === "upcoming" ? "Open for Registration" : "Closed";
    return `
      <article class="event-card">
        <div class="event-card__img">
          <img src="${ev.poster}" alt="${ev.title}" loading="lazy">
          <span class="status-chip status-chip--${status}">${statusLabel}</span>
        </div>
        <div class="event-card__body">
          <h3>${ev.title}</h3>
          <p class="event-card__meta">${fmtDate(ev.date)} · ${fmtTime(ev.date)}</p>
          <p class="tagline">${ev.tagline}</p>
          <div class="event-card__foot">
            <a class="text-link" href="#events" data-route="events">Details →</a>
            <a class="text-link" href="${ev.registerLink}" target="_blank" rel="noopener">Register ↗</a>
          </div>
        </div>
      </article>`;
  }

  /* ===========================================================
     HISTORY / TIMELINE PAGE
  =========================================================== */
  let timelineRendered = false;
  function renderTimeline() {
    const history = EVENTS.filter((e) => getStatus(e) === "closed").sort((a, b) => new Date(a.date) - new Date(b.date));
    const wrap = $("#timeline");

    if (!history.length) {
      wrap.innerHTML = `<p style="text-align:center;color:var(--brown-mid)">No completed events yet — once an event's date passes, it will automatically appear here with its full story.</p>`;
      return;
    }

    const groups = {};
    history.forEach((ev) => {
      const sem = semesterOf(ev.date);
      groups[sem] = groups[sem] || [];
      groups[sem].push(ev);
    });

    wrap.innerHTML = Object.entries(groups).map(([sem, items]) => `
      <div class="timeline__semester">
        <p class="timeline__semester-label">${sem}</p>
        ${items.map((ev, i) => `
          <div class="timeline-item" data-id="${ev.id}">
            <p class="timeline-item__num">0${i + 1}</p>
            <div class="timeline-item__head">
              <div>
                <h3>${ev.title}</h3>
                <p class="timeline-item__meta">${fmtDate(ev.date)} · ${ev.location}</p>
              </div>
              <span class="timeline-item__expand">+</span>
            </div>
            <div class="timeline-item__panel">
              <div class="timeline-item__panel-inner">
                <div class="timeline-item__gallery">
                  ${ev.gallery.map((src, gi) => `<img src="${src}" alt="${ev.title} photo ${gi + 1}" data-gallery-open="${ev.id}" data-index="${gi}" loading="lazy">`).join("")}
                </div>
                <p>${ev.description}</p>
              </div>
            </div>
          </div>`).join("")}
      </div>`).join("");

    $$(".timeline-item__head", wrap).forEach((head) => {
      head.addEventListener("click", () => {
        head.closest(".timeline-item").classList.toggle("is-open");
      });
    });
    $$("[data-gallery-open]", wrap).forEach((img) => {
      img.addEventListener("click", (e) => {
        e.stopPropagation();
        openGallery(img.dataset.galleryOpen, Number(img.dataset.index));
      });
    });

    // striking reveal: each node lights up and its connector draws as it scrolls in
    const items = $$(".timeline-item", wrap);
    items.forEach((it, i) => it.style.setProperty("--i", i));
    if (tlObserver) tlObserver.disconnect();
    tlObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-inview");
          tlObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -12% 0px" });
    items.forEach((it) => tlObserver.observe(it));
  }
  let tlObserver = null;

  /* ===========================================================
     TEAM PAGE
  =========================================================== */
  let teamSelectBuilt = false;
  function paintTeam(sem) {
    const team = TEAMS_BY_SEM[sem];
    if (!team) return;
    const exec = team.exec || [];
    const committee = team.committee || [];
    $("#teamExecGrid").innerHTML = exec.map((m) => teamCardMarkup(m)).join("");
    $("#teamCommitteeGrid").innerHTML = committee.length
      ? committee.map((m) => teamCardMarkup(m)).join("")
      : `<p style="color:var(--brown-mid)">Committee roster for this term is being finalized.</p>`;
    $("#teamPhotoRow").innerHTML = exec.map((m) => `<div class="stack-photo"><img src="${avatarUrl(m.photoSeed)}" alt="${m.name}"></div>`).join("");
  }

  function renderTeam() {
    const semesters = sortSemestersDesc(Object.keys(TEAMS_BY_SEM));
    const select = $("#teamSemSelect");
    if (select && !teamSelectBuilt) {
      select.innerHTML = semesters.map((s) => `<option value="${s}">${s}</option>`).join("");
      select.addEventListener("change", () => paintTeam(select.value));
      teamSelectBuilt = true;
    }
    const active = select ? select.value || semesters[0] : semesters[0];
    if (select) select.value = active;
    paintTeam(active);
  }

  /* ===========================================================
     GALLERY PAGE — all event photos, filtered by semester
  =========================================================== */
  let gallerySelectBuilt = false;
  function galleryEventsBySemester() {
    const withPhotos = EVENTS.filter((e) => Array.isArray(e.gallery) && e.gallery.length);
    const groups = {};
    withPhotos.forEach((ev) => {
      const sem = semesterOf(ev.date);
      (groups[sem] = groups[sem] || []).push(ev);
    });
    Object.values(groups).forEach((list) => list.sort((a, b) => new Date(b.date) - new Date(a.date)));
    return groups;
  }

  function paintGallery(sem) {
    const groups = galleryEventsBySemester();
    const events = groups[sem] || [];
    const grid = $("#galleryContent");
    const count = events.reduce((n, ev) => n + ev.gallery.length, 0);
    $("#gallerySemMeta").textContent = `${events.length} event${events.length === 1 ? "" : "s"} · ${count} photo${count === 1 ? "" : "s"}`;

    grid.innerHTML = events.map((ev) => `
      <section class="gallery-group">
        <div class="gallery-group__head">
          <h3>${ev.title}</h3>
          <span>${fmtDate(ev.date)} · ${ev.location}</span>
        </div>
        <div class="gallery-masonry">
          ${ev.gallery.map((src, gi) => `
            <button class="gallery-tile" data-gallery-open="${ev.id}" data-index="${gi}" aria-label="Open ${ev.title} photo ${gi + 1}">
              <img src="${src}" alt="${ev.title} photo ${gi + 1}" loading="lazy">
              <span class="gallery-tile__glow"></span>
            </button>`).join("")}
        </div>
      </section>`).join("") || `<p style="color:var(--brown-mid);text-align:center">No photos for this semester yet.</p>`;

    $$("[data-gallery-open]", grid).forEach((btn) => {
      btn.addEventListener("click", () => openGallery(btn.dataset.galleryOpen, Number(btn.dataset.index)));
    });

    const tiles = $$(".gallery-tile", grid);
    tiles.forEach((t, i) => { t.style.setProperty("--i", i % 12); });
    requestAnimationFrame(() => grid.classList.add("is-in"));
  }

  function renderGallery() {
    const groups = galleryEventsBySemester();
    const semesters = sortSemestersDesc(Object.keys(groups));
    const select = $("#gallerySemSelect");
    if (select && !gallerySelectBuilt) {
      select.innerHTML = semesters.map((s) => `<option value="${s}">${s}</option>`).join("");
      select.addEventListener("change", () => {
        $("#galleryContent").classList.remove("is-in");
        paintGallery(select.value);
      });
      gallerySelectBuilt = true;
    }
    const active = select ? select.value || semesters[0] : semesters[0];
    if (select) select.value = active;
    paintGallery(active);
  }

  /* ===========================================================
     VOLUNTEER PAGE
  =========================================================== */
  let volunteerRendered = false;
  function renderVolunteer() {
    if (volunteerRendered) return;
    volunteerRendered = true;

    $("#rolesGrid").innerHTML = ROLES.map((r) => `
      <div class="role-card">
        <div class="role-card__icon">${r.icon}</div>
        <h3>${r.title}</h3>
        <p>${r.desc}</p>
      </div>`).join("");

    $("#checkboxGrid").innerHTML = ROLES.map((r) => `
      <label class="checkbox-chip">
        <input type="checkbox" name="roles" value="${r.id}">
        <span>${r.title}</span>
      </label>`).join("");

    $$(".checkbox-chip input", $("#checkboxGrid")).forEach((input) => {
      input.addEventListener("change", () => {
        input.closest(".checkbox-chip").classList.toggle("is-checked", input.checked);
      });
    });

    $("#scrollToForm").addEventListener("click", (e) => {
      e.preventDefault();
      $("#volunteerForm").scrollIntoView({ behavior: "smooth" });
    });

    const form = $("#volForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      form.style.display = "none";
      $("#formSuccess").classList.add("is-visible");
    });
    $("#formReset").addEventListener("click", () => {
      form.reset();
      form.style.display = "flex";
      $("#formSuccess").classList.remove("is-visible");
    });
  }

  /* ===========================================================
     LIVE EVENTS PAGE + FLIP COUNTDOWN
  =========================================================== */
  let countdownTimer = null;
  const prevUnitValues = {};

  function renderLiveEvents() {
    const list = EVENTS.filter((e) => getStatus(e) !== "closed").sort((a, b) => new Date(a.date) - new Date(b.date));
    const wrap = $("#eventsList");

    if (!list.length) {
      wrap.innerHTML = `<p style="text-align:center;color:var(--brown-mid)">Nothing open for registration right now — check Our Journey to relive what we've already done.</p>`;
      return;
    }

    wrap.innerHTML = list.map((ev) => `
      <article class="live-card" data-id="${ev.id}">
        <div class="live-card__img"><img src="${ev.poster}" alt="${ev.title}" loading="lazy"></div>
        <div class="live-card__body">
          <div class="live-card__top">
            <span class="status-chip status-chip--${getStatus(ev)}" data-status-chip="${ev.id}">${getStatus(ev) === "live" ? "Live Now" : "Open for Registration"}</span>
          </div>
          <h3>${ev.title}</h3>
          <p class="live-card__tagline">${ev.tagline}</p>
          <div class="live-card__meta">
            <span>🗓 ${fmtDate(ev.date)}</span>
            <span>⏰ ${fmtTime(ev.date)}</span>
            <span>📍 ${ev.location}</span>
          </div>
          <div class="flip-timer" id="flip-${ev.id}" data-date="${ev.date}">
            ${["Days", "Hrs", "Min", "Sec"].map((label) => `
              <div class="flip-unit">
                <div class="flip-unit__face" data-unit="${label}">00</div>
                <span class="flip-unit__label">${label}</span>
              </div>`).join("")}
          </div>
          <div class="live-card__ctas">
            <a class="btn btn--primary" href="${ev.registerLink}" target="_blank" rel="noopener">Register on Settersync ↗</a>
            <a class="btn btn--ghost" href="#volunteer" data-route="volunteer">Volunteer for this event</a>
          </div>
        </div>
      </article>`).join("");

    if (countdownTimer) clearInterval(countdownTimer);
    tickCountdowns();
    countdownTimer = setInterval(tickCountdowns, 1000);
  }

  function tickCountdowns() {
    $$(".flip-timer", $("#eventsList")).forEach((timerEl) => {
      const id = timerEl.id.replace("flip-", "");
      const target = new Date(timerEl.dataset.date).getTime();
      const now = Date.now();
      let diff = target - now;

      const chip = document.querySelector(`[data-status-chip="${id}"]`);
      const card = timerEl.closest(".live-card");

      if (diff <= 0) {
        // event has started or passed — if fully closed, remove card (moves to History)
        const ev = EVENTS.find((e) => e.id === id);
        const status = getStatus(ev);
        if (status === "closed") {
          card.classList.add("is-closed");
          if (chip) { chip.textContent = "Closed"; chip.className = "status-chip status-chip--closed"; }
          $$(".flip-unit__face", timerEl).forEach((f) => (f.textContent = "00"));
          return;
        }
        // live now
        timerEl.classList.add("is-live");
        if (chip) { chip.textContent = "Live Now"; chip.className = "status-chip status-chip--live"; }
        diff = 0;
      }

      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const values = { Days: d, Hrs: h, Min: m, Sec: s };

      $$(".flip-unit__face", timerEl).forEach((face) => {
        const unit = face.dataset.unit;
        const val = String(values[unit]).padStart(2, "0");
        const key = id + unit;
        if (prevUnitValues[key] !== val) {
          face.textContent = val;
          face.classList.remove("flip");
          void face.offsetWidth;
          face.classList.add("flip");
          prevUnitValues[key] = val;
        }
      });
    });
  }

  /* ===========================================================
     GALLERY MODAL / CAROUSEL
  =========================================================== */
  const modal = $("#galleryModal");
  const carouselTrack = $("#carouselTrack");
  const carouselDots = $("#carouselDots");
  let carouselIndex = 0;
  let carouselLength = 0;

  function openGallery(eventId, startIndex = 0) {
    const ev = EVENTS.find((e) => e.id === eventId);
    if (!ev) return;

    $("#modalEyebrow").textContent = semesterOf(ev.date).toUpperCase();
    $("#modalTitle").textContent = ev.title;
    $("#modalMeta").textContent = `${fmtDate(ev.date)} · ${ev.location}`;
    $("#modalDesc").textContent = ev.description;

    carouselTrack.innerHTML = ev.gallery.map((src, i) => `<img src="${src}" alt="${ev.title} photo ${i + 1}">`).join("");
    carouselDots.innerHTML = ev.gallery.map((_, i) => `<span data-dot="${i}"></span>`).join("");
    carouselLength = ev.gallery.length;
    carouselIndex = Math.min(startIndex, carouselLength - 1);
    updateCarousel();

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeGallery() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function updateCarousel() {
    carouselTrack.style.transform = `translateX(-${carouselIndex * 100}%)`;
    $$("span", carouselDots).forEach((dot, i) => dot.classList.toggle("is-active", i === carouselIndex));
  }

  $("#carouselPrev").addEventListener("click", () => {
    carouselIndex = (carouselIndex - 1 + carouselLength) % carouselLength;
    updateCarousel();
  });
  $("#carouselNext").addEventListener("click", () => {
    carouselIndex = (carouselIndex + 1) % carouselLength;
    updateCarousel();
  });
  $("#modalClose").addEventListener("click", closeGallery);
  $("#modalBackdrop").addEventListener("click", closeGallery);
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") closeGallery();
    if (e.key === "ArrowRight") $("#carouselNext").click();
    if (e.key === "ArrowLeft") $("#carouselPrev").click();
  });

  /* ===========================================================
     POLISHED CURSOR (desktop) — with a hint label over the gate
  =========================================================== */
  function initCursor() {
    const fine = window.matchMedia("(pointer:fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce || window.innerWidth <= 860) return;
    const dot = $("#cursorDot"), ring = $("#cursorRing");
    if (!dot || !ring) return;
    document.body.classList.add("cursor-on");

    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    const interactive = "a, button, label, select, .gallery-tile, [data-route]";

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-3px,-2px)`;
    }, { passive: true });
    document.addEventListener("mouseover", (e) => { if (e.target.closest(interactive)) ring.classList.add("is-hover"); });
    document.addEventListener("mouseout", (e) => { if (e.target.closest(interactive)) ring.classList.remove("is-hover"); });

    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ===========================================================
     ENGAGEMENT TOASTS — reward long visits, catch quick exits
  =========================================================== */
  function showToast({ emoji, title, msg, ctaText, route, ctaHref, dur = 9000 }) {
    const wrap = $("#toastWrap");
    if (!wrap) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.style.setProperty("--dur", dur + "ms");
    const ctaHtml = !ctaText ? "" : ctaHref
      ? `<a class="toast__cta" href="${ctaHref}" target="_blank" rel="noopener">${ctaText}</a>`
      : `<a class="toast__cta" href="#${route}" data-route="${route}">${ctaText}</a>`;
    el.innerHTML = `
      <span class="toast__emoji">${emoji}</span>
      <div class="toast__body">
        <p class="toast__title">${title}</p>
        <p class="toast__msg">${msg}</p>
        ${ctaHtml}
      </div>
      <button class="toast__close" aria-label="Dismiss">✕</button>`;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-in"));
    const remove = () => { el.classList.remove("is-in"); setTimeout(() => el.remove(), 500); };
    let timer = setTimeout(remove, dur);
    el.querySelector(".toast__close").addEventListener("click", remove);
    const cta = el.querySelector(".toast__cta");
    if (cta) cta.addEventListener("click", remove);
    el.addEventListener("mouseenter", () => clearTimeout(timer));
  }

  function nextUpcomingEvent() {
    return EVENTS.filter((e) => getStatus(e) !== "closed")
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  }

  // both popups spotlight the latest upcoming event with a Register button
  function upcomingToast(kind) {
    const ev = nextUpcomingEvent();
    if (ev) {
      const when = `${fmtDate(ev.date)} · ${fmtTime(ev.date)}`;
      showToast({
        emoji: kind === "long" ? "🎉" : "👋",
        title: kind === "long" ? `Don't miss ${ev.title}!` : "Leaving so soon?",
        msg: kind === "long"
          ? `You're clearly into PISA — our next event, ${ev.title}, is ${when}. Grab your spot.`
          : `Register for ${ev.title} (${when}) before you go.`,
        ctaText: "Register now →", ctaHref: ev.registerLink, dur: 12000
      });
    } else {
      showToast({
        emoji: kind === "long" ? "🎉" : "👋",
        title: kind === "long" ? "Still exploring? Love that." : "Leaving so soon?",
        msg: "Catch up on everything PISA has coming up next.",
        ctaText: "See events →", route: "events", dur: 10000
      });
    }
  }

  function initEngagementToasts() {
    const start = Date.now();
    let longShown = false, exitShown = false;

    // reward the curious (5s for demo; use 10*60*1000 for 10 minutes)
    setTimeout(() => {
      if (longShown) return; longShown = true;
      upcomingToast("long");
    }, 5 * 1000);

    // catch quick leavers: cursor darts off the top edge (2s window for demo; use 2*60*1000)
    document.addEventListener("mouseout", (e) => {
      if (exitShown || e.clientY > 0 || e.relatedTarget) return;
      if (Date.now() - start > 2 * 1000) return;
      exitShown = true;
      upcomingToast("exit");
    });
  }

  /* ===========================================================
     INIT
  =========================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    $("#year").textContent = new Date().getFullYear();
    updateGateProgress();
    updateNavChrome();
    navigate(resolveRoute(), { replace: true });
    observeReveals();
    initCursor();
    initEngagementToasts();
  });

  window.addEventListener("resize", () => {
    if (currentRoute === "home") updateGateProgress();
  });

})();
