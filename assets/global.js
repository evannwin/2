/* SomNexra — global.js
   Cart drawer, AJAX add-to-cart, quantity steppers, sticky bars.
   Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var routes = (window.theme && window.theme.routes) || {
    cart: '/cart',
    cartAdd: '/cart/add',
    cartChange: '/cart/change',
    root: '/'
  };

  function formatMoney(cents) {
    var format = (window.theme && window.theme.moneyFormat) || '${{amount}}';
    var value = (cents / 100).toFixed(2);
    var parts = value.split('.');
    var withCommas = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + parts[1];
    return format
      .replace(/\{\{\s*amount\s*\}\}/, withCommas)
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, parts[0])
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, parts[0] + ',' + parts[1]);
  }
  window.themeFormatMoney = formatMoney;

  /* ---------- Cart drawer ---------- */

  function getDrawer() { return document.getElementById('CartDrawer'); }

  function openDrawer() {
    var drawer = getDrawer();
    if (!drawer) return;
    document.body.classList.add('drawer-open');
    drawer.setAttribute('aria-hidden', 'false');
    var closeBtn = drawer.querySelector('.drawer__close');
    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer() {
    var drawer = getDrawer();
    if (!drawer) return;
    document.body.classList.remove('drawer-open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  function updateCartCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      el.setAttribute('data-count', count);
    });
  }

  /* Re-render the drawer via the Section Rendering API so all markup
     (lines, free-shipping bar, upsell) stays server-rendered Liquid. */
  function refreshDrawer(sectionHtml) {
    var drawer = getDrawer();
    if (!drawer || !sectionHtml) return;
    var parsed = new DOMParser().parseFromString(sectionHtml, 'text/html');
    var fresh = parsed.getElementById('CartDrawer');
    if (fresh) {
      drawer.innerHTML = fresh.innerHTML;
      var countEl = fresh.querySelector('[data-drawer-cart-count]');
      if (countEl) updateCartCount(countEl.getAttribute('data-drawer-cart-count'));
    }
  }

  function fetchDrawerSection() {
    return fetch(routes.root + '?sections=cart-drawer')
      .then(function (r) { return r.json(); })
      .then(function (data) { refreshDrawer(data['cart-drawer']); });
  }

  function addToCart(body) {
    body.sections = 'cart-drawer';
    body.sections_url = routes.root;
    return fetch(routes.cartAdd + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) throw data;
        return data;
      });
    });
  }

  function changeLine(line, quantity) {
    return fetch(routes.cartChange + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ line: line, quantity: quantity, sections: 'cart-drawer', sections_url: routes.root })
    }).then(function (r) { return r.json(); });
  }

  /* ---------- Event delegation ---------- */

  document.addEventListener('click', function (e) {
    var target;

    // Open drawer
    target = e.target.closest('[data-cart-open]');
    if (target) {
      e.preventDefault();
      openDrawer();
      return;
    }

    // Close drawer (button or overlay)
    target = e.target.closest('[data-cart-close]');
    if (target) {
      e.preventDefault();
      closeDrawer();
      return;
    }

    // Drawer line quantity +/- and remove
    target = e.target.closest('[data-line-change]');
    if (target) {
      e.preventDefault();
      var line = parseInt(target.getAttribute('data-line'), 10);
      var qty = parseInt(target.getAttribute('data-quantity'), 10);
      target.disabled = true;
      changeLine(line, qty).then(function (data) {
        if (data.sections) refreshDrawer(data.sections['cart-drawer']);
        if (typeof data.item_count !== 'undefined') updateCartCount(data.item_count);
      });
      return;
    }

    // Generic quantity steppers (product page + cart page)
    target = e.target.closest('[data-qty-change]');
    if (target) {
      var input = target.closest('.qty').querySelector('input');
      var step = target.getAttribute('data-qty-change') === 'up' ? 1 : -1;
      var next = Math.max(parseInt(input.value || '1', 10) + step, parseInt(input.min || '1', 10));
      input.value = next;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('drawer-open')) closeDrawer();
  });

  /* AJAX add-to-cart for any product form posting to /cart/add */
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[action*="/cart/add"]');
    if (!form) return;
    e.preventDefault();

    var button = form.querySelector('[type="submit"]');
    var originalText;
    if (button) {
      originalText = button.textContent;
      button.textContent = button.getAttribute('data-adding-text') || 'Adding…';
      button.disabled = true;
    }

    var formData = new FormData(form);
    var body = {
      id: parseInt(formData.get('id'), 10),
      quantity: parseInt(formData.get('quantity') || '1', 10)
    };

    addToCart(body)
      .then(function (data) {
        if (data.sections) refreshDrawer(data.sections['cart-drawer']);
        return fetch(routes.cart + '.js').then(function (r) { return r.json(); });
      })
      .then(function (cart) {
        updateCartCount(cart.item_count);
        openDrawer();
      })
      .catch(function (err) {
        var message = (err && err.description) || 'Could not add to cart. Please try again.';
        var errorEl = form.querySelector('[data-form-error]');
        if (errorEl) {
          errorEl.textContent = message;
          errorEl.hidden = false;
        } else {
          alert(message);
        }
      })
      .finally(function () {
        if (button) {
          button.textContent = originalText;
          button.disabled = false;
        }
      });
  });

  /* Quick add buttons (drawer upsell, upsell section) */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-quick-add]');
    if (!btn) return;
    e.preventDefault();
    var id = parseInt(btn.getAttribute('data-quick-add'), 10);
    var original = btn.textContent;
    btn.textContent = 'Adding…';
    btn.disabled = true;
    addToCart({ id: id, quantity: 1 })
      .then(function (data) {
        if (data.sections) refreshDrawer(data.sections['cart-drawer']);
        return fetch(routes.cart + '.js').then(function (r) { return r.json(); });
      })
      .then(function (cart) {
        updateCartCount(cart.item_count);
        openDrawer();
      })
      .catch(function () { btn.textContent = 'Unavailable'; })
      .finally(function () {
        btn.textContent = original;
        btn.disabled = false;
      });
  });

  /* ---------- Sticky bars ----------
     Any element with [data-sticky-bar] becomes visible once the element
     referenced by its data-sticky-watch selector scrolls out of view. */
  function initStickyBars() {
    document.querySelectorAll('[data-sticky-bar]').forEach(function (bar) {
      var watchSelector = bar.getAttribute('data-sticky-watch');
      var watched = watchSelector ? document.querySelector(watchSelector) : null;

      if (watched && 'IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            bar.classList.toggle('is-visible', !entry.isIntersecting && entry.boundingClientRect.top < 0);
          });
        }, { threshold: 0 });
        observer.observe(watched);
      } else {
        // Fallback: show after 500px of scroll
        var onScroll = function () {
          bar.classList.toggle('is-visible', window.scrollY > 500);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStickyBars);
  } else {
    initStickyBars();
  }
})();
