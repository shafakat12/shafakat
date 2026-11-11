/* Lab: the type filters on lab.html, and the Copy buttons on code blocks in posts.
   Both only add to the page; without JavaScript every post shows and code is still selectable. */
(function () {
  "use strict";

  /* ---------- Filters (lab.html) ----------
     The chips show only posts whose data-type matches. The choice goes in the address,
     like lab.html#papers, so a filtered view can be shared. */

  var TYPES = {
    projects: { type: "project", name: "projects" },
    papers: { type: "paper", name: "papers" },
    benchmarks: { type: "benchmark", name: "benchmarks" },
    experiments: { type: "experiment", name: "experiments" }
  };

  function hashFor(type) {
    for (var key in TYPES) {
      if (TYPES[key].type === type) return key;
    }
    return "";
  }

  function setUpFilters() {
    var bar = document.querySelector(".filters");
    var list = document.querySelector(".post-list");
    if (!bar || !list) return;
    var buttons = Array.prototype.slice.call(bar.querySelectorAll("button[data-filter]"));
    var none = document.querySelector(".lab-none");
    var status = document.querySelector(".lab-status");
    bar.hidden = false;

    function apply(type, updateAddress) {
      var posts = list.querySelectorAll("li[data-type]");
      var shown = 0;
      Array.prototype.forEach.call(posts, function (post) {
        var match = type === "all" || post.getAttribute("data-type") === type;
        post.hidden = !match;
        if (match) shown++;
      });
      buttons.forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.getAttribute("data-filter") === type));
      });
      var key = hashFor(type);
      if (none) {
        /* Posts exist but none of this type: say so. (No posts at all: the "on the way" panel shows instead.) */
        none.hidden = !(posts.length && !shown);
        if (key) none.textContent = "No " + TYPES[key].name + " yet.";
      }
      if (status) {
        status.textContent = posts.length ? "Showing " + shown + " of " + posts.length + " posts." : "";
      }
      if (updateAddress && window.history && history.replaceState) {
        history.replaceState(null, "", key ? "#" + key : location.pathname + location.search);
      }
    }

    function fromAddress() {
      var key = location.hash.replace("#", "").toLowerCase();
      apply(TYPES[key] ? TYPES[key].type : "all", false);
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        apply(button.getAttribute("data-filter"), true);
      });
    });
    window.addEventListener("hashchange", fromAddress);
    fromAddress();
  }

  /* ---------- Copy buttons on code blocks (post pages) ---------- */

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    /* Older browsers: copy through a hidden text box. */
    return new Promise(function (resolve, reject) {
      var box = document.createElement("textarea");
      box.value = text;
      box.setAttribute("readonly", "");
      box.style.position = "fixed";
      box.style.opacity = "0";
      document.body.appendChild(box);
      box.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(box);
      if (ok) resolve(); else reject(new Error("copy failed"));
    });
  }

  function setUpCopyButtons() {
    var blocks = document.querySelectorAll(".post-body pre");
    Array.prototype.forEach.call(blocks, function (pre) {
      if (pre.parentNode.classList.contains("code-block")) return;
      var wrap = document.createElement("div");
      wrap.className = "code-block";
      var bar = document.createElement("div");
      bar.className = "code-bar";
      var lang = document.createElement("span");
      lang.className = "code-lang";
      lang.textContent = pre.getAttribute("data-lang") || "code";
      var button = document.createElement("button");
      button.type = "button";
      button.className = "copy-button";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy code to clipboard");
      bar.appendChild(lang);
      bar.appendChild(button);
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(bar);
      wrap.appendChild(pre);

      var timer = 0;
      button.addEventListener("click", function () {
        copyText(pre.innerText.replace(/\n$/, "")).then(function () {
          button.textContent = "Copied";
        }, function () {
          /* Copying was blocked: select the code so the visitor can copy it themselves. */
          var range = document.createRange();
          range.selectNodeContents(pre);
          var selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          button.textContent = "Selected: press Ctrl+C";
        });
        clearTimeout(timer);
        timer = setTimeout(function () { button.textContent = "Copy"; }, 1800);
      });
    });
  }

  setUpFilters();
  setUpCopyButtons();
})();
