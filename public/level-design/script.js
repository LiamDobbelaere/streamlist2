// ===== Project data (swap in real images/videos later) =====
const projects = [
  {
    title: "Tidebreaker — Harbor Assault",
    tags: "Unreal Engine · Multiplayer · Combat",
    desc: "A verticality-driven siege map balancing attacker push routes against defender chokepoints and flanks.",
  },
  {
    title: "Ashfall Station",
    tags: "Unity · Single-player · Stealth",
    desc: "A derelict refinery built around light, sound and patrol loops to teach stealth without a tutorial.",
  },
  {
    title: "The Long Climb",
    tags: "Unreal Engine · Platformer",
    desc: "A vertical traversal gym escalating mechanics one beat at a time, ending on a no-fail set piece.",
  },
  {
    title: "Greybox Lab — Arena 04",
    tags: "Unity · Blockmesh · Encounter",
    desc: "Rapid-iteration combat arena tuned for cover variety, sightline control and readable spawn waves.",
  },
];

// ===== Render project cards =====
const grid = document.querySelector(".project-grid");
if (grid) {
  projects.forEach((p) => {
    const card = document.createElement("article");
    card.className = "project reveal";
    card.innerHTML = `
      <div class="project-media" role="img" aria-label="${p.title} preview"></div>
      <div class="project-info">
        <h3>${p.title}</h3>
        <p class="tags">${p.tags}</p>
        <p>${p.desc}</p>
      </div>`;
    grid.appendChild(card);
  });
}

// ===== Mobile nav toggle =====
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav-toggle");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  // close menu when a link is tapped
  nav.querySelectorAll(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}

// ===== Hero showreel: play in place with native controls (incl. fullscreen) =====
const heroVideo = document.querySelector(".hero-video");
const videoOverlay = document.querySelector(".video-overlay");
if (heroVideo && videoOverlay) {
  videoOverlay.addEventListener("click", () => {
    heroVideo.setAttribute("controls", "");
    videoOverlay.hidden = true;
    // the click is a user gesture, so playback with sound is allowed
    heroVideo.play().catch(() => {});
  });
  // when it finishes, restore the poster + play affordance for an easy replay
  heroVideo.addEventListener("ended", () => {
    heroVideo.removeAttribute("controls");
    videoOverlay.hidden = false;
  });
}

// ===== Reveal on scroll =====
const revealEls = document.querySelectorAll(".reveal, section, .footer-inner");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => {
    el.classList.add("reveal");
    io.observe(el);
  });
} else {
  revealEls.forEach((el) => el.classList.add("in"));
}

// ===== Isometric renderer =====
// Projects 3D boxes to 2D and draws shaded top / riser / side faces.
// A small reusable primitive — the same engine renders stairs, ledges, ladders.
const ISO = {
  AX: 26, // screen dx per +1 world X
  AY: 15, // screen dy per +1 world X (and Y) — the 2:1 isometric tilt
  H: 26, // screen dy per +1 world Z (height)
};
// face palettes: [top, riser/front, side, edge] — light to dark for fake lighting
const GRAY = ["#ededed", "#cfcfcf", "#b1b1b1", "#9c9c9c"];
const BLUE = ["#6f64ff", "#3322ff", "#1d12ff", "#1207a8"];

function isoProject(x, y, z) {
  return [(x - y) * ISO.AX, (x + y) * ISO.AY - z * ISO.H];
}

// One axis-aligned box -> three visible polygons (back-to-front safe per box).
function isoBox(b, palette = GRAY) {
  const { x, y, z, w, d, h } = b;
  const P = (X, Y, Z) => isoProject(X, Y, Z);
  const pts = (arr) => arr.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");
  const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const front = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const side = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
  const poly = (p, fill) =>
    `<polygon points="${pts(p)}" fill="${fill}" stroke="${palette[3]}" stroke-width="0.75" stroke-linejoin="round"/>`;
  // side + front first, top last (top is highest, never occluded within a box)
  return poly(side, palette[2]) + poly(front, palette[1]) + poly(top, palette[0]);
}

// Render boxes into an <svg> string, sorted back-to-front (painter's algorithm).
function isoScene(boxes, { extra = "", palette = GRAY, pad = 6 } = {}) {
  // bounds across every corner so the viewBox fits exactly
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  boxes.forEach((b) => {
    for (const X of [b.x, b.x + b.w])
      for (const Y of [b.y, b.y + b.d])
        for (const Z of [b.z, b.z + b.h]) {
          const [sx, sy] = isoProject(X, Y, Z);
          minX = Math.min(minX, sx); maxX = Math.max(maxX, sx);
          minY = Math.min(minY, sy); maxY = Math.max(maxY, sy);
        }
  });
  const vb = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  // draw furthest first: smaller (front-corner x+y) is further back
  const ordered = [...boxes].sort((a, b) => (a.x + a.y) - (b.x + b.y));
  const body = ordered.map((b) => isoBox(b, b.palette || palette)).join("");
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${body}${extra}</svg>`;
}

// A small blue cube centred on the world origin — the "player" token.
function isoPlayerCube(s = 0.6) {
  return isoBox({ x: -s / 2, y: -s / 2, z: 0, w: s, d: s, h: s }, BLUE);
}

// A staircase climbing up-and-back: each higher step sits one unit deeper.
function buildStairs(steps = 5, width = 3.4) {
  const boxes = [];
  for (let i = 0; i < steps; i++) {
    boxes.push({ x: 0, y: steps - 1 - i, z: 0, w: width, d: 1, h: i + 1 });
  }
  // the intended route up the centre of each tread — a golden-path nod
  const route = [];
  for (let i = 0; i < steps; i++) {
    const y = steps - 1 - i;
    route.push(isoProject(width / 2, y + 0.5, i)); // tread front
    route.push(isoProject(width / 2, y + 0.5, i + 1)); // tread back
  }
  const d = route.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const goal = route[route.length - 1];
  const routeEl =
    `<path d="${d}" fill="none" stroke="var(--blue)" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="5 6" opacity="0.5"/>`;
  const goalEl =
    `<circle cx="${goal[0].toFixed(1)}" cy="${(goal[1] - 6).toFixed(1)}" r="5" ` +
    `fill="none" stroke="var(--blue)" stroke-width="2.5"/>`;
  // the player rides this path via CSS offset-path (animated on scroll-in)
  const playerEl =
    `<g class="iso-player" style="offset-path:path('${d}')">${isoPlayerCube()}</g>`;
  return isoScene(boxes, { extra: routeEl + goalEl + playerEl });
}

// A row of floating ledges/platforms — traversal affordance used as a divider.
function buildLedges() {
  const boxes = [
    { x: 0, y: 0, z: 0, w: 2, d: 1.4, h: 0.5 },
    { x: 3, y: 0.5, z: 1.1, w: 1.8, d: 1.4, h: 0.5 },
    { x: 5.8, y: 1.1, z: 0.3, w: 2, d: 1.4, h: 0.5 },
    { x: 8.4, y: 1.7, z: 1.4, w: 1.7, d: 1.4, h: 0.5 },
  ];
  // dashed jump arcs between platform tops to imply a traversal route
  let arcs = "";
  for (let i = 0; i < boxes.length - 1; i++) {
    const a = boxes[i], b = boxes[i + 1];
    const p0 = isoProject(a.x + a.w, a.y + a.d / 2, a.z + a.h);
    const p1 = isoProject(b.x, b.y + b.d / 2, b.z + b.h);
    const cx = (p0[0] + p1[0]) / 2;
    const cy = Math.min(p0[1], p1[1]) - 26; // arc up over the gap
    arcs +=
      `<path d="M${p0[0].toFixed(1)},${p0[1].toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ` +
      `${p1[0].toFixed(1)},${p1[1].toFixed(1)}" fill="none" stroke="var(--blue)" ` +
      `stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round" opacity="0.55"/>`;
  }
  return isoScene(boxes, { extra: arcs });
}

// A ladder (two rails + rungs) — used as the "climb back to top" control.
function buildLadder() {
  const railH = 5, gap = 1.7, t = 0.32;
  const boxes = [
    { x: 0, y: 0, z: 0, w: t, d: t, h: railH },
    { x: gap, y: 0, z: 0, w: t, d: t, h: railH },
  ];
  for (let z = 0.5; z < railH; z += 1.1) {
    boxes.push({ x: 0, y: 0, z, w: gap + t, d: t, h: t });
  }
  return isoScene(boxes, { palette: BLUE, pad: 4 });
}

// ----- mount the motifs -----
document.querySelectorAll('[data-iso="stairs"]').forEach((el) => {
  el.innerHTML = buildStairs();
  if ("IntersectionObserver" in window) {
    const o = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("climb"); o.unobserve(e.target); }
      }),
      { threshold: 0.4 }
    );
    o.observe(el);
  } else {
    el.classList.add("climb");
  }
});

document.querySelectorAll('[data-iso="ledges"]').forEach((el) => {
  el.innerHTML = buildLedges();
});

const ladderBtn = document.querySelector('[data-iso="ladder"]');
if (ladderBtn) {
  ladderBtn.innerHTML = buildLadder();
  ladderBtn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
  const onScroll = () => ladderBtn.classList.toggle("show", window.scrollY > 500);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
