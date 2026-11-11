/* Glass tilt: on desktop, the hero panel and each home page row tilt slightly
   toward the mouse, with a soft light sheen that follows it, then ease back flat.
   Skipped on touch screens and when reduced motion is on. The look is in styles.css (.tilt). */
(function () {
  "use strict";

  if (!window.matchMedia) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var MAX_DEG = 4;
  var root = document.documentElement;

  /* Position on the page from offsetLeft/offsetTop, which ignore the tilt itself,
     so measuring a tilted panel doesn't make it wobble. */
  function pagePosition(el) {
    var x = 0;
    var y = 0;
    for (var node = el; node; node = node.offsetParent) {
      x += node.offsetLeft;
      y += node.offsetTop;
    }
    return { x: x, y: y };
  }

  function setUp(el) {
    var frame = 0;
    var last = null;
    el.classList.add("tilt");

    function update() {
      frame = 0;
      if (!last || root.classList.contains("swarm-pending")) return;
      var pos = pagePosition(el);
      var w = el.offsetWidth;
      var h = el.offsetHeight;
      var px = Math.min(Math.max((last.pageX - pos.x) / w, 0), 1);
      var py = Math.min(Math.max((last.pageY - pos.y) / h, 0), 1);
      /* Wide panels tilt a little less, so their far edge doesn't swing too much. */
      var maxY = MAX_DEG * Math.min(1, 520 / w);
      var maxX = MAX_DEG * Math.min(1, 320 / h);
      el.style.setProperty("--tilt-y", ((px - 0.5) * 2 * maxY).toFixed(2) + "deg");
      el.style.setProperty("--tilt-x", ((0.5 - py) * 2 * maxX).toFixed(2) + "deg");
      el.style.setProperty("--glow-x", (px * 100).toFixed(1) + "%");
      el.style.setProperty("--glow-y", (py * 100).toFixed(1) + "%");
      el.classList.add("is-tilting");
    }

    el.addEventListener("pointermove", function (event) {
      if (event.pointerType !== "mouse") return;
      last = { pageX: event.pageX, pageY: event.pageY };
      if (!frame) frame = requestAnimationFrame(update);
    });

    el.addEventListener("pointerleave", function () {
      last = null;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      el.classList.remove("is-tilting");
      el.style.setProperty("--tilt-x", "0deg");
      el.style.setProperty("--tilt-y", "0deg");
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll(".hero, .index-row"), setUp);
})();
