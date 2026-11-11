/* Phone menu: under 40rem the header links fold into a "Menu" button that opens them
   as a dropdown. It opens and closes with a click, a tap or the keyboard, and closes with
   Escape, a click outside it, or tabbing out of it.

   Loaded in <head> without defer (it is tiny) so the class below is set before the page
   is drawn. Without JavaScript the class is never set, the button stays hidden and the
   links show as a plain list. The look is in styles.css ("Phone menu"). */
(function () {
  "use strict";

  document.documentElement.classList.add("nav-js");

  function setUp() {
    var button = document.querySelector(".menu-toggle");
    if (!button) return;
    var nav = button.parentNode;
    var list = document.getElementById(button.getAttribute("aria-controls"));
    if (!list) return;

    function isOpen() {
      return button.getAttribute("aria-expanded") === "true";
    }

    function open() {
      button.setAttribute("aria-expanded", "true");
      nav.classList.add("is-open");
    }

    function close(returnFocus) {
      if (!isOpen()) return;
      button.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      if (returnFocus) button.focus();
    }

    button.addEventListener("click", function () {
      if (isOpen()) close(false);
      else open();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) close(true);
    });

    document.addEventListener("click", function (event) {
      if (isOpen() && !nav.contains(event.target)) close(false);
    });

    nav.addEventListener("focusout", function (event) {
      if (isOpen() && event.relatedTarget && !nav.contains(event.relatedTarget)) close(false);
    });

    /* If the screen widens past the phone layout, put the menu back to normal. */
    if (window.matchMedia) {
      var wide = window.matchMedia("(min-width: 40.0625rem)");
      var reset = function () { if (wide.matches) close(false); };
      if (wide.addEventListener) wide.addEventListener("change", reset);
      else if (wide.addListener) wide.addListener(reset);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setUp);
  else setUp();
})();
