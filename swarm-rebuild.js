/* Swarm rebuild: the intro animation on every page.
   Coloured multiplayer cursors fly in over a faint design grid, each selects a
   block on the first screen in its own colour, shows its size, and drops it into
   place. Glass panels are built first, then the content inside them. Then the
   cursors scatter, the grid fades, and the page is normal.

   It plays on every page load. Scrolling doesn't stop it: the cursors and boxes
   are drawn in page coordinates, so they scroll with the content. A click, a tap
   or a key press (other than scrolling keys) skips to the finished page.

   The inline script in each page's <head> adds html.swarm-pending (which hides the
   [data-swarm] blocks) only when the intro will play, so with JavaScript off or with
   reduced motion, nothing is ever hidden. */
(function () {
  "use strict";

  /* Hard limit: if anything goes wrong, show the page after this long. It is longer than
     the usual 3 to 4 seconds because scrolling during the intro gives the cursors more to build. */
  var SAFETY_MS = 12000;
  var INK = "#102b21";
  var CREW = [
    { name: "Design", color: "#f4b88a" },
    { name: "Code", color: "#7fe3bd" },
    { name: "Network", color: "#7cc4ff" },
    { name: "Data", color: "#c49bff" },
    { name: "Server", color: "#ff8a7a" }
  ];
  /* Directions the cursors scatter in at the end, in degrees (0 = right, 90 = down). */
  var EXIT_ANGLES = [200, 270, 330, 60, 130];
  /* Keys that scroll the page, so they don't skip the intro. */
  var SCROLL_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown",
    "Home", "End", " ", "Spacebar", "Shift", "Control", "Alt", "Meta"];
  var GLIDE_EASE = "cubic-bezier(0.45, 0, 0.2, 1)";
  var DRAG_EASE = "cubic-bezier(0.3, 0, 0.25, 1)";

  var root = document.documentElement;
  var motionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var run = null;

  function reducedMotion() {
    return !!(motionQuery && motionQuery.matches);
  }

  function canAnimate() {
    return typeof Element.prototype.animate === "function" &&
      typeof window.Animation === "function" && "finished" in window.Animation.prototype;
  }

  function blocks() {
    return Array.prototype.slice.call(document.querySelectorAll("[data-swarm]"));
  }

  function make(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function px(n) {
    return Math.round(n * 10) / 10 + "px";
  }

  function translate(x, y) {
    return "translate(" + px(x) + "," + px(y) + ")";
  }

  function tint(hex, alpha) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + alpha + ")";
  }

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function nextFrame() {
    return new Promise(function (resolve) { requestAnimationFrame(function () { resolve(); }); });
  }

  /* ---------- Page coordinates ----------
     The overlay covers the whole <body>, so positions are measured from the top-left
     of the page, not the screen. Scrolling moves everything together. */

  function origin() {
    var b = document.body.getBoundingClientRect();
    return { x: b.left, y: b.top };
  }

  function pageRect(el) {
    var o = origin();
    var r = el.getBoundingClientRect();
    return { left: r.left - o.x, top: r.top - o.y, width: r.width, height: r.height,
      right: r.right - o.x, bottom: r.bottom - o.y };
  }

  /* The part of the page currently on screen. */
  function view() {
    var o = origin();
    return { left: -o.x, top: -o.y, width: document.documentElement.clientWidth, height: window.innerHeight };
  }

  /* ---------- Animation helpers ---------- */

  /* Every animation sets its end state as the element's own style first, so nothing
     depends on fill modes and a cancelled animation leaves things where they belong. */
  function animate(r, node, frames, options, endStyle) {
    if (endStyle) {
      for (var prop in endStyle) node.style[prop] = endStyle[prop];
    }
    var a = node.animate(frames, options);
    r.anims.push(a);
    return a.finished.then(function () {
      if (r.done) throw new Error("swarm cancelled");
    });
  }

  /* For decorative effects nobody waits on. */
  function decorate(r, node, frames, options, endStyle) {
    animate(r, node, frames, options, endStyle).catch(function () {});
  }

  function remove(node) {
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  /* ---------- Finishing and skipping ---------- */

  function finish() {
    var r = run;
    run = null;
    root.classList.remove("swarm-pending");
    blocks().forEach(function (el) { el.classList.remove("swarm-built"); });
    if (!r) return;
    r.done = true;
    clearTimeout(r.safety);
    if (r.listeners) {
      r.listeners.forEach(function (l) { window.removeEventListener(l[0], l[1], true); });
    }
    r.anims.forEach(function (a) {
      try { a.cancel(); } catch (e) { /* already gone */ }
    });
    remove(r.overlay);
  }

  /* Skip on a left click on the page, a tap (a touch that doesn't move), or a key press
     that isn't a scrolling key. Nothing to do with scrolling ever skips: not the wheel or
     touchpad, not swiping, not clicking or dragging the scrollbar, not middle-click
     autoscroll, and not a tap that stops a page that is still gliding from a swipe. */
  function listenForSkip(r) {
    var touch = null;
    r.lastScroll = 0;
    function skip() {
      if (run === r) finish();
    }
    function on(type, fn) {
      window.addEventListener(type, fn, { capture: true, passive: true });
      r.listeners.push([type, fn]);
    }
    function scrolling() {
      r.lastScroll = Date.now();
    }
    on("scroll", scrolling);
    on("wheel", scrolling);
    on("touchmove", scrolling);
    on("pointerdown", function (e) {
      if (e.pointerType === "touch") {
        touch = { x: e.clientX, y: e.clientY, t: Date.now() };
        return;
      }
      if (e.button !== 0) return;
      /* A press beyond the page's visible width or height is on a scrollbar. */
      var d = document.documentElement;
      if (e.clientX >= d.clientWidth || e.clientY >= d.clientHeight) return;
      skip();
    });
    on("pointerup", function (e) {
      if (e.pointerType !== "touch" || !touch) return;
      var moved = Math.abs(e.clientX - touch.x) + Math.abs(e.clientY - touch.y);
      var quick = Date.now() - touch.t < 500;
      var stillGliding = touch.t - r.lastScroll < 700;
      touch = null;
      if (moved < 10 && quick && !stillGliding) skip();
    });
    on("pointercancel", function () { touch = null; });
    on("keydown", function (e) {
      if (SCROLL_KEYS.indexOf(e.key) < 0) skip();
    });
  }

  /* ---------- Cursors ---------- */

  function makeCursor(r, member, x, y) {
    var node = make("div", "swarm-cursor");
    node.innerHTML =
      '<svg viewBox="0 0 20 22" aria-hidden="true"><path d="M2 2 L2 19 L6.6 14.6 L9.6 21.2 L12.7 19.8 L9.8 13.4 L16 13.4 Z" fill="' +
      member.color + '"/></svg>';
    var tag = make("span", "swarm-tag");
    tag.textContent = member.name;
    tag.style.background = member.color;
    node.appendChild(tag);
    node.style.transform = translate(x, y);
    r.overlay.appendChild(node);
    decorate(r, node, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: "ease-out" }, { opacity: "1" });
    return { el: node, arrow: node.firstChild, x: x, y: y, bend: 1, color: member.color };
  }

  /* Near the right edge, the name tag sits on the left of the arrow so it stays on screen.
     It moves back as soon as a cursor heads away, and only moves left once it arrives. */
  function flipTag(r, cursor, move) {
    var flip = cursor.x > r.width - 110;
    if (!flip) {
      cursor.el.classList.remove("swarm-cursor-flip");
      return move;
    }
    return move.then(function () { cursor.el.classList.add("swarm-cursor-flip"); });
  }

  /* Glide along a gently curved path (a quadratic curve sampled into keyframes). */
  function glide(r, cursor, x, y, duration, easing) {
    var x0 = cursor.x;
    var y0 = cursor.y;
    var dx = x - x0;
    var dy = y - y0;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    cursor.bend = -cursor.bend;
    var bend = cursor.bend * Math.min(dist * 0.18, 90);
    var cx = (x0 + x) / 2 - (dy / dist) * bend;
    var cy = (y0 + y) / 2 + (dx / dist) * bend;
    var frames = [];
    for (var i = 0; i <= 14; i++) {
      var t = i / 14;
      var u = 1 - t;
      frames.push({
        transform: translate(u * u * x0 + 2 * u * t * cx + t * t * x, u * u * y0 + 2 * u * t * cy + t * t * y)
      });
    }
    cursor.x = x;
    cursor.y = y;
    return flipTag(r, cursor, animate(r, cursor.el, frames, {
      duration: duration || Math.max(300, Math.min(440, 260 + dist * 0.22)),
      easing: easing || GLIDE_EASE
    }, { transform: translate(x, y) }));
  }

  /* A soft ring at the cursor tip, like a click. */
  function ripple(r, x, y, color) {
    var ring = make("div", "swarm-ripple");
    ring.style.borderColor = color;
    r.overlay.appendChild(ring);
    animate(r, ring, [
      { transform: translate(x, y) + " scale(0.2)", opacity: 0.9 },
      { transform: translate(x, y) + " scale(1)", opacity: 0 }
    ], { duration: 520, easing: "cubic-bezier(0.2, 0.6, 0.3, 1)" }, { opacity: "0" })
      .then(function () { remove(ring); }, function () {});
  }

  function press(r, cursor) {
    decorate(r, cursor.arrow, [
      { transform: "scale(1)" },
      { transform: "scale(0.84)", offset: 0.4 },
      { transform: "scale(1)" }
    ], { duration: 240, easing: "ease-out" });
    ripple(r, cursor.x, cursor.y, cursor.color);
  }

  /* ---------- Selection box, in the cursor's own colour ---------- */

  function makeBox(r, rect, color) {
    var w = rect.width;
    var h = rect.height;
    var box = make("div", "swarm-box");
    box.style.transform = translate(rect.left, rect.top);
    var parts = [];

    function part(className, width, height, from, to) {
      var node = make("div", className);
      if (width !== null) node.style.width = px(width);
      if (height !== null) node.style.height = px(height);
      node.style.transform = from;
      if (className === "swarm-edge") node.style.background = color;
      if (className === "swarm-handle") node.style.borderColor = color;
      if (className === "swarm-fill") {
        node.style.background = tint(color, 0.22);
        node.style.opacity = "0.45";
      }
      box.appendChild(node);
      parts.push({ el: node, from: from, to: to });
      return node;
    }

    var fill = part("swarm-fill", w, h, "scale(0, 0)", "scale(1, 1)");
    part("swarm-edge", w, 1, "scaleX(0)", "scaleX(1)");
    part("swarm-edge", 1, h, "scaleY(0)", "scaleY(1)");
    part("swarm-edge", w, 1, "translate(0px, 0px) scaleX(0)", "translate(0px, " + px(h - 1) + ") scaleX(1)");
    part("swarm-edge", 1, h, "translate(0px, 0px) scaleY(0)", "translate(" + px(w - 1) + ", 0px) scaleY(1)");
    part("swarm-handle", null, null, "translate(0px, 0px)", "translate(0px, 0px)");
    part("swarm-handle", null, null, "translate(0px, 0px)", "translate(" + px(w) + ", 0px)");
    part("swarm-handle", null, null, "translate(0px, 0px)", "translate(0px, " + px(h) + ")");
    part("swarm-handle", null, null, "translate(0px, 0px)", "translate(" + px(w) + ", " + px(h) + ")");

    r.overlay.appendChild(box);
    return { el: box, fill: fill, parts: parts };
  }

  /* The cursor drags from the block's top-left to its bottom-right while the box grows with it. */
  function drag(r, cursor, box, rect) {
    var options = { duration: 280, easing: DRAG_EASE };
    var x0 = cursor.x;
    var y0 = cursor.y;
    cursor.x = rect.right;
    cursor.y = rect.bottom;
    var jobs = [
      flipTag(r, cursor, animate(r, cursor.el, [{ transform: translate(x0, y0) }, { transform: translate(cursor.x, cursor.y) }],
        options, { transform: translate(cursor.x, cursor.y) }))
    ];
    box.parts.forEach(function (p) {
      jobs.push(animate(r, p.el, [{ transform: p.from }, { transform: p.to }], options, { transform: p.to }));
    });
    return Promise.all(jobs);
  }

  function showPill(r, rect, color) {
    var pill = make("div", "swarm-pill");
    pill.textContent = Math.round(rect.width) + " × " + Math.round(rect.height);
    pill.style.background = color;
    pill.style.color = INK;
    pill.style.opacity = "0";
    r.overlay.appendChild(pill);
    var pw = pill.offsetWidth;
    var ph = pill.offsetHeight;
    var v = view();
    var x = Math.min(Math.max(rect.left + rect.width / 2 - pw / 2, 4), r.width - pw - 4);
    var y = rect.bottom + 8;
    /* If the label would fall below the screen, tuck it inside the bottom of the box. */
    if (y + ph > v.top + v.height - 4) y = Math.max(rect.bottom - ph - 8, rect.top + 4);
    decorate(r, pill, [
      { opacity: 0, transform: translate(x, y + 5) },
      { opacity: 1, transform: translate(x, y) }
    ], { duration: 200, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" }, { opacity: "1", transform: translate(x, y) });
    return pill;
  }

  function fadeAway(r, node, duration) {
    return animate(r, node, [{ opacity: 1 }, { opacity: 0 }], { duration: duration || 260, easing: "ease-in" }, { opacity: "0" })
      .then(function () { remove(node); });
  }

  /* The block lifts into place with a soft settle, while its selection glows and fades. */
  function dropIn(r, block, box, pill) {
    block.classList.add("swarm-built");
    decorate(r, box.fill, [{ opacity: 0.45 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }],
      { duration: 360, easing: "ease-out" }, { opacity: "0" });
    return Promise.all([
      animate(r, block, [
        { opacity: 0, transform: "translateY(10px) scale(0.985)" },
        { opacity: 1, transform: "translateY(-1px) scale(1.002)", offset: 0.7 },
        { opacity: 1, transform: "none" }
      ], { duration: 420, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" }),
      fadeAway(r, box.el, 300),
      fadeAway(r, pill, 200)
    ]);
  }

  /* ---------- One cursor's job ----------
     The build follows the screen: cursors only work on blocks that are on screen right
     now, so anything that scrolls into view during the intro is built too. The intro
     ends once nothing on screen is left to build; then the rest of the page appears. */

  /* A block inside a glass panel waits until that panel has been dropped in. */
  function ready(block) {
    var parent = block.parentElement && block.parentElement.closest("[data-swarm]");
    return !parent || parent.classList.contains("swarm-built");
  }

  function onScreen(rect, v) {
    return rect.bottom > v.top + 8 && rect.top < v.top + v.height - 8;
  }

  /* The first block, in page order, that is on screen and ready to build. */
  function takeNext(r) {
    var v = view();
    for (var i = 0; i < r.queue.length; i++) {
      if (ready(r.queue[i]) && onScreen(pageRect(r.queue[i]), v)) return r.queue.splice(i, 1)[0];
    }
    return null;
  }

  function waitingOnScreen(r) {
    var v = view();
    return r.queue.some(function (block) { return onScreen(pageRect(block), v); });
  }

  /* If the page scrolled away from an idle cursor, bring it back into view. */
  function stayInView(r, cursor, n) {
    var v = view();
    if (cursor.y > v.top + 20 && cursor.y < v.top + v.height - 40) return null;
    var x = Math.min(Math.max(cursor.x, 24), r.width - 60 - n * 40);
    var y = v.top + v.height * (0.25 + 0.12 * (n % 4));
    return glide(r, cursor, x, y, 420, "cubic-bezier(0.3, 0, 0.2, 1)");
  }

  async function work(r, cursor, n, delay) {
    await sleep(delay);
    while (!r.done) {
      var block = takeNext(r);
      if (!block) {
        /* Nothing on screen left to build, and nobody mid-build: the intro is done. */
        if (!waitingOnScreen(r) && r.busy === 0) return;
        /* Otherwise wait: another cursor is building the panel these blocks sit in. */
        await (stayInView(r, cursor, n) || sleep(60));
        continue;
      }
      r.busy++;
      await glide(r, cursor, pageRect(block).left, pageRect(block).top);
      var rect = pageRect(block);
      /* Scrolled out of view on the way there: drop it in at once and move on,
         so the cursors keep up with what the visitor is looking at. */
      if (!onScreen(rect, view())) {
        block.classList.add("swarm-built");
        r.busy--;
        continue;
      }
      press(r, cursor);
      var box = makeBox(r, rect, cursor.color);
      await drag(r, cursor, box, rect);
      var pill = showPill(r, rect, cursor.color);
      await sleep(r.hold);
      if (r.done) return;
      ripple(r, cursor.x, cursor.y, cursor.color);
      r.drops.push(dropIn(r, block, box, pill));
      r.busy--;
    }
  }

  /* ---------- A full run ---------- */

  async function play() {
    if (run) finish();
    if (window.swarmFailsafe) {
      clearTimeout(window.swarmFailsafe);
      window.swarmFailsafe = null;
    }
    if (reducedMotion() || !canAnimate()) {
      finish();
      return;
    }

    root.classList.add("swarm-pending");
    var r = run = { done: false, anims: [], drops: [], listeners: [] };
    r.safety = setTimeout(function () { if (run === r) finish(); }, SAFETY_MS);

    try {
      /* Wait a moment for the web fonts so the boxes measure the final text. */
      if (document.fonts && document.fonts.ready) {
        await Promise.race([document.fonts.ready, sleep(600)]);
      }
      /* Two frames, so a click that started this run doesn't also skip it. */
      await nextFrame();
      await nextFrame();
      if (r.done) return;
      listenForSkip(r);

      /* Every block waits to be built. Blocks the visitor never scrolls to during the
         intro simply appear when it ends. */
      var v = view();
      r.busy = 0;
      r.queue = blocks().filter(function (el) {
        var b = pageRect(el);
        if (b.width > 0 && b.height > 0) return true;
        el.classList.add("swarm-built");
        return false;
      });
      if (!waitingOnScreen(r)) {
        finish();
        return;
      }

      r.overlay = make("div", "swarm-overlay");
      r.overlay.setAttribute("aria-hidden", "true");
      var grid = make("div", "swarm-grid");
      r.overlay.appendChild(grid);
      document.body.appendChild(r.overlay);
      r.width = r.overlay.clientWidth;
      decorate(r, grid, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: "ease-out" }, { opacity: "1" });

      /* Phones get fewer cursors, so each one pauses a little less to keep the same pace. */
      var phone = window.matchMedia("(max-width: 40rem)").matches;
      var count = phone ? 3 : 5;
      r.hold = phone ? 120 : 170;
      var starts = [
        [-40, v.height * 0.3], [v.width * 0.4, -40], [v.width + 40, v.height * 0.2],
        [v.width * 0.7, v.height + 40], [-40, v.height * 0.8]
      ];
      var cursors = [];
      var jobs = [];
      for (var i = 0; i < count; i++) {
        cursors.push(makeCursor(r, CREW[i], v.left + starts[i][0], v.top + starts[i][1]));
        jobs.push(work(r, cursors[i], i, i * 110));
      }
      await Promise.all(jobs);
      if (r.done) return;

      /* Everything is built: scatter in different directions and fade the grid. */
      var reach = Math.sqrt(v.width * v.width + v.height * v.height) * 0.6;
      var exits = cursors.map(function (cursor, n) {
        var angle = (EXIT_ANGLES[n] * Math.PI) / 180;
        decorate(r, cursor.el, [{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }],
          { duration: 480, easing: "ease-in" }, { opacity: "0" });
        return glide(r, cursor, cursor.x + Math.cos(angle) * reach, cursor.y + Math.sin(angle) * reach,
          480, "cubic-bezier(0.5, 0, 0.75, 0)");
      });
      exits.push(fadeAway(r, grid, 480));
      await Promise.all(r.drops.concat(exits));
      if (run === r) finish();
    } catch (e) {
      if (run === r) finish();
    }
  }

  /* ---------- Rebuild button ---------- */

  function setUpReplay() {
    var button = document.querySelector(".swarm-replay");
    if (!button || reducedMotion() || !canAnimate()) return;
    button.hidden = false;
    button.addEventListener("click", function () {
      finish();
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      play();
    });
  }

  try {
    setUpReplay();
    if (root.classList.contains("swarm-pending")) play();
  } catch (e) {
    finish();
  }
})();
