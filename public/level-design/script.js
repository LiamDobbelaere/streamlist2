// ===== Project data =====
// NOTE: the `desc` lines below are placeholder captions in a neutral voice —
// rewrite them in your own words with the specific decisions you made.
const projects = [
  {
    img: "media/openworld.webp",
    alt: "Open-world lunar base level document with colour-coded districts and a 2D map",
    title: "Open-world districts with identity",
    tags: "Open-world planning · Districts · Spatial identity",
    desc: "When I made this lunar base during the open-world exercise as part of the course, I planned each district beforehand.</br/></br>Each district gets their own identity: the housing section is purple-colored and has rounded cuboids, the greenhouse uses half-domes, the oxygen district is heavy on cylinders and blue accent colors, and so on. By using shape and color to create distinct zones, the player can more easily mentally categorize them.</br></br>A large crater in the middle provides occlusion, so not all districts are visible all at once.",
  },
  {
    img: "media/leading-lines.webp",
    alt: "Leading lines drawn over a level, guiding the player's eye toward the objective",
    title: "Leading your eye with composition",
    tags: "Composition · Guiding the player · Readability",
    desc: "For an FPS level where you could either do it stealthily or go loud, I used the truck and boxes to lead the player's gaze towards the two options. There is a broken chunk out of the wall that lets you enter stealthily, or a front-gate you can waltz right through.</br></br>Aside from leading lines, I make heavy use of the rule-of-thirds grid in critical POV sections such as doorways.",
  },
  {
    img: "media/egypt-values.webp",
    alt: "Egyptian tomb in colour and grayscale, showing the blue climbable ledges",
    title: "Affordances that visually belong",
    tags: "Colour · Shape · Readability",
    desc: "In my Egyptian tomb level for the CGMA course, it's referentially accurate to use blue together with the sandy colors.</br></br> I made sure the value of the blue was deep enough compared to the sandstone in order to make it pop. By reusing these colors and shapes throughout the level, the player can immediately identify climbable ledges and where to go.",
  },
  {
    img: "media/references.webp",
    alt: "Real-world reference photos paired with the in-engine result",
    title: "Grounded in the real world",
    tags: "Reference · Worldbuilding",
    desc: "When looking for references, I try to find spaces and shapes that excite me. Even fantasy environments are always based on something from the real world.</br></br>For the lunar base's oxygen district, I looked up how oxygen could be stored and got inspired by the cylindrical shapes. I then translated that into the level.</br></br>Likewise, for the candy-themed platformer level, I looked at existing games, real-world treats and other renditions of candy lands in media.</br></br> Using references also helps with the proper scaling of everything and makes the difference between abstract and grounded level design.",
  },
];

// ===== Render project cards =====
const grid = document.querySelector(".project-grid");
if (grid) {
  projects.forEach((p) => {
    const card = document.createElement("article");
    card.className = "project reveal";
    card.innerHTML = `
      <button class="project-media" type="button" data-zoom="${p.img}" aria-label="Enlarge: ${p.title}">
        <img src="${p.img}" alt="${p.alt}" loading="lazy" />
      </button>
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

// ===== Image lightbox: click a project image to view it full size =====
const lightbox = document.querySelector("[data-lightbox]");
const lightboxImg = document.querySelector("[data-lightbox-img]");
function openLightbox(src, alt) {
  if (!lightbox) return;
  lightboxImg.src = src;
  lightboxImg.alt = alt || "";
  lightbox.hidden = false;
  document.body.style.overflow = "hidden"; // freeze the page behind the overlay
}
function closeLightbox() {
  if (!lightbox || lightbox.hidden) return;
  lightbox.hidden = true;
  lightboxImg.removeAttribute("src");
  document.body.style.overflow = "";
}
document.addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-zoom]");
  if (trigger) openLightbox(trigger.dataset.zoom, trigger.querySelector("img")?.alt);
});
// click anywhere on the overlay (backdrop, image or close button) dismisses it
lightbox?.addEventListener("click", closeLightbox);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

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
function isoBox(b, palette = GRAY, stroke = palette[3]) {
  const { x, y, z, w, d, h } = b;
  const P = (X, Y, Z) => isoProject(X, Y, Z);
  const pts = (arr) => arr.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ");
  const top = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const front = [P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)];
  const side = [P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)];
  const poly = (p, fill) =>
    `<polygon points="${pts(p)}" fill="${fill}" stroke="${stroke}" stroke-width="0.75" stroke-linejoin="round"/>`;
  // side + front first, top last (top is highest, never occluded within a box)
  return poly(side, palette[2]) + poly(front, palette[1]) + poly(top, palette[0]);
}

// Render boxes into an <svg> string, sorted back-to-front (painter's algorithm).
function isoScene(boxes, { extra = "", palette = GRAY, pad = 6, stroke } = {}) {
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
  const body = ordered
    .map((b) => {
      const pal = b.palette || palette;
      return isoBox(b, pal, stroke === undefined ? pal[3] : stroke);
    })
    .join("");
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${body}${extra}</svg>`;
}

// The staircase's right side as ONE polygon. The per-step side faces are coplanar
// (all at x = width), so drawing them separately leaves hairline seams between
// sections. Merging them into a single shape means there are no shared edges to seam.
function buildStairWall(steps, width, fill = GRAY[2]) {
  // walk the silhouette in (y, z): base, back edge, then the stepped top down to front
  const corners = [[steps, 0], [0, 0], [0, steps]];
  for (let k = 1; k < steps; k++) corners.push([k, steps - k + 1], [k, steps - k]);
  corners.push([steps, 1]);
  const points = corners
    .map(([y, z]) => isoProject(width, y, z).map((n) => n.toFixed(1)).join(","))
    .join(" ");
  return `<polygon points="${points}" fill="${fill}" stroke="${fill}" stroke-width="1" stroke-linejoin="round"/>`;
}

// A staircase climbing up-and-back: each higher step sits one unit deeper.
function buildStairs(steps = 5, width = 3.4) {
  const boxes = [];
  for (let i = 0; i < steps; i++) {
    boxes.push({ x: 0, y: steps - 1 - i, z: 0, w: width, d: 1, h: i + 1 });
  }
  // gray treads + risers (borderless), then the darker-gray side painted over the
  // boxes' side faces as a single seamless wall
  return isoScene(boxes, { stroke: "none", extra: buildStairWall(steps, width) });
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
