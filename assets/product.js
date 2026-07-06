/* SomNexra — product.js
   Loaded only on the product page (from the main-product section).
   Variant picker, price/stock updates, gallery, lightbox. */
(function () {
  'use strict';

  function init(root) {
    var dataEl = root.querySelector('[data-product-json]');
    if (!dataEl) return;
    var config = JSON.parse(dataEl.textContent);
    var variants = config.variants;
    var lowStockThreshold = config.lowStockThreshold || 0;

    var form = root.querySelector('form[action*="/cart/add"]');
    var idInput = form ? form.querySelector('input[name="id"]') : null;

    /* ----- Variant selection ----- */

    function selectedOptions() {
      var options = [];
      root.querySelectorAll('[data-option-index]').forEach(function (group) {
        var checked = group.querySelector('input:checked');
        if (checked) options[parseInt(group.getAttribute('data-option-index'), 10)] = checked.value;
      });
      return options;
    }

    function findVariant(options) {
      return variants.find(function (v) {
        return v.options.every(function (opt, i) { return opt === options[i]; });
      });
    }

    function updatePrice(variant) {
      root.querySelectorAll('[data-price-current]').forEach(function (el) {
        el.textContent = window.themeFormatMoney(variant.price);
      });
      root.querySelectorAll('[data-price-compare]').forEach(function (el) {
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          el.textContent = window.themeFormatMoney(variant.compare_at_price);
          el.hidden = false;
        } else {
          el.hidden = true;
        }
      });
      root.querySelectorAll('[data-price-save]').forEach(function (el) {
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          var pct = Math.round((1 - variant.price / variant.compare_at_price) * 100);
          el.textContent = 'Save ' + pct + '%';
          el.hidden = false;
        } else {
          el.hidden = true;
        }
      });
    }

    function updateStock(variant) {
      var stockEl = root.querySelector('[data-stock]');
      if (!stockEl) return;
      var textEl = stockEl.querySelector('[data-stock-text]');
      stockEl.classList.remove('stock--low', 'stock--out');
      stockEl.hidden = false;

      if (!variant.available) {
        stockEl.classList.add('stock--out');
        textEl.textContent = stockEl.getAttribute('data-text-out') || 'Sold out';
      } else if (
        variant.managed &&
        variant.inventory_quantity > 0 &&
        variant.inventory_quantity <= lowStockThreshold
      ) {
        stockEl.classList.add('stock--low');
        var template = stockEl.getAttribute('data-text-low') || 'Only [count] left in stock';
        textEl.textContent = template.replace('[count]', variant.inventory_quantity);
      } else {
        textEl.textContent = stockEl.getAttribute('data-text-in') || 'In stock — ready to ship';
      }
    }

    function updateButtons(variant) {
      var atc = root.querySelectorAll('[data-add-to-cart]');
      atc.forEach(function (btn) {
        btn.disabled = !variant.available;
        var label = btn.querySelector('[data-atc-label]') || btn;
        label.textContent = variant.available
          ? (btn.getAttribute('data-text-add') || 'Add to cart')
          : (btn.getAttribute('data-text-sold-out') || 'Sold out');
      });
    }

    function updateMedia(variant) {
      if (!variant.featured_media_id) return;
      var slide = root.querySelector('.gallery__slide[data-media-id="' + variant.featured_media_id + '"]');
      var track = root.querySelector('.gallery__main');
      if (slide && track) {
        track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
      }
    }

    function updateUrl(variant) {
      if (!window.history.replaceState) return;
      var url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
    }

    function onVariantChange() {
      var variant = findVariant(selectedOptions());
      if (!variant) return;
      if (idInput) idInput.value = variant.id;
      updatePrice(variant);
      updateStock(variant);
      updateButtons(variant);
      updateMedia(variant);
      updateUrl(variant);
      // Sticky bar price
      var stickyPrice = document.querySelector('[data-sticky-price]');
      if (stickyPrice) stickyPrice.textContent = window.themeFormatMoney(variant.price);
    }

    root.querySelectorAll('[data-option-index] input').forEach(function (input) {
      input.addEventListener('change', onVariantChange);
    });

    /* ----- Gallery ----- */

    var track = root.querySelector('.gallery__main');
    var thumbs = root.querySelectorAll('.gallery__thumb');

    thumbs.forEach(function (thumb, index) {
      thumb.addEventListener('click', function () {
        var slide = track.children[index];
        if (slide) track.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
      });
    });

    function setActiveThumb() {
      if (!track || !thumbs.length) return;
      var index = Math.round(track.scrollLeft / track.clientWidth);
      thumbs.forEach(function (t, i) { t.classList.toggle('is-active', i === index); });
    }
    if (track) {
      var scrollTimer;
      track.addEventListener('scroll', function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(setActiveThumb, 80);
      }, { passive: true });
      setActiveThumb();
    }

    /* ----- Lightbox zoom ----- */

    var lightbox = document.getElementById('ProductLightbox');
    if (lightbox) {
      var lightboxImg = lightbox.querySelector('img');
      root.querySelectorAll('.gallery__slide[data-zoom-src]').forEach(function (slide) {
        slide.addEventListener('click', function () {
          lightboxImg.src = slide.getAttribute('data-zoom-src');
          lightboxImg.alt = slide.querySelector('img') ? slide.querySelector('img').alt : '';
          lightbox.classList.add('is-open');
          document.body.style.overflow = 'hidden';
        });
      });
      function closeLightbox() {
        lightbox.classList.remove('is-open');
        lightboxImg.src = '';
        document.body.style.overflow = '';
      }
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox || e.target.closest('.lightbox__close')) closeLightbox();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
      });
    }

    /* ----- Sticky bar add-to-cart proxies main form ----- */

    document.querySelectorAll('[data-sticky-atc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (form) form.requestSubmit ? form.requestSubmit() : form.submit();
      });
    });

    // Initialize state for the pre-selected variant
    onVariantChange();
  }

  function boot() {
    document.querySelectorAll('[data-product-root]').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Re-init when the theme editor reloads the section
  document.addEventListener('shopify:section:load', boot);
})();
