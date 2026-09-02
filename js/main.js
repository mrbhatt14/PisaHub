/* =========================================================
   PISA HUB - main.js
   Vanilla JS. No build step. Everything driven from the
   EVENTS / TEAM / ROLES data objects below - edit those to
   update real content. See README.md for details.
========================================================= */
(() => {
  "use strict";

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

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
     DATA - EVENTS (single source of truth)
     status is computed live from `date` (+ optional `endDate`):
       now < date               -> "upcoming"
       date <= now <= end       -> "live"
       now > end                -> "closed"  -> auto-moves to
                                   Our Journey / History page
  --------------------------------------------------------- */
  const EVENTS = [
    {
      id: "beginning",
      title: "The Beginning - Welcome Kickoff",
      tagline: "Where it all started: chai, samosas and two hundred new friends.",
      date: "2026-08-18T17:00:00",
      location: "One Pace Plaza Lobby, New York",
      registerLink: "https://settersyncnyc.pace.edu/organization/pisa",
      poster: "img/events/beginning/poster.jpg",
      gallery: [
        "img/events/beginning/gallery-1.jpg",
        "img/events/beginning/gallery-2.jpg",
        "img/events/beginning/gallery-3.jpg",
        "img/events/beginning/gallery-4.jpg",
        "img/events/beginning/gallery-5.jpg"
      ],
      description: "The kickoff that opened Fall 2026 - new members, returning faces, and the first taste of what the semester would become."
    },
    {
      id: "milan",
      title: "The PISA Premiere",
      tagline: "The Bollywood-inspired welcome that opens every semester.",
      date: "2026-09-08T15:30:00",
      endDate: "2026-09-08T22:00:00",
      location: "Pace University, New York",
      registerLink: "https://settersyncnyc.pace.edu/event/12643233",
      poster: "img/events/milan/poster.jpg",
      showPoster: true,
      gallery: [
        "img/events/milan/gallery-1.jpg",
        "img/events/milan/gallery-2.jpg",
        "img/events/milan/gallery-3.jpg"
      ],
      description: "The opening celebration of every semester - a Bollywood-inspired welcome featuring music, dance, food, introductions, and the unveiling of PISA's semester team and vision."
    },
    {
      id: "garba",
      title: "Navratri Garba Night",
      tagline: "Dance. Dandiya. Delight.",
      date: "2026-10-13T17:00:00",
      endDate: "2026-10-13T23:00:00",
      location: "Pace University, New York",
      registerLink: "https://settersyncnyc.pace.edu/organization/pisa",
      poster: "img/events/garba/poster.jpg",
      showPoster: true,
      gallery: [
        "img/events/garba/gallery-1.jpg",
        "img/events/garba/gallery-2.jpg",
        "img/events/garba/gallery-3.jpg"
      ],
      description: "Two nights of dandiya sticks, circles of dancers and the loudest dhol on campus. Runs October 13 & 20."
    },
    {
      id: "diwali",
      title: "Prakāshā - Grand Diwali 2026",
      tagline: "Lights, Food, Music and the biggest night of the semester.",
      date: "2026-11-08T18:00:00",
      endDate: "2026-11-08T23:30:00",
      location: "Pace University, New York",
      registerLink: "https://settersyncnyc.pace.edu/organization/pisa",
      poster: "img/events/diwali-2k26/poster.jpg",
      showPoster: true,
      gallery: [
        "img/events/diwali-2k26/gallery-1.jpg",
        "img/events/diwali-2k26/gallery-2.jpg",
        "img/events/diwali-2k26/gallery-3.jpg"
      ],
      description: "The festival of lights, PISA-style - diyas, a full dinner spread and a dance floor that doesn't stop."
    },
    /* @@COMMENTED-OUT-START: events-non-2026-semesters-a ================
       DATE:     2026-08-31
       WHY:      Requested: Our Journey / semester filters should show
                 only Fall 2026, Spring 2026 and Summer 2026 for now -
                 every other semester's events are hidden until asked
                 to bring them back.
       WAS FOR:  7 EVENTS entries covering Spring 2023 (holi-2023),
                 Fall 2023 (bollyween-2023, diwali-2023), Fall 2024
                 (navratri-2024, diwali-2024), Spring 2025 (holi-2025)
                 and Fall 2025 (independence-2025). Because EVENTS is
                 the single source of truth (see file header), removing
                 these here also removed them from: Our Journey
                 timeline, the home page "Journey strip", the semester
                 dropdowns, and the standalone Gallery page's year
                 groups - no other file needed to change.
       RESTORE:  Uncomment this whole block (delete this header/footer,
                 keep the 7 object literals + their trailing commas).
    ====================================================================

    {
      id: "holi-2023",
      title: "Rang De Pace - Holi 2023",
      tagline: "A courtyard drenched in color.",
      date: "2023-03-08T13:00:00",
      endDate: "2023-03-08T17:00:00",
      location: "One Pace Plaza Courtyard, New York",
      poster: "img/events/holi-2023/poster.jpg",
      gallery: [
        "img/events/holi-2023/gallery-1.jpg",
        "img/events/holi-2023/gallery-2.jpg",
        "img/events/holi-2023/gallery-3.jpg",
        "img/events/holi-2023/gallery-4.jpg",
        "img/events/holi-2023/gallery-5.jpg",
        "img/events/holi-2023/gallery-6.jpg"
      ],
      description: "PISA's Holi celebration in the One Pace Plaza courtyard - color powders, music and food, with other campus organizations joining in."
    },
    {
      id: "bollyween-2023",
      title: "Bollyween 2023",
      tagline: "A Bollywood twist on Halloween night.",
      date: "2023-10-27T19:00:00",
      endDate: "2023-10-27T23:00:00",
      location: "Pace University, New York",
      poster: "img/events/bollyween-2023/poster.jpg",
      gallery: [
        "img/events/bollyween-2023/gallery-1.jpg",
        "img/events/bollyween-2023/gallery-2.jpg",
        "img/events/bollyween-2023/gallery-3.jpg",
        "img/events/bollyween-2023/gallery-4.jpg",
        "img/events/bollyween-2023/gallery-5.jpg"
      ],
      description: "PISA's Bollywood-meets-Halloween party - costumes, dancing and a night of desi music on campus."
    },
    {
      id: "diwali-2023",
      title: "Prakāshā - Grand Diwali 2023",
      tagline: "The festival of lights at Pace.",
      date: "2023-11-11T18:00:00",
      endDate: "2023-11-11T23:00:00",
      location: "Pace University, New York",
      poster: "img/events/diwali-2023/poster.jpg",
      gallery: [
        "img/events/diwali-2023/gallery-1.jpg",
        "img/events/diwali-2023/gallery-2.jpg",
        "img/events/diwali-2023/gallery-3.jpg",
        "img/events/diwali-2023/gallery-4.jpg",
        "img/events/diwali-2023/gallery-5.jpg",
        "img/events/diwali-2023/gallery-6.jpg"
      ],
      description: "The annual Diwali celebration - diyas, food, music and performances bringing the Pace community together for the festival of lights."
    },
    {
      id: "navratri-2024",
      title: "Navratri Garba 2024",
      tagline: "Our first-ever Navratri - 350+ in one circle.",
      date: "2024-10-05T18:00:00",
      endDate: "2024-10-05T23:00:00",
      location: "Pace University, New York",
      poster: "img/events/navratri-2024/poster.jpg",
      gallery: [
        "img/events/navratri-2024/gallery-1.jpg",
        "img/events/navratri-2024/gallery-2.jpg",
        "img/events/navratri-2024/gallery-3.jpg",
        "img/events/navratri-2024/gallery-4.jpg",
        "img/events/navratri-2024/gallery-5.jpg",
        "img/events/navratri-2024/gallery-6.jpg"
      ],
      description: "PISA's first-ever Navratri celebration - a night of garba and dandiya that drew more than 350 people, with spinning chaniya cholis, live beats and an ever-growing circle of dancers."
    },
    {
      id: "diwali-2024",
      title: "Prakāshā - Grand Diwali 2024",
      tagline: "500+ guests and a plaza aglow with diyas.",
      date: "2024-11-01T18:00:00",
      endDate: "2024-11-01T23:30:00",
      location: "One Pace Plaza, New York",
      poster: "img/events/diwali-2024/poster.jpg",
      gallery: [
        "img/events/diwali-2024/gallery-1.jpg",
        "img/events/diwali-2024/gallery-2.jpg",
        "img/events/diwali-2024/gallery-3.jpg",
        "img/events/diwali-2024/gallery-4.jpg",
        "img/events/diwali-2024/gallery-5.jpg",
        "img/events/diwali-2024/gallery-6.jpg",
        "img/events/diwali-2024/gallery-7.jpg"
      ],
      description: "PISA's flagship Diwali - a 500+ guest celebration of lights with cultural performances, a full dinner spread, decorations and dancing for students, faculty and guests alike."
    },
    {
      id: "holi-2025",
      title: "Rang De Pace - Holi 2025",
      tagline: "Color, dhol and spring on the plaza.",
      date: "2025-03-14T13:00:00",
      endDate: "2025-03-14T17:00:00",
      location: "One Pace Plaza Courtyard, New York",
      poster: "img/events/holi-2025/poster.jpg",
      gallery: [
        "img/events/holi-2025/gallery-1.jpg",
        "img/events/holi-2025/gallery-2.jpg",
        "img/events/holi-2025/gallery-3.jpg",
        "img/events/holi-2025/gallery-4.jpg",
        "img/events/holi-2025/gallery-5.jpg",
        "img/events/holi-2025/gallery-6.jpg"
      ],
      description: "Our spring Holi - clouds of gulaal, dhol beats and the whole community out in the courtyard to welcome the season."
    },
    {
      id: "independence-2025",
      title: "Independence Day Celebration 2025",
      tagline: "Different skies, same heartbeat.",
      date: "2025-08-15T17:00:00",
      location: "Pace University, New York",
      poster: "img/events/independence-2025/poster.jpg",
      gallery: [
        "img/events/independence-2025/gallery-1.jpg",
        "img/events/independence-2025/gallery-2.jpg",
        "img/events/independence-2025/gallery-3.jpg",
        "img/events/independence-2025/gallery-4.jpg"
      ],
      description: "Marking India's Independence Day at Pace - a get-together for the community far from home, but always together."
    },

    @@COMMENTED-OUT-END: events-non-2026-semesters-a ==================== */
    {
      id: "holi-2026",
      title: "Rang De Pace - Holi 2026",
      tagline: "Color, dhol and spring on the plaza.",
      date: "2026-03-13T13:00:00",
      endDate: "2026-03-13T17:00:00",
      location: "One Pace Plaza Courtyard, New York",
      poster: "img/events/holi-2026/poster.jpg",
      gallery: [
        "img/events/holi-2026/gallery-1.jpg"
      ],
      description: "Our spring Holi - clouds of gulaal, dhol beats and the whole community out on the plaza to welcome the season."
    },
    {
      id: "fashion-show-2026",
      title: "The Cultural Fashion Show",
      tagline: "Traditions from across India, on the runway.",
      date: "2026-03-20T18:00:00",
      location: "Pace University, New York",
      gallery: [],
      description: "A runway celebration of India's regional fashion - members walked in traditional and contemporary looks representing cultures and states from across the country."
    },
    {
      id: "mock-wedding-2026",
      title: "Band Baaja Bash - Indian Mock Wedding",
      tagline: "A full Indian wedding, staged on campus.",
      date: "2026-04-04T16:00:00",
      endDate: "2026-04-04T22:00:00",
      location: "Pace University, New York",
      poster: "img/events/mock-wedding-2026/poster.jpg",
      gallery: [
        "img/events/mock-wedding-2026/gallery-1.jpg"
      ],
      description: "A large-scale Indian Mock Wedding experience presented in Spring 2026 - showcasing the traditions, rituals, fashion, music, food and celebrations of an Indian wedding."
    },
    {
      id: "yoga-day-2026",
      title: "International Yoga Day",
      tagline: "Yoga and Indian wellness, together.",
      date: "2026-06-21T09:00:00",
      endDate: "2026-06-21T11:00:00",
      location: "Pace University, New York",
      poster: "img/events/yoga-day-2026/poster.jpg",
      gallery: [
        "img/events/yoga-day-2026/gallery-1.jpg",
        "img/events/yoga-day-2026/gallery-2.jpg",
        "img/events/yoga-day-2026/gallery-3.jpg",
        "img/events/yoga-day-2026/gallery-4.jpg"
      ],
      description: "Our annual International Yoga Day experience brings students, faculty, staff and professors together through yoga and Indian wellness traditions."
    },
    /* @@COMMENTED-OUT-START: events-non-2026-semesters-b ================
       DATE:     2026-08-31
       WHY:      Same reason as events-non-2026-semesters-a above:
                 Our Journey / semester filters should show only
                 Fall 2026, Spring 2026 and Summer 2026 for now.
       WAS FOR:  2 EVENTS entries covering Spring 2022 (holi-2022) and
                 Fall 2025 (navratri-2025). Split into a second block
                 here (rather than merged with block "a") because
                 mock-wedding-2026 and yoga-day-2026 - both kept,
                 both 2026 - sit between them in the array.
       RESTORE:  Uncomment this whole block (delete this header/footer,
                 keep the 2 object literals + their trailing commas).
    ====================================================================

    {
      id: "holi-2022",
      title: "Holi at Pace 2022",
      tagline: "The Festival of Colors on the Frankfort Lot.",
      date: "2022-03-25T13:00:00",
      endDate: "2022-03-25T17:00:00",
      location: "Frankfort Lot, One Pace Plaza, New York",
      registerLink: "https://settersyncnyc.pace.edu/organization/pisa",
      gallery: [],
      description: "PISA's Festival of Colors at the Frankfort Lot, One Pace Plaza - clouds of color powder, Indian food and music bringing the NYC campus together to welcome spring."
    },
    {
      id: "navratri-2025",
      title: "Navratri Night - Dandiya & Garba",
      tagline: "Nine nights of music, dance and dandiya.",
      date: "2025-09-26T18:00:00",
      endDate: "2025-09-26T23:00:00",
      location: "Pace University, New York",
      registerLink: "https://settersyncnyc.pace.edu/organization/pisa",
      gallery: [],
      description: "A Navratri night of Dandiya and Garba - traditional music, spinning dandiya sticks and the whole Pace community dancing together to celebrate the nine nights."
    },

    @@COMMENTED-OUT-END: events-non-2026-semesters-b ==================== */
    {
      id: "independence-2026",
      title: "Independence Day at the Consulate General of India",
      tagline: "Marking the tricolor in the heart of New York.",
      date: "2026-08-15T10:00:00",
      endDate: "2026-08-15T14:00:00",
      location: "Consulate General of India, New York",
      registerLink: "https://settersyncnyc.pace.edu/organization/pisa",
      gallery: [],
      description: "PISA joined India's Independence Day celebration at the Consulate General of India in New York - a proud morning marking the tricolor alongside the wider Indian community in the city."
    }
  ];

  /* ---------------------------------------------------------
     DATA - TEAM
     Replace photoSeed with a real image path once you have
     headshots - see README.md.
  --------------------------------------------------------- */
  /* Teams are keyed by semester so members can be browsed term-by-term. */
  const TEAMS_BY_SEM = {
    "Fall 2026": {
      groups: [
        {
          title: "Executive Board",
          members: [
            { name: "Dilan", role: "President", photo: "img/team/dilan.jpg", focus: "50% 0%", photoSeed: "dilan-president", instagram: "#", linkedin: "https://www.linkedin.com/in/dilxn/" },
            { name: "Shivam", role: "Vice President", photo: "img/team/shivambhatt.jpg", photoSeed: "shivam-vice-president", instagram: "#", linkedin: "https://www.linkedin.com/in/shivam-bhatt14/" },
            { name: "Gurleen", role: "Secretary", photo: "img/team/gurleen.jpg", focus: "50% 20%", photoSeed: "gurleen-secretary", instagram: "https://www.instagram.com/gurleen.16.10?igsi=MTkxdG5ra3Z2Mzk3NA==", linkedin: "https://www.linkedin.com/in/gurleenkaurfrm?utm_source=share_via&utm_content=profile&utm_medium=member_android" },
            { name: "Fahad", role: "Treasurer", photo: "img/team/fahad.jpg", photoSeed: "fahad-treasurer", instagram: "#", linkedin: "#" }
          ]
        },
        {
          title: "Directors",
          members: [
            { name: "Pritha", role: "Director of Events", photo: "img/team/pritha.jpg", photoSeed: "pritha-director-events", instagram: "https://www.instagram.com/arorapritha/", linkedin: "https://www.linkedin.com/in/prithaarora/" },
            { name: "Sriya", role: "Director of Marketing", photo: "img/team/sriya.jpg", photoSeed: "sriya-director-marketing", instagram: "#", linkedin: "https://www.linkedin.com/in/sriya-patnala?utm_source=share_via&utm_content=profile&utm_medium=member_android" }
          ]
        },
        {
          title: "Marketing Team",
          members: [
            { name: "Sharwari", role: "Marketing Associate", photo: "img/team/sharwari.jpg", photoSeed: "sharwari-marketing-associate", instagram: "https://www.instagram.com/sharwarii.__/", linkedin: "https://www.linkedin.com/in/sharwari-pawar-8694b722a" },
            { name: "Usha", role: "Marketing Associate", photo: "img/team/usha.jpg", photoSeed: "usha-marketing-associate", instagram: "https://www.instagram.com/ush_haa?igsi=OHpxaTl2ajVoZ3dt&utm_source=qr", linkedin: "https://www.linkedin.com/in/usha-kanchukatla-98267a306?utm_source=share_via&utm_content=profile&utm_medium=member_ios" },
            { name: "Akanksha", role: "Marketing Associate", photo: "img/team/akanksha.jpg", photoSeed: "akanksha-marketing-associate", instagram: "#", linkedin: "#" }
          ]
        },
        {
          title: "Events Team",
          members: [
            { name: "Pransu", role: "Cultural Coordinator", photo: "img/team/pransu.jpg", photoSeed: "pransu-cultural-coordinator", instagram: "https://www.instagram.com/pransuchangela9?", linkedin: "https://www.linkedin.com/in/pransuchangela" },
            { name: "Rahul", role: "Logistical Coordinator", photo: "img/team/rahul.jpg", photoSeed: "rahul-logistical-coordinator", instagram: "#", linkedin: "#" },
            { name: "Vighnesh", role: "Events Associate", photo: "img/team/vighnesh.jpg", photoSeed: "vighnesh-events-associate", instagram: "#", linkedin: "#" },
            { name: "Priyanshi", role: "Events Associate", photo: "img/team/priyanshi.jpg", photoSeed: "priyanshi-events-associate", instagram: "https://www.instagram.com/priyanshi._.6/", linkedin: "https://www.linkedin.com/in/parmar-priyanshi/" },
            { name: "Sreeya", role: "Events Associate", photo: "img/team/sreeya.jpg", focus: "61% 50%", photoSeed: "sreeya-events-associate", instagram: "https://www.instagram.com/sreeya.rao?igsi=azQ3N2k1anp5ZHJq&utm_source=qr", linkedin: "https://www.linkedin.com/in/theepalapudi-sreeya-rao" }
          ]
        },
        {
          title: "Media & Outreach",
          members: [
            { name: "Mansi", role: "Photographer & Videographer", photo: "img/team/mansi.jpg", photoSeed: "mansi-photographer-videographer", instagram: "#", linkedin: "#" },
            { name: "Anshitha", role: "PISA Ambassador", photo: "img/team/anshitha.jpg", photoSeed: "anshitha-pisa-ambassador", instagram: "#", linkedin: "#" },
            { name: "Lavisha", role: "Outreach & Communications Coordinator", photo: "img/team/lavisha.jpg", photoSeed: "lavisha-outreach-communications-coordinator", instagram: "#", linkedin: "#" }
          ]
        }
      ]
    },
    /* @@COMMENTED-OUT-START: team-fall-spring-2025 =======================
       DATE:     2026-08-31
       WHY:      Requested: hide Fall 2025 and Spring 2025 from the Team
                 page's semester dropdown for now - we'll add real
                 photos for these rosters later.
       WAS FOR:  2 TEAMS_BY_SEM entries ("Fall 2025", "Spring 2025").
                 Note: these use the older exec/committee shape (see
                 paintTeam's fallback), with placeholder photoSeed
                 avatars rather than real photo paths - unlike the
                 "Fall 2026" entry above. Because renderTeam() builds
                 the semester dropdown from Object.keys(TEAMS_BY_SEM),
                 removing these keys here also removes them from that
                 dropdown - no other file needed to change.
       RESTORE:  Uncomment this whole block (delete this header/footer,
                 keep the 2 semester entries + their trailing commas).
    ====================================================================

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
    },

    @@COMMENTED-OUT-END: team-fall-spring-2025 ==================== */
  };

  /* ---------------------------------------------------------
     DATA - VOLUNTEER ROLES
  --------------------------------------------------------- */
  const ROLES = [
    { id: "performer", title: "Performer", desc: "Dance, sing or showcase your talent on stage at PISA events.", icon: ICONS.mic },
    { id: "organizer", title: "Event Organizer", desc: "Plan logistics, timelines and run-of-show from start to finish.", icon: ICONS.calendar },
    { id: "media", title: "Photographer / Videographer", desc: "Capture the moments that become Our Journey.", icon: ICONS.camera },
    { id: "marketing", title: "Marketing & Social Media", desc: "Design posts, write captions and help us grow our reach.", icon: ICONS.megaphone },
    { id: "logistics", title: "Logistics & Setup", desc: "Decor, sound, seating - the backbone of every great event.", icon: ICONS.tool },
    { id: "outreach", title: "Outreach & Hospitality", desc: "Welcome guests and build ties with other student orgs.", icon: ICONS.handshake }
  ];

  /* ---------------------------------------------------------
     HELPERS
  --------------------------------------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  function resetScrollPosition() {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

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
        <div class="team-card__photo"><img src="${member.photo || avatarUrl(member.photoSeed)}" alt="${member.name}" loading="lazy"${member.fit ? ` style="object-fit:${member.fit}${member.focus ? `;object-position:${member.focus}` : ""}"` : member.focus ? ` style="object-position:${member.focus}"` : ""}></div>
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
  const ROUTES = ["home", "about", "history", "team", "volunteer", "events", "gallery"];
  let currentRoute = "home";

  function resolveRoute() {
    const hash = (location.hash || "#home").replace("#", "");
    return ROUTES.includes(hash) ? hash : "home";
  }

  function navigate(route, { replace = false, scrollTarget = null } = {}) {
    if (!ROUTES.includes(route)) route = "home";
    currentRoute = route;

    $$(".page").forEach((p) => p.classList.toggle("is-active", p.dataset.page === route));
    $$('[data-route]').forEach((el) => el.classList.toggle("is-active", el.dataset.route === route && el.tagName === "A" && el.closest(".nav__links, .mobile-menu")));

    resetScrollPosition();
    closeMobileMenu();
    updateNavChrome();

    if (route === "history") renderTimeline();
    if (route === "team") renderTeam();
    if (route === "volunteer") renderVolunteer();
    if (route === "events") renderLiveEvents();
    if (route === "home") renderHome();
    if (route === "gallery") renderGallery();

    if (scrollTarget) {
      requestAnimationFrame(() => {
        const target = document.getElementById(scrollTarget);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    if (!replace) history.pushState({ route }, "", `#${route}`);
  }

  window.addEventListener("popstate", () => navigate(resolveRoute(), { replace: true }));
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-route]");
    if (!link) return;
    e.preventDefault();
    navigate(link.dataset.route, { scrollTarget: link.dataset.scrollTarget || null });
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
  burger.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = burger.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    mobileMenu.classList.toggle("is-open", open);
  });
  // the floating card is compact, so dismiss it on outside tap / scroll / Escape
  document.addEventListener("click", (e) => {
    if (!mobileMenu.classList.contains("is-open")) return;
    if (mobileMenu.contains(e.target) || burger.contains(e.target)) return;
    closeMobileMenu();
  });
  window.addEventListener("scroll", () => {
    if (mobileMenu.classList.contains("is-open")) closeMobileMenu();
  }, { passive: true });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) closeMobileMenu();
  });

  /* ===========================================================
     GATE HERO - scroll-linked opening animation
  =========================================================== */
  const gateHero = $("#gateHero");
  const gateSticky = $("#gateSticky");
  const leafLeft = $("#leafLeft");
  const leafRight = $("#leafRight");
  const gateCaption = $("#gateCaption");

  // ease so the doors hold, then swing - reads more like real hinges than a linear slide
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

  /* Poster markup for upcoming / live events. Only events flagged
     showPoster display a real poster; the rest get a branded
     "poster coming soon" placeholder so the layout stays intact. */
  function upcomingPosterMarkup(ev) {
    if (ev.showPoster && ev.poster) {
      return `<img class="poster-fit" src="${ev.poster}" alt="${ev.title}" loading="lazy">`;
    }
    return `<div class="poster-tba">
        <span class="poster-tba__title">${ev.title}</span>
        <span class="poster-tba__tag">Poster coming soon</span>
      </div>`;
  }

  /* ===========================================================
     BOARDING-PASS HERO
  =========================================================== */
  // Turn a location string into a short "airport code" for the stub.
  function gateCode(location = "") {
    const loc = location.toLowerCase();
    if (loc.includes("pace")) return "PACE";
    if (loc.includes("consulate")) return "CGI";
    if (loc.includes("kessel")) return "KSSL";
    const word = (location.match(/[A-Za-z]{3,}/) || ["PISA"])[0];
    return word.slice(0, 4).toUpperCase();
  }

  function paintBoardingPass(next) {
    const setText = (id, val) => { const el = $("#" + id); if (el) el.textContent = val; };
    if (next) {
      setText("bpFlight", next.title);
      setText("bpBoarding", `${fmtDate(next.date)} · ${fmtTime(next.date)}`);
      setText("bpGate", next.location);
      setText("bpGateShort", gateCode(next.location));
      setText("bpCode", `PISA · ${new Date(next.date).getFullYear()}`);
    } else {
      setText("bpFlight", "New season loading…");
      setText("bpBoarding", "Announced soon");
      setText("bpGate", "Pace University, NY");
      setText("bpGateShort", "PACE");
    }
  }

  // Cursor-driven 3D tilt on the pass (desktop, motion-safe).
  function initBoardingPassTilt() {
    const wrap = $("#passWrap");
    const pass = $("#boardingPass");
    if (!wrap || !pass) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;

    let raf = null;
    const onMove = (e) => {
      const r = pass.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;   // 0..1
      const py = (e.clientY - r.top) / r.height;   // 0..1
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        pass.style.animation = "none";
        pass.style.setProperty("--ry", `${(px - 0.5) * 16}deg`);
        pass.style.setProperty("--rx", `${(0.5 - py) * 14}deg`);
      });
    };
    const reset = () => {
      if (raf) cancelAnimationFrame(raf);
      pass.style.setProperty("--ry", "0deg");
      pass.style.setProperty("--rx", "0deg");
      // hand control back to the idle float
      pass.style.animation = "";
    };
    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", reset);
  }

  /* ===========================================================
     HOME PAGE RENDER
  =========================================================== */
  function renderHome() {
    const upcoming = EVENTS.filter((e) => getStatus(e) !== "closed").sort((a, b) => new Date(a.date) - new Date(b.date));
    const next = upcoming[0];

    // Boarding-pass hero - wire fields to the real next departure
    paintBoardingPass(next);

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
        <div class="happening-card__visual">${upcomingPosterMarkup(next)}</div>`;
    } else {
      card.innerHTML = `<p>No upcoming events right now - check back soon.</p>`;
    }

    // Upcoming grid (skip the "next" one shown above, show next 3)
    const grid = $("#upcomingGrid");
    grid.innerHTML = upcoming.slice(1, 4).map((ev) => eventCardMarkup(ev)).join("") ||
      upcoming.slice(0, 3).map((ev) => eventCardMarkup(ev)).join("");

    // Journey strip (most recent 5 history items)
    const history = EVENTS
      .filter((e) => getStatus(e) === "closed")
      .filter((e) => new Date(e.date).getFullYear() >= 2025)
      .filter((e) => e.poster || (e.gallery && e.gallery[0]))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const strip = $("#journeyStrip");
    strip.innerHTML = history.map((ev, i) => `
      <a class="journey-card" href="#history" data-route="history">
        <div class="journey-card__img"><img src="${ev.poster || ev.gallery[0]}" alt="${ev.title}" loading="lazy"></div>
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
          ${upcomingPosterMarkup(ev)}
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
  let historySelectBuilt = false;
  function historySemesters() {
    const closed = EVENTS.filter((e) => getStatus(e) === "closed" && new Date(e.date).getFullYear() >= 2025);
    return sortSemestersDesc(closed.map((e) => semesterOf(e.date)));
  }

  function paintTimeline(sem) {
    const history = EVENTS
      .filter((e) => getStatus(e) === "closed")
      .filter((e) => new Date(e.date).getFullYear() >= 2025)
      .filter((e) => sem === "all" || semesterOf(e.date) === sem)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const wrap = $("#timeline");
    const meta = $("#historySemMeta");
    if (meta) meta.textContent = `${history.length} event${history.length === 1 ? "" : "s"}`;

    if (!history.length) {
      wrap.innerHTML = `<p style="text-align:center;color:var(--brown-mid)">No completed events yet - once an event's date passes, it will automatically appear here with its full story.</p>`;
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
            </div>
          </div>`).join("")}
      </div>`).join("");

    /* @@COMMENTED-OUT-START: timeline-gallery-dropdown ==================
       DATE:     2026-08-31
       WHY:      We don't have real photos for every event yet, and an
                 expandable panel that's empty (or full of placeholder
                 images) for most cards looked broken/unfinished.
       WAS FOR:  A "+" button on each Our Journey timeline card that
                 expanded a panel showing that event's photo gallery
                 (click-to-enlarge into the shared lightbox) plus its
                 full description paragraph.
       RESTORE:  1) Inside the .timeline-item template above, add back
                    the expand button as the last child of
                    .timeline-item__head:
                      <span class="timeline-item__expand">+</span>
                 2) Still inside .timeline-item, as a sibling right
                    after .timeline-item__head, add back the panel:
                      <div class="timeline-item__panel">
                        <div class="timeline-item__panel-inner">
                          <div class="timeline-item__gallery">
                            ${ev.gallery.map((src, gi) => `<img src="${src}" alt="${ev.title} photo ${gi + 1}" data-gallery-open="${ev.id}" data-index="${gi}" loading="lazy">`).join("")}
                          </div>
                          <p>${ev.description}</p>
                        </div>
                      </div>
                 3) Uncomment the two listener blocks below.
    ====================================================================

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

    @@COMMENTED-OUT-END: timeline-gallery-dropdown ==================== */

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

  function renderTimeline() {
    const semesters = historySemesters();
    const select = $("#historySemSelect");
    if (select && !historySelectBuilt) {
      select.innerHTML = `<option value="all">All semesters</option>`
        + semesters.map((s) => `<option value="${s}">${s}</option>`).join("");
      select.addEventListener("change", () => paintTimeline(select.value));
      historySelectBuilt = true;
    }
    const active = select ? select.value || "all" : "all";
    if (select) select.value = active;
    paintTimeline(active);
  }
  let tlObserver = null;

  /* ===========================================================
     TEAM PAGE
  =========================================================== */
  let teamSelectBuilt = false;
  function paintTeam(sem) {
    const team = TEAMS_BY_SEM[sem];
    if (!team) return;
    /* Prefer an explicit `groups` list; fall back to the older exec/committee shape. */
    const groups = team.groups || [
      { title: "Executive Board", members: team.exec || [] },
      { title: "Committees", members: team.committee || [] }
    ];
    $("#teamGroups").innerHTML = groups.map((g, i) => {
      const members = g.members || [];
      const grid = members.length
        ? members.map((m) => teamCardMarkup(m)).join("")
        : `<p style="color:var(--brown-mid)">Roster for this group is being finalized.</p>`;
      const fewClass = members.length && members.length <= 2 ? " team-grid--few" : "";
      return `
        <section class="team-section${i === 0 ? "" : " team-section--committee"}">
          <p class="eyebrow eyebrow--center">${g.title.toUpperCase()}</p>
          <div class="team-grid team-grid--committee${fewClass}">${grid}</div>
        </section>`;
    }).join("");
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
     GALLERY PAGE - all event photos, filtered by semester
  =========================================================== */
  let gallerySelectBuilt = false;
  function galleryEventsByYear() {
    // Only events that have already happened (closed) - no upcoming events.
    const withPhotos = EVENTS.filter((e) => getStatus(e) === "closed" && Array.isArray(e.gallery) && e.gallery.length);
    const groups = {};
    withPhotos.forEach((ev) => {
      const yr = String(new Date(ev.date).getFullYear());
      (groups[yr] = groups[yr] || []).push(ev);
    });
    Object.values(groups).forEach((list) => list.sort((a, b) => new Date(b.date) - new Date(a.date)));
    return groups;
  }

  function paintGallery(year) {
    const groups = galleryEventsByYear();
    const events = year === "all"
      ? Object.keys(groups).sort((a, b) => Number(b) - Number(a)).flatMap((y) => groups[y])
      : (groups[year] || []);
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
    const groups = galleryEventsByYear();
    const years = Object.keys(groups).sort((a, b) => Number(b) - Number(a));
    const select = $("#galleryYearSelect");
    if (select && !gallerySelectBuilt) {
      select.innerHTML = `<option value="all">All years</option>`
        + years.map((y) => `<option value="${y}">${y}</option>`).join("");
      select.addEventListener("change", () => {
        $("#galleryContent").classList.remove("is-in");
        paintGallery(select.value);
      });
      gallerySelectBuilt = true;
    }
    const active = select ? select.value || years[0] : years[0];
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
    // Rebuilding the list below resets every flip face back to its "00" placeholder,
    // so the stale-value cache from any previous render must be cleared too - otherwise
    // tickCountdowns() thinks those digits are unchanged and never writes the real value in.
    Object.keys(prevUnitValues).forEach((key) => delete prevUnitValues[key]);
    const list = EVENTS.filter((e) => getStatus(e) !== "closed").sort((a, b) => new Date(a.date) - new Date(b.date));
    const wrap = $("#eventsList");

    if (!list.length) {
      wrap.innerHTML = `<p style="text-align:center;color:var(--brown-mid)">Nothing open for registration right now - check Our Journey to relive what we've already done.</p>`;
      return;
    }

    wrap.innerHTML = list.map((ev) => `
      <article class="live-card" data-id="${ev.id}">
        <div class="live-card__img">${upcomingPosterMarkup(ev)}</div>
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
        // event has started or passed - if fully closed, remove card (moves to History)
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
     POLISHED CURSOR (desktop) - with a hint label over the gate
  =========================================================== */
  function initCursor() {
    const fine = window.matchMedia("(pointer:fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce || window.innerWidth <= 860) return;
    const dot = $("#cursorDot"), ring = $("#cursorRing");
    if (!dot || !ring) return;
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    const interactive = "a, button, label, select, .gallery-tile, .team-polaroid, [data-route]";

    const showCursor = () => document.body.classList.add("cursor-on");
    const hideCursor = () => {
      document.body.classList.remove("cursor-on");
      ring.classList.remove("is-hover");
    };

    window.addEventListener("mousemove", (e) => {
      showCursor();
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-3px,-2px)`;
    }, { passive: true });
    document.addEventListener("mouseenter", showCursor);
    document.addEventListener("mouseleave", hideCursor);
    window.addEventListener("blur", hideCursor);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) hideCursor();
    });
    document.addEventListener("mouseover", (e) => { if (e.target.closest(interactive)) ring.classList.add("is-hover"); });
    document.addEventListener("mouseout", (e) => { if (e.target.closest(interactive)) ring.classList.remove("is-hover"); });

    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ===========================================================
     ENGAGEMENT TOASTS - reward long visits, catch quick exits
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

  // a single popup: register for the latest upcoming event
  function initEngagementToasts() {
    const ev = nextUpcomingEvent();
    if (!ev || !ev.registerLink) return;   // nothing open to register for
    const when = `${fmtDate(ev.date)} · ${fmtTime(ev.date)}`;
    setTimeout(() => {
      showToast({
        emoji: "🎉",
        title: `Register for ${ev.title}`,
        msg: `${ev.tagline} - ${when}. Grab your spot.`,
        ctaText: "Register now →", ctaHref: ev.registerLink, dur: 14000
      });
    }, 6000);
  }

  /* ===========================================================
     INTRO - logo zooms in and fades into the site (~2.6s, CSS-driven)
  =========================================================== */
  function initIntro() {
    const intro = $("#intro");
    if (!intro) return;
    const html = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const finish = () => {
      intro.classList.add("is-hidden");
      html.style.overflow = "";
      document.body.style.overflow = "";
    };

    if (reduce) { finish(); return; }

    // hold the page still while the logo plays, then remove the overlay
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    setTimeout(finish, 2650);
  }

  function initTeamPolaroidShake() {
    $$(".team-polaroid").forEach((photo) => {
      const shake = () => {
        photo.classList.remove("is-shaking");
        void photo.offsetWidth;
        photo.classList.add("is-shaking");
      };

      photo.addEventListener("click", shake);
      photo.addEventListener("animationend", (e) => {
        if (e.animationName.includes("polaroidShake")) {
          photo.classList.remove("is-shaking");
        }
      });
      photo.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        shake();
      });
    });
  }

  /* ===========================================================
     INIT
  =========================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    initIntro();
    $("#year").textContent = new Date().getFullYear();
    resetScrollPosition();
    updateGateProgress();
    updateNavChrome();
    navigate(resolveRoute(), { replace: true });
    requestAnimationFrame(resetScrollPosition);
    observeReveals();
    initCursor();
    initBoardingPassTilt();
    initEngagementToasts();
    initTeamPolaroidShake();
  });

  window.addEventListener("load", () => {
    resetScrollPosition();
    setTimeout(resetScrollPosition, 0);
  }, { once: true });

  window.addEventListener("resize", () => {
    if (currentRoute === "home") updateGateProgress();
  });

})();
