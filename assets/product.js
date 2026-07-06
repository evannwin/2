/* SomNexra — product.js
   Variant picking, gallery, quantity stepper, sticky add-to-cart.
   Vanilla JS, no dependencies. Loaded only on the product template. */

(function () {
  'use strict';

  var section = document.querySelector('[data-product-section]');
  if (!section) return;

  var productJson = section.querySelector('[data-product-json]');
  var stringsJson = section.querySelector('[data-product-strings]');
  if (!productJson) return;

  var product = JSON.parse(productJson.textContent);
  var strings = stringsJson ? JSON.parse(stringsJson.textContent) : {};

  var moneyFormatter = new Intl.NumberFormat(strings.locale || 'en', {
    style: 'currency',
    currency: strings.currency || 'USD',
  });

  function formatMoney(cents) {
    return moneyFormatter.format(cents / 100);
  }

  /* ---- Gallery ---- */
  var slides = section.querySelectorAll('.gallery__slide');
  var thumbs = section.querySelectorAll('.gallery__thumb');

  function activateMedia(mediaId) {
    if (!mediaId) return;
    slides.forEach(function (slide) {
      slide.classList.toggle('is-active', slide.dataset.mediaId === String(mediaId));
    });
    thumbs.forEach(function (thumb) {
      thumb.classList.toggle('is-active', thumb.dataset.mediaId === String(mediaId));
    });
  }

  thumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      activateMedia(thumb.dataset.mediaId);
    });
  });

  /* ---- Variant selection ---- */
  var pickers = section.querySelectorAll('[data-option-picker]');
  var variantInput = section.querySelector('[data-variant-id]');
  var priceEl = section.querySelector('[data-price]');
  var comparePriceEl = section.querySelector('[data-compare-price]');
  var addButton = section.querySelector('[data-add-button]');
  var addLabel = section.querySelector('[data-add-label]');
  var stickyPrice = section.querySelector('[data-price-sticky]');
  var stickyButton = section.querySelector('[data-add-button-sticky]');
  var stickyLabel = section.querySelector('[data-add-label-sticky]');

  function selectedOptions() {
    var values = [];
    pickers.forEach(function (picker) {
      var checked = picker.querySelector('input:checked');
      values[Number(picker.dataset.optionIndex)] = checked ? checked.value : null;
    });
    return values;
  }

  function findVariant(options) {
    return product.variants.find(function (variant) {
      return variant.options.every(function (value, i) {
        return value === options[i];
      });
    });
  }

  function setButtonState(available, label) {
    [
      { btn: addButton, lbl: addLabel },
      { btn: stickyButton, lbl: stickyLabel },
    ].forEach(function (pair) {
      if (!pair.btn) return;
      pair.btn.disabled = !available;
      if (pair.lbl) pair.lbl.textContent = label;
    });
  }

  function onVariantChange() {
    var variant = findVariant(selectedOptions());

    pickers.forEach(function (picker) {
      var checked = picker.querySelector('input:checked');
      var labelEl = picker.querySelector('[data-selected-label]');
      if (checked && labelEl) labelEl.textContent = checked.value;
    });

    if (!variant) {
      setButtonState(false, strings.unavailable || 'Unavailable');
      return;
    }

    variantInput.value = variant.id;

    if (priceEl) priceEl.textContent = formatMoney(variant.price);
    if (stickyPrice) stickyPrice.textContent = formatMoney(variant.price);
    if (comparePriceEl) {
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        comparePriceEl.textContent = formatMoney(variant.compare_at_price);
        comparePriceEl.style.display = '';
      } else {
        comparePriceEl.style.display = 'none';
      }
    }

    setButtonState(
      variant.available,
      variant.available ? (strings.addToCart || 'Add to cart') : (strings.soldOut || 'Sold out')
    );

    if (variant.featured_media) activateMedia(variant.featured_media.id);

    var url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url);
  }

  pickers.forEach(function (picker) {
    picker.addEventListener('change', onVariantChange);
  });

  /* ---- Quantity stepper ---- */
  var qtyInput = section.querySelector('input[name="quantity"]');
  var qtyMinus = section.querySelector('[data-qty-minus]');
  var qtyPlus = section.querySelector('[data-qty-plus]');

  function stepQty(delta) {
    var value = parseInt(qtyInput.value, 10) || 1;
    qtyInput.value = Math.max(1, value + delta);
  }

  if (qtyInput && qtyMinus && qtyPlus) {
    qtyMinus.addEventListener('click', function () { stepQty(-1); });
    qtyPlus.addEventListener('click', function () { stepQty(1); });
  }

  /* ---- Sticky add-to-cart ---- */
  var stickyBar = section.querySelector('[data-sticky-atc]');
  if (stickyBar && addButton && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        var entry = entries[0];
        var passed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        stickyBar.classList.toggle('is-visible', passed);
        stickyBar.setAttribute('aria-hidden', passed ? 'false' : 'true');
        if (stickyButton) stickyButton.tabIndex = passed ? 0 : -1;
      },
      { threshold: 0 }
    );
    observer.observe(addButton);
  }
})();
