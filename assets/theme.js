/* SomNexra — theme.js
   Vanilla JS only. Small, deliberate, no dependencies. */

(function () {
  'use strict';

  /* Header: soft shadow once the page scrolls */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
