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

  /* Related products: fetch recommendations once the section nears view */
  var recs = document.querySelector('[data-recommendations]');
  if (recs && recs.dataset.url && 'IntersectionObserver' in window) {
    var loadRecommendations = function () {
      fetch(recs.dataset.url)
        .then(function (response) { return response.text(); })
        .then(function (text) {
          var html = new DOMParser().parseFromString(text, 'text/html');
          var fresh = html.querySelector('[data-recommendations]');
          if (fresh && fresh.innerHTML.trim().length) {
            recs.innerHTML = fresh.innerHTML;
          }
        })
        .catch(function () { /* leave the section empty on failure */ });
    };
    var recsObserver = new IntersectionObserver(function (entries, observer) {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      loadRecommendations();
    }, { rootMargin: '400px 0px' });
    recsObserver.observe(recs);
  }
})();
