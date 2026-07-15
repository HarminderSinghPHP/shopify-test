document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Drawers (cart / search / mobile menu) ---------- */
  function bindDrawerOpenButtons() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-drawer-open]');
      if (!btn) return;
      var id = btn.getAttribute('data-drawer-open');
      var drawer = document.getElementById(id);
      if (drawer) drawer.setAttribute('data-open', 'true');
    });
  }
  bindDrawerOpenButtons();

  function bindDrawerCloseButtons(scope) {
    (scope || document).querySelectorAll('[data-drawer-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var drawer = btn.closest('.drawer');
        if (drawer) drawer.removeAttribute('data-open');
      });
    });
  }
  bindDrawerCloseButtons();

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.drawer[data-open="true"]').forEach(function (d) {
        d.removeAttribute('data-open');
      });
    }
  });

  /* ---------- Cart icon click-through when using page cart ---------- */
  document.querySelectorAll('.cart-icon[data-href]').forEach(function (el) {
    el.addEventListener('click', function () {
      window.location.href = el.getAttribute('data-href');
    });
  });

  /* ---------- Mobile menu drill-down navigation ---------- */
  (function initMobileNavDrilldown() {
    var viewport = document.querySelector('.mobile-nav-viewport');
    var track = document.querySelector('[data-mobile-nav-track]');
    if (!track || !viewport) return;

    var isAnimating = false;

    function getActivePanel() {
      return track.querySelector('.mobile-nav-panel.is-active');
    }

    function forceReset() {
      // Safety net: if a previous transition ever got stuck (e.g. the tab
      // was backgrounded mid-animation), don't let the menu stay locked.
      track.querySelectorAll('.mobile-nav-panel').forEach(function (p) {
        p.classList.remove('is-animating', 'slide-start-right', 'slide-start-left', 'slide-end-right', 'slide-end-left');
        p.style.transform = '';
      });
      isAnimating = false;
      viewport.style.height = '';
    }

    function goToPanel(id, direction) {
      // direction: 'forward' (opening a child) or 'back' (returning to parent)
      if (isAnimating) return;
      var oldPanel = getActivePanel();
      var newPanel = track.querySelector('[data-panel="' + id + '"]');
      if (!newPanel || newPanel === oldPanel) return;

      if (!oldPanel) {
        newPanel.classList.add('is-active');
        return;
      }

      isAnimating = true;
      viewport.style.height = oldPanel.offsetHeight + 'px';

      oldPanel.classList.remove('is-active');
      oldPanel.classList.add('is-animating');
      newPanel.classList.add('is-animating');

      var startClass = direction === 'back' ? 'slide-start-left' : 'slide-start-right';
      var endClass = direction === 'back' ? 'slide-end-right' : 'slide-end-left';

      newPanel.classList.add(startClass);

      // Double rAF: guarantees the browser has painted the "start" position
      // for the incoming panel before we switch to the "end" position, so
      // the transition reliably fires (a single rAF can get batched away).
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          newPanel.classList.remove(startClass);
          oldPanel.classList.add(endClass);
          if (viewport) viewport.style.height = newPanel.scrollHeight + 'px';
        });
      });

      var finished = false;
      function cleanup() {
        if (finished) return;
        finished = true;
        oldPanel.classList.remove('is-animating', endClass);
        oldPanel.style.transform = '';
        newPanel.classList.remove('is-animating');
        newPanel.classList.add('is-active');
        newPanel.style.transform = '';
        viewport.style.height = '';
        isAnimating = false;
        newPanel.removeEventListener('transitionend', onTransitionEnd);
      }
      function onTransitionEnd(e) {
        if (e.target !== newPanel || e.propertyName !== 'transform') return;
        cleanup();
      }
      newPanel.addEventListener('transitionend', onTransitionEnd);
      // Fallback in case transitionend never fires (interrupted animation, etc.)
      setTimeout(cleanup, 450);
    }

    function showPanelInstant(id) {
      forceReset();
      track.querySelectorAll('.mobile-nav-panel').forEach(function (p) {
        p.classList.remove('is-active');
      });
      var target = track.querySelector('[data-panel="' + id + '"]');
      if (target) target.classList.add('is-active');
    }

    track.addEventListener('click', function (e) {
      var openBtn = e.target.closest('[data-open-panel]');
      if (openBtn) {
        goToPanel(openBtn.getAttribute('data-open-panel'), 'forward');
        return;
      }
      var backBtn = e.target.closest('[data-back-panel]');
      if (backBtn) {
        var panel = backBtn.closest('.mobile-nav-panel');
        var parentId = (panel && panel.getAttribute('data-parent-panel')) || 'root';
        goToPanel(parentId, 'back');
      }
    });

    // Always start at the top level whenever the mobile menu is opened.
    document.querySelectorAll('[data-drawer-open="mobile-menu"]').forEach(function (btn) {
      btn.addEventListener('click', function () { showPanelInstant('root'); });
    });
  })();

  /* ---------- Announcement bar slider ---------- */
  document.querySelectorAll('[data-announcement-slider]').forEach(function (slider) {
    var track = slider.querySelector('[data-announcement-track]');
    if (!track) return;
    var slides = track.querySelectorAll('[data-announcement-slide]');
    if (slides.length === 0) return;

    var current = 0;
    slides[0].classList.add('is-active');

    if (slides.length > 1) {
      var speed = parseFloat(slider.getAttribute('data-autoplay-speed')) || 5;
      setInterval(function () {
        slides[current].classList.remove('is-active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('is-active');
      }, speed * 1000);
    }
  });

  /* ---------- Countdown timers (announcement bar) ---------- */
  function updateCountdowns() {
    document.querySelectorAll('[data-countdown-timer]').forEach(function (el) {
      var endStr = el.getAttribute('data-countdown-end');
      if (!endStr || el.dataset.expiredShown === 'true') return;

      var end = new Date(endStr).getTime();
      if (isNaN(end)) return;

      var diff = end - Date.now();

      if (diff <= 0) {
        var expiredText = el.getAttribute('data-countdown-expired-text') || '';
        if (expiredText) {
          el.textContent = expiredText;
          el.dataset.expiredShown = 'true';
        }
        return;
      }

      var days = Math.floor(diff / (1000 * 60 * 60 * 24));
      var hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      var mins = Math.floor((diff / (1000 * 60)) % 60);
      var secs = Math.floor((diff / 1000) % 60);

      var daysEl = el.querySelector('[data-cd-days]');
      var hoursEl = el.querySelector('[data-cd-hours]');
      var minsEl = el.querySelector('[data-cd-mins]');
      var secsEl = el.querySelector('[data-cd-secs]');
      if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');
    });
  }
  if (document.querySelector('[data-countdown-timer]')) {
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
  }

  /* ---------- Nav popups: simple dropdown + mega menu, unified.
     Both use the same hover-intent grace period (so a gap between the
     link and the panel doesn't close it early), the same edge-clamped
     left-aligned positioning (so neither ever overflows the header or
     lands in the wrong spot), and only one can ever be open at a time
     (opening one always closes any other that's open). ---------- */
  (function initNavPopups() {
    var container = document.querySelector('.header-outer');
    var items = document.querySelectorAll('.main-nav li.has-dropdown, .main-nav li.has-mega-menu');
    var closeTimers = new WeakMap();

    function closeAllExcept(exceptLi) {
      items.forEach(function (li) {
        if (li === exceptLi) return;
        li.classList.remove('mega-open', 'dropdown-open');
      });
    }

    items.forEach(function (li) {
      var panel = li.querySelector('.mega-menu, .dropdown');
      var isMega = li.classList.contains('has-mega-menu');
      var openClass = isMega ? 'mega-open' : 'dropdown-open';

     function positionPanel() {

    if (!panel) return;

    // Dropdown
    if (!isMega) {
        panel.style.left = '0px';
        return;
    }

    // Mega Menu
    var containerRect = container.getBoundingClientRect();
    var liRect = li.getBoundingClientRect();
    var panelWidth = panel.offsetWidth;

    var left = liRect.left - containerRect.left;
    var maxLeft = containerRect.width - panelWidth;

    if (left > maxLeft) left = Math.max(0, maxLeft);
    if (left < 0) left = 0;

    panel.style.left = left + 'px';
}

      function open() {
        clearTimeout(closeTimers.get(li));
        closeAllExcept(li);
        li.classList.add(openClass);
        positionPanel();
      }
      function scheduleClose() {
        var t = setTimeout(function () {
          li.classList.remove(openClass);
        }, 250);
        closeTimers.set(li, t);
      }

      li.addEventListener('mouseenter', open);
      li.addEventListener('mouseleave', scheduleClose);
      if (panel) {
        panel.addEventListener('mouseenter', open);
        panel.addEventListener('mouseleave', scheduleClose);
      }
      window.addEventListener('resize', function () {
        if (li.classList.contains(openClass)) positionPanel();
      });
    });
  })();

  /* ---------- Product image thumbnails ---------- */
  document.querySelectorAll('.product-thumb').forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      var src = thumb.getAttribute('data-thumb-src');
      var mainImg = document.getElementById('ProductMainImage');
      if (mainImg && src) mainImg.src = src;
    });
  });

  /* =========================================================
     PRODUCT VARIANT SELECTION (buttons or dropdown)
     Keeps hidden variant id, price, availability and the main
     product image in sync with whatever options are selected.
     ========================================================= */
  function initVariantPicker(form, opts) {
    opts = opts || {};
    var variantsScript = form.closest('.product-info') ? form.closest('.product-info').querySelector('script[data-product-variants]') : null;
    if (!variantsScript) return;

    var variants;
    try {
      variants = JSON.parse(variantsScript.textContent);
    } catch (err) {
      console.error('Could not parse product variants JSON', err);
      return;
    }

    var idInput = form.querySelector('[data-variant-id]');
    var addToCartBtn = form.querySelector('[data-add-to-cart-btn]');
    var addToCartText = form.querySelector('[data-add-to-cart-text]');
    var unavailableMsg = form.querySelector('[data-variant-unavailable]');
    var priceCurrent = document.querySelector('[data-price-current]');
    var priceCompare = document.querySelector('[data-price-compare]');
    var mainImage = document.getElementById('ProductMainImage');

    var optionEls = form.querySelectorAll('[data-option-index]');
    if (optionEls.length === 0) {
      // No options to pick (single/default variant) — nothing more to wire up.
      return;
    }

    function currentSelections() {
      var selections = [];
      optionEls.forEach(function (el) {
        var index = parseInt(el.getAttribute('data-option-index'), 10);
        var value;
        if (el.tagName === 'SELECT') {
          value = el.value;
        } else {
          var checkedRadio = el.querySelector('input[type="radio"]:checked');
          if (checkedRadio) {
            value = checkedRadio.getAttribute('data-value');
          } else {
            var selectedBtn = el.querySelector('.option-value.selected');
            value = selectedBtn ? selectedBtn.getAttribute('data-value') : null;
          }
        }
        selections[index] = value;
      });
      return selections;
    }

    function findMatchingVariant(selections) {
      for (var i = 0; i < variants.length; i++) {
        var v = variants[i];
        var options = [v.option1, v.option2, v.option3];
        var isMatch = true;
        for (var j = 0; j < selections.length; j++) {
          if (selections[j] != null && options[j] !== selections[j]) {
            isMatch = false;
            break;
          }
        }
        if (isMatch) return v;
      }
      return null;
    }

    function formatMoney(cents) {
      var format = window.themeMoneyFormat || '${{amount}}';
      var value = (cents / 100);

      function withCommas(numStr) {
        var parts = numStr.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
      }

      var amount = withCommas(value.toFixed(2));
      var amountNoDecimals = withCommas(Math.round(value).toString());

      return format
        .replace(/\{\{\s*amount\s*\}\}/g, amount)
        .replace(/\{\{\s*amount_no_decimals\s*\}\}/g, amountNoDecimals)
        .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/g, amount.replace(',', 'X').replace('.', ',').replace('X', '.'));
    }

    function updateUI(variant) {
      if (!idInput) return;

      if (!variant) {
        if (addToCartBtn) addToCartBtn.disabled = true;
        if (addToCartText) addToCartText.textContent = 'Unavailable';
        if (unavailableMsg) unavailableMsg.hidden = false;
        return;
      }

      idInput.value = variant.id;
      if (unavailableMsg) unavailableMsg.hidden = true;

      if (addToCartBtn) addToCartBtn.disabled = !variant.available;
      if (addToCartText) addToCartText.textContent = variant.available ? 'Add to cart' : 'Sold out';

      if (priceCurrent) priceCurrent.textContent = formatMoney(variant.price);
      if (priceCompare) {
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          priceCompare.textContent = formatMoney(variant.compare_at_price);
          priceCompare.hidden = false;
        } else {
          priceCompare.hidden = true;
        }
      }

      if (typeof opts.onVariantChange === 'function') {
        opts.onVariantChange(variant);
      } else if (mainImage && variant.featured_image && variant.featured_image.src) {
        var base = variant.featured_image.src.split('?')[0];
        mainImage.src = base + '?width=1200';
      }
    }

    function handleSelectionChange() {
      var selections = currentSelections();
      var variant = findMatchingVariant(selections);
      updateUI(variant);
    }

    optionEls.forEach(function (el) {
      if (el.tagName === 'SELECT') {
        el.addEventListener('change', handleSelectionChange);
      } else if (el.classList.contains('option-cards')) {
        el.addEventListener('change', function (e) {
          if (e.target.type !== 'radio') return;
          el.querySelectorAll('.option-card').forEach(function (card) { card.classList.remove('is-selected'); });
          var checkedCard = e.target.closest('.option-card');
          if (checkedCard) checkedCard.classList.add('is-selected');
          handleSelectionChange();
        });
      } else {
        el.addEventListener('click', function (e) {
          if (!e.target.classList.contains('option-value')) return;
          el.querySelectorAll('.option-value').forEach(function (b) { b.classList.remove('selected'); });
          e.target.classList.add('selected');
          handleSelectionChange();
        });
      }
    });
  }

  document.querySelectorAll('.product-form').forEach(function (form) { initVariantPicker(form); });
  window.initThemeVariantPicker = initVariantPicker;

  /* =========================================================
     WISHLIST & COMPARE (localStorage-based, no app required)
     ========================================================= */
  (function initWishlistCompare() {
    var WISHLIST_KEY = 'aurora_wishlist';
    var COMPARE_KEY = 'aurora_compare';
    var COMPARE_MAX = window.themeCompareMax || 4;

    function readList(key) {
      try {
        var raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }
    function writeList(key, list) {
      try {
        localStorage.setItem(key, JSON.stringify(list));
      } catch (e) { /* storage unavailable (private browsing, etc) — fail silently */ }
    }

    function updateCounts() {
      var wishlist = readList(WISHLIST_KEY);
      var compare = readList(COMPARE_KEY);
      document.querySelectorAll('[data-wishlist-count]').forEach(function (el) {
        el.textContent = wishlist.length;
        el.hidden = wishlist.length === 0;
      });
      document.querySelectorAll('[data-compare-count]').forEach(function (el) {
        el.textContent = compare.length;
        el.hidden = compare.length === 0;
      });
    }

    function syncButtonStates() {
      var wishlist = readList(WISHLIST_KEY);
      var compare = readList(COMPARE_KEY);
      document.querySelectorAll('[data-wishlist-toggle]').forEach(function (btn) {
        var id = btn.getAttribute('data-product-id');
        var active = wishlist.some(function (p) { return String(p.id) === String(id); });
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      document.querySelectorAll('[data-compare-toggle]').forEach(function (btn) {
        var id = btn.getAttribute('data-product-id');
        var active = compare.some(function (p) { return String(p.id) === String(id); });
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
    }

    function productFromButton(btn) {
      return {
        id: btn.getAttribute('data-product-id'),
        handle: btn.getAttribute('data-product-handle'),
        title: btn.getAttribute('data-product-title'),
        price: btn.getAttribute('data-product-price'),
        image: btn.getAttribute('data-product-image'),
        url: btn.getAttribute('data-product-url'),
        vendor: btn.getAttribute('data-product-vendor') || ''
      };
    }

    function formatMoneyCents(cents) {
      var format = window.themeMoneyFormat || '${{amount}}';
      var value = cents / 100;
      function withCommas(numStr) {
        var parts = numStr.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
      }
      return format.replace(/\{\{\s*amount\s*\}\}/g, withCommas(value.toFixed(2)));
    }

    function renderWishlistPage() {
      var grid = document.querySelector('[data-wishlist-grid]');
      if (!grid) return;
      var list = readList(WISHLIST_KEY);
      var emptyMsg = document.querySelector('[data-wishlist-empty]');
      if (list.length === 0) {
        grid.innerHTML = '';
        if (emptyMsg) emptyMsg.hidden = false;
        return;
      }
      if (emptyMsg) emptyMsg.hidden = true;
      grid.innerHTML = list.map(function (p) {
        return '<div class="product-card">' +
            '<div class="product-card-media-wrap">' +
              '<a href="' + p.url + '" class="product-card-media">' +
                (p.image ? '<img src="' + p.image + '" alt="" class="product-card-image" loading="lazy">' : '') +
              '</a>' +
              '<button type="button" class="card-icon-btn is-active" data-remove-wishlist-item="' + p.id + '" aria-label="Remove from wishlist">&times;</button>' +
            '</div>' +
            '<a href="' + p.url + '" class="product-card-title">' + p.title + '</a>' +
            '<div class="product-card-price"><span class="price-current">' + formatMoneyCents(p.price) + '</span></div>' +
          '</div>';
      }).join('');
    }

    function renderComparePage() {
      var wrap = document.querySelector('[data-compare-table-wrap]');
      if (!wrap) return;
      var list = readList(COMPARE_KEY);
      var emptyMsg = document.querySelector('[data-compare-empty]');
      if (list.length === 0) {
        wrap.innerHTML = '';
        if (emptyMsg) emptyMsg.hidden = false;
        return;
      }
      if (emptyMsg) emptyMsg.hidden = true;

      var html = '<table class="compare-table"><thead><tr><th></th>';
      list.forEach(function (p) {
        html += '<th><button type="button" class="compare-remove" data-remove-compare-item="' + p.id + '" aria-label="Remove">&times;</button>' +
          (p.image ? '<img src="' + p.image + '" alt="">' : '') +
          '<div class="compare-product-title">' + p.title + '</div></th>';
      });
      html += '</tr></thead><tbody>';

      html += '<tr><td>Price</td>';
      list.forEach(function (p) { html += '<td>' + formatMoneyCents(p.price) + '</td>'; });
      html += '</tr>';

      html += '<tr><td>Vendor</td>';
      list.forEach(function (p) { html += '<td>' + (p.vendor || '\u2014') + '</td>'; });
      html += '</tr>';

      html += '<tr><td></td>';
      list.forEach(function (p) { html += '<td><a class="btn btn-primary" href="' + p.url + '">View product</a></td>'; });
      html += '</tr>';

      html += '</tbody></table>';
      wrap.innerHTML = html;
    }

    document.addEventListener('click', function (e) {
      var wishBtn = e.target.closest('[data-wishlist-toggle]');
      if (wishBtn) {
        e.preventDefault();
        var list = readList(WISHLIST_KEY);
        var product = productFromButton(wishBtn);
        var idx = list.findIndex(function (p) { return String(p.id) === String(product.id); });
        if (idx > -1) { list.splice(idx, 1); } else { list.push(product); }
        writeList(WISHLIST_KEY, list);
        updateCounts();
        syncButtonStates();
        return;
      }

      var compareBtn = e.target.closest('[data-compare-toggle]');
      if (compareBtn) {
        e.preventDefault();
        var clist = readList(COMPARE_KEY);
        var cproduct = productFromButton(compareBtn);
        var cidx = clist.findIndex(function (p) { return String(p.id) === String(cproduct.id); });
        if (cidx > -1) {
          clist.splice(cidx, 1);
        } else {
          if (clist.length >= COMPARE_MAX) {
            alert('You can compare up to ' + COMPARE_MAX + ' products at a time. Remove one first.');
            return;
          }
          clist.push(cproduct);
        }
        writeList(COMPARE_KEY, clist);
        updateCounts();
        syncButtonStates();
        return;
      }

      var removeWish = e.target.closest('[data-remove-wishlist-item]');
      if (removeWish) {
        var rid = removeWish.getAttribute('data-remove-wishlist-item');
        writeList(WISHLIST_KEY, readList(WISHLIST_KEY).filter(function (p) { return String(p.id) !== String(rid); }));
        updateCounts();
        renderWishlistPage();
        return;
      }

      var removeCompare = e.target.closest('[data-remove-compare-item]');
      if (removeCompare) {
        var crid = removeCompare.getAttribute('data-remove-compare-item');
        writeList(COMPARE_KEY, readList(COMPARE_KEY).filter(function (p) { return String(p.id) !== String(crid); }));
        updateCounts();
        renderComparePage();
        return;
      }
    });

    updateCounts();
    syncButtonStates();
    renderWishlistPage();
    renderComparePage();

    /* Exposed so AJAX-refreshed content (e.g. collection filters) can
       re-sync the pressed/active state of any newly-injected buttons. */
    window.themeSyncWishlistCompare = function () {
      updateCounts();
      syncButtonStates();
    };
  })();

  /* =========================================================
     QUICK VIEW — fetches product JSON via Shopify's AJAX API
     and reuses the same variant-picker + add-to-cart logic
     ========================================================= */
  (function initQuickView() {
    var modal = document.getElementById('quick-view-modal');
    if (!modal) return;
    var bodyEl = modal.querySelector('[data-quick-view-body]');

    function formatMoney(cents) {
      var format = window.themeMoneyFormat || '${{amount}}';
      var value = cents / 100;
      function withCommas(numStr) {
        var parts = numStr.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
      }
      return format.replace(/\{\{\s*amount\s*\}\}/g, withCommas(value.toFixed(2)));
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.textContent = str == null ? '' : String(str);
      return div.innerHTML;
    }

    function initQuickViewSlider(scope, slideCount) {
  var slider = scope.querySelector('[data-qv-slider]');
  var track = scope.querySelector('[data-qv-track]');
  if (!slider || !track || slideCount <= 1) return;

  var current = 0;
  var dots = slider.querySelectorAll('[data-qv-dot]');

  function update() {
    track.style.transform = 'translateX(' + (-current * 100) + '%)';
    dots.forEach(function (d, i) { d.classList.toggle('is-active', i === current); });
  }

  var prevBtn = slider.querySelector('[data-qv-prev]');
  var nextBtn = slider.querySelector('[data-qv-next]');
  if (prevBtn) prevBtn.addEventListener('click', function () {
    current = (current - 1 + slideCount) % slideCount;
    update();
  });
  if (nextBtn) nextBtn.addEventListener('click', function () {
    current = (current + 1) % slideCount;
    update();
  });
  dots.forEach(function (d, i) {
    d.addEventListener('click', function () { current = i; update(); });
  });
}

function renderProduct(product) {
  var variant = product.variants[0];
  var optionsHtml = '';

  // NOTE: the /products/{handle}.js AJAX endpoint does NOT include
  // `has_only_default_variant` or `options_with_values` (those only
  // exist on the Liquid `product` object). Use `variants`/`options` instead.
  if (product.variants.length > 1) {
    product.options.forEach(function (option, index) {
      var isColor = /colou?r/i.test(option.name);
      optionsHtml += '<div class="product-option" data-option-index="' + index + '">';
      optionsHtml += '<label>' + escapeHtml(option.name) + '</label>';
      optionsHtml += '<div class="option-values' + (isColor ? ' option-values-swatches' : '') + '" data-option-index="' + index + '">';
      option.values.forEach(function (value, vi) {
        if (isColor) {
          var config = (window.themeColorSwatches || {})[value];
          var styleAttr = '';
          var isTextFallback = false;
          if (config && config.type === 'image' && config.image) {
            styleAttr = 'background-image:url(' + config.image + ')';
          } else if (config && config.color) {
            styleAttr = 'background:' + config.color;
          } else {
            var matchVariant = null;
            for (var mvi = 0; mvi < product.variants.length; mvi++) {
              var mv = product.variants[mvi];
              if (mv.option1 === value || mv.option2 === value || mv.option3 === value) { matchVariant = mv; break; }
            }
            if (matchVariant && matchVariant.featured_image && matchVariant.featured_image.src) {
              styleAttr = 'background-image:url(' + matchVariant.featured_image.src.split('?')[0] + '?width=100)';
            } else {
              isTextFallback = true;
            }
          }
          optionsHtml += '<button type="button" class="option-value qv-swatch' + (isTextFallback ? ' swatch-text-fallback' : '') + (vi === 0 ? ' selected' : '') + '" data-value="' + escapeHtml(value) + '" title="' + escapeHtml(value) + '"' + (styleAttr ? ' style="' + styleAttr + '"' : '') + '>' + (isTextFallback ? escapeHtml(value) : '') + '</button>';
        } else {
          optionsHtml += '<button type="button" class="option-value' + (vi === 0 ? ' selected' : '') + '" data-value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</button>';
        }
      });
      optionsHtml += '</div></div>';
    });
  }

  var images = (product.images && product.images.length ? product.images : (product.featured_image ? [product.featured_image] : []));

  var slidesHtml = images.map(function (src) {
    var base = src.split('?')[0];
    return '<div class="qv-slide"><img src="' + base + '?width=700" alt="' + escapeHtml(product.title) + '" loading="lazy"></div>';
  }).join('');

  var dotsHtml = images.length > 1
    ? '<div class="qv-slider-dots">' + images.map(function (_, i) {
        return '<button type="button" class="qv-dot' + (i === 0 ? ' is-active' : '') + '" data-qv-dot="' + i + '" aria-label="Image ' + (i + 1) + '"></button>';
      }).join('') + '</div>'
    : '';

  var arrowsHtml = images.length > 1
    ? '<button type="button" class="qv-slider-arrow qv-slider-prev" data-qv-prev aria-label="Previous image">&#8249;</button>' +
      '<button type="button" class="qv-slider-arrow qv-slider-next" data-qv-next aria-label="Next image">&#8250;</button>'
    : '';

  var html =
    '<div class="quick-view-layout">' +
      '<div class="quick-view-media" data-qv-slider>' +
        '<div class="qv-slider-track" data-qv-track>' + slidesHtml + '</div>' +
        arrowsHtml +
        dotsHtml +
      '</div>' +
      '<div class="quick-view-info product-info">' +
        '<h2 class="quick-view-title">' + escapeHtml(product.title) + '</h2>' +
        '<div class="product-price" data-product-price>' +
          '<span class="price-current" data-price-current>' + formatMoney(variant.price) + '</span>' +
        '</div>' +
        '<form class="product-form" data-product-form>' +
          '<input type="hidden" name="id" value="' + variant.id + '" data-variant-id>' +
          optionsHtml +
          '<div class="product-quantity"><label>Quantity</label><input type="number" name="quantity" value="1" min="1"></div>' +
          '<p class="product-variant-unavailable" data-variant-unavailable hidden>This combination is currently unavailable.</p>' +
          '<button type="submit" class="btn btn-primary btn-add-to-cart" data-add-to-cart-btn' + (variant.available ? '' : ' disabled') + '>' +
            '<span data-add-to-cart-text>' + (variant.available ? 'Add to cart' : 'Sold out') + '</span>' +
          '</button>' +
        '</form>' +
        '<a href="' + product.url + '" class="quick-view-full-link">View full details</a>' +
        '<script type="application/json" data-product-variants>' + JSON.stringify(product.variants).replace(/</g, '\\u003c') + '</script>' +
      '</div>' +
    '</div>';

  bodyEl.innerHTML = html;

  initQuickViewSlider(bodyEl, images.length);

  var form = bodyEl.querySelector('.product-form');
  if (form && typeof window.initThemeVariantPicker === 'function') {
    window.initThemeVariantPicker(form, {
      onVariantChange: function (variant) {
        if (!variant || !variant.featured_image || !variant.featured_image.src) return;
        var media = bodyEl.querySelector('[data-qv-slider]');
        if (!media) return;
        var targetSrc = variant.featured_image.src.split('?')[0];
        var imgs = media.querySelectorAll('.qv-slide img');
        for (var i = 0; i < imgs.length; i++) {
          if (imgs[i].getAttribute('src').split('?')[0] === targetSrc) {
            var dots = media.querySelectorAll('[data-qv-dot]');
            if (dots[i]) { dots[i].click(); }
            break;
          }
        }
      }
    });
  }
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = form.querySelector('[data-add-to-cart-btn]');
      if (submitBtn) submitBtn.disabled = true;
      fetch('/cart/add.js', {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.status) throw new Error(data.description || 'Could not add to cart');
          modal.removeAttribute('data-open');
          document.body.style.overflow = '';
          document.dispatchEvent(new CustomEvent('theme:cart:changed'));
          var cartDrawer = document.getElementById('cart-drawer');
          if (cartDrawer) cartDrawer.setAttribute('data-open', 'true');
          updateCartCount();
          refreshCartDrawer();
        })
        .catch(function () {
          alert('Sorry, this item could not be added to your cart.');
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }
}


    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-quick-view]');
      if (!btn) return;
      var handle = btn.getAttribute('data-product-handle');
      if (!handle || !bodyEl) return;
      bodyEl.innerHTML = '<div class="quick-view-loading" data-quick-view-loading>Loading...</div>';
      fetch('/products/' + handle + '.js')
        .then(function (res) { return res.json(); })
        .then(renderProduct)
        .catch(function () {
          bodyEl.innerHTML = '<p>Sorry, this product could not be loaded.</p>';
        });
    });
  })();

  /* =========================================================
     CART ITEM LINE CONTROLS: quantity stepper + remove
     ========================================================= */
  function changeLineQuantity(lineKey, quantity) {
    return fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: lineKey, quantity: quantity })
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        updateCartCount();
        refreshCartDrawer();
      })
      .catch(function (err) { console.error('Cart line update failed', err); });
  }

  function bindCartLineControls(scope) {
    (scope || document).querySelectorAll('.cart-drawer-item').forEach(function (row) {
      var lineKey = row.getAttribute('data-line-key');
      if (!lineKey) return;

      var decreaseBtn = row.querySelector('[data-qty-decrease]');
      var increaseBtn = row.querySelector('[data-qty-increase]');
      var qtyValueEl = row.querySelector('[data-qty-value]');
      var removeBtn = row.querySelector('[data-remove-line]');

      if (decreaseBtn && qtyValueEl) {
        decreaseBtn.addEventListener('click', function () {
          var current = parseInt(qtyValueEl.textContent, 10) || 1;
          var next = current - 1;
          if (next <= 0) {
            changeLineQuantity(lineKey, 0);
          } else {
            changeLineQuantity(lineKey, next);
          }
        });
      }
      if (increaseBtn && qtyValueEl) {
        increaseBtn.addEventListener('click', function () {
          var current = parseInt(qtyValueEl.textContent, 10) || 1;
          changeLineQuantity(lineKey, current + 1);
        });
      }
      if (removeBtn) {
        removeBtn.addEventListener('click', function () {
          changeLineQuantity(lineKey, 0);
        });
      }
    });
  }
  bindCartLineControls(document);

  /* =========================================================
     CART DRAWER: refresh via Section Rendering API
     ========================================================= */
  function refreshCartDrawer(callback) {
    fetch(window.location.pathname + '?section_id=cart-drawer')
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var newDrawer = doc.getElementById('cart-drawer');
        var oldDrawer = document.getElementById('cart-drawer');
        if (newDrawer && oldDrawer) {
          var wasOpen = oldDrawer.getAttribute('data-open');
          oldDrawer.replaceWith(newDrawer);
          if (wasOpen) newDrawer.setAttribute('data-open', wasOpen);
          bindDrawerCloseButtons(newDrawer);
          bindAddonToggles(newDrawer);
          bindDiscountForm(newDrawer);
          bindCartLineControls(newDrawer);
        }
        if (typeof callback === 'function') callback();
      })
      .catch(function (err) { console.error('Cart drawer refresh failed', err); });
  }

  function updateCartCount() {
    fetch('/cart.js')
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        var countEl = document.querySelector('[data-cart-count]');
        if (countEl) countEl.textContent = cart.item_count;
        cleanupOrphanedGift(cart);
      });
  }

  /* If the cart no longer contains any real (non-gift) items, remove the
     free gift too — a gift shouldn't sit alone in an otherwise empty cart. */
  function cleanupOrphanedGift(cart) {
    var drawer = document.getElementById('cart-drawer');
    if (!drawer || drawer.getAttribute('data-gift-enabled') !== 'true') return;
    var giftVariantId = drawer.getAttribute('data-gift-variant-id');
    if (!giftVariantId) return;

    var giftItem = findCartItemByVariant(cart, giftVariantId);
    if (!giftItem || !giftItem.properties || !giftItem.properties._gift) return;

    var nonGiftCount = cart.items.reduce(function (sum, item) {
      var isGift = item.properties && item.properties._gift;
      return sum + (isGift ? 0 : item.quantity);
    }, 0);

    if (nonGiftCount === 0) {
      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: giftItem.key, quantity: 0 })
      })
        .then(function () { refreshCartDrawer(); })
        .catch(function (err) { console.error('Could not remove orphaned gift', err); });
    }
  }

  /* =========================================================
     CART ADD-ONS: toggle switches (protection products)
     ========================================================= */
  function findCartItemByVariant(cart, variantId) {
    var idNum = parseInt(variantId, 10);
    for (var i = 0; i < cart.items.length; i++) {
      if (cart.items[i].variant_id === idNum) return cart.items[i];
    }
    return null;
  }

  function addonToggleOn(variantId, toggleEl) {
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: 1 })
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        updateCartCount();
        refreshCartDrawer();
      })
      .catch(function (err) {
        console.error('Could not add add-on', err);
        if (toggleEl) toggleEl.checked = false;
      });
  }

  function addonToggleOff(variantId, toggleEl) {
    fetch('/cart.js')
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        var item = findCartItemByVariant(cart, variantId);
        if (!item) return;
        return fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.key, quantity: 0 })
        });
      })
      .then(function () {
        updateCartCount();
        refreshCartDrawer();
      })
      .catch(function (err) {
        console.error('Could not remove add-on', err);
        if (toggleEl) toggleEl.checked = true;
      });
  }

  function bindAddonToggles(scope) {
    (scope || document).querySelectorAll('.cart-addon-toggle').forEach(function (toggle) {
      toggle.addEventListener('change', function () {
        var variantId = toggle.getAttribute('data-variant-id');
        if (!variantId) return;
        if (toggle.checked) {
          addonToggleOn(variantId, toggle);
        } else {
          addonToggleOff(variantId, toggle);
        }
      });
    });
  }
  bindAddonToggles(document);

  /* Auto-add add-ons marked "enabled by default" if not already in the cart */
  (function initDefaultAddons() {
    var defaultToggles = document.querySelectorAll('.cart-addon-toggle[data-default-on="true"]');
    if (defaultToggles.length === 0) return;
    fetch('/cart.js')
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        var toAdd = [];
        defaultToggles.forEach(function (toggle) {
          var variantId = toggle.getAttribute('data-variant-id');
          if (!findCartItemByVariant(cart, variantId)) {
            toAdd.push(parseInt(variantId, 10));
          }
        });
        if (toAdd.length === 0) return;
        var items = toAdd.map(function (id) { return { id: id, quantity: 1 }; });
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: items })
        })
          .then(function () {
            updateCartCount();
            refreshCartDrawer();
          })
          .catch(function (err) { console.error('Could not auto-add default add-ons', err); });
      });
  })();

  /* =========================================================
     FREE GIFT WITH DISCOUNT CODE
     (Shopify's storefront has no AJAX endpoint to verify a discount
     code before checkout, so we: 1) do a simple text match against
     the merchant's configured code to decide whether to add the free
     gift right away, and 2) store whatever code the customer typed as
     a cart attribute, which the Checkout button reads and appends to
     the checkout URL so Shopify actually applies/validates it there.)
     ========================================================= */
  function bindDiscountForm(scope) {
    var root = scope || document;
    var applyBtn = root.querySelector('[data-apply-discount]');
    var drawer = document.getElementById('cart-drawer');
    if (!applyBtn || !drawer) return;
    if (drawer.getAttribute('data-gift-enabled') !== 'true') return;

    var giftVariantId = drawer.getAttribute('data-gift-variant-id');
    var giftCode = (drawer.getAttribute('data-gift-code') || '').trim().toLowerCase();

    applyBtn.addEventListener('click', function () {
      var input = root.querySelector('#CartDiscountCode');
      var message = root.querySelector('#CartDiscountMessage');
      var code = input ? input.value.trim() : '';
      if (!code) return;

      applyBtn.disabled = true;

      /* Always store the typed code as a cart attribute so it carries
         through to checkout, regardless of whether it matches the gift code. */
      fetch('/cart/update.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes: { pending_discount_code: code } })
      })
        .then(function (res) { return res.json(); })
        .then(function (cart) {
          var matches = giftCode && code.toLowerCase() === giftCode;

          if (matches && giftVariantId) {
            var alreadyGifted = findCartItemByVariant(cart, giftVariantId);
            if (!alreadyGifted) {
              return fetch('/cart/add.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: parseInt(giftVariantId, 10), quantity: 1, properties: { _gift: 'true' } })
              }).then(function () {
                if (message) { message.hidden = false; message.textContent = 'Code accepted — your free gift has been added! It will be validated at checkout.'; }
              });
            } else {
              if (message) { message.hidden = false; message.textContent = 'Your free gift is already in your cart.'; }
            }
          } else if (message) {
            message.hidden = false;
            message.textContent = "Code saved — it'll be applied at checkout.";
          }
        })
        .then(function () {
          updateCartCount();
          refreshCartDrawer();
        })
        .catch(function (err) {
          console.error('Discount apply failed', err);
          var message = root.querySelector('#CartDiscountMessage');
          if (message) { message.hidden = false; message.textContent = "Something went wrong, please try again."; }
        })
        .then(function () {
          applyBtn.disabled = false;
        });
    });
  }
  bindDiscountForm(document);

  /* ---------- Add to cart via AJAX (updates drawer + count without reload) ---------- */
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[action^="/cart/add"]');
    if (!form) return;
    if (document.body.classList.contains('cart-type-page')) return; // let it submit normally
    e.preventDefault();
    var submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    var formData = new FormData(form);
    fetch('/cart/add.js', { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.status) throw new Error(data.description || 'Could not add to cart');
        updateCartCount();
        var drawer = document.getElementById('cart-drawer');
        if (drawer) drawer.setAttribute('data-open', 'true');
        refreshCartDrawer();
      })
      .catch(function (err) {
        console.error('Add to cart failed', err);
        alert('Sorry, this item could not be added to your cart.');
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
  });

});


/* =========================================================
   PRODUCT CARD: image slider + color swatches + add to cart / buy now
   Everything here is event-delegated on `document`, and reads all state
   straight off data-attributes in the DOM — so it needs no re-binding
   when new cards are injected via AJAX (e.g. after applying a filter).
   ========================================================= */
(function initProductCards() {
  var swatchMap = window.themeColorSwatches || {};

  function formatMoneyCents(cents) {
    var format = window.themeMoneyFormat || '${{amount}}';
    var value = cents / 100;
    function withCommas(numStr) {
      var parts = numStr.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }
    return format.replace(/\{\{\s*amount\s*\}\}/g, withCommas(value.toFixed(2)));
  }

  /* ---- Swatch coloring (reads shop's configured color/image per value) ----
     Fallback chain: configured swatch (color/image) -> this color's own
     variant image -> plain text label of the color name (never a blank circle). */
  function applySwatchStyles(scope) {
    (scope || document).querySelectorAll('[data-card-swatch], [data-facet-swatch]').forEach(function (btn) {
      var value = btn.getAttribute('data-value') || btn.getAttribute('data-swatch-value');
      var config = swatchMap[value];
      var variantImage = btn.getAttribute('data-variant-image');

      btn.style.backgroundImage = '';
      btn.style.background = '';
      btn.classList.remove('swatch-text-fallback');
      btn.textContent = '';

      if (config && config.type === 'image' && config.image) {
        btn.style.backgroundImage = 'url(' + config.image + ')';
      } else if (config && config.color) {
        btn.style.background = config.color;
      } else if (variantImage) {
        btn.style.backgroundImage = 'url(' + variantImage + ')';
      } else {
        btn.classList.add('swatch-text-fallback');
        btn.textContent = value;
      }
    });
  }
  applySwatchStyles(document);
  // Exposed so the AJAX collection-filters script can re-style swatches
  // on any newly-injected product cards.
  window.themeApplyCardSwatchStyles = applySwatchStyles;

  /* ---- Slider helpers ---- */
  function getVisibleSlides(card) {
    return Array.prototype.filter.call(card.querySelectorAll('[data-slide]'), function (s) {
      return s.style.display !== 'none';
    });
  }

  function rebuildDots(card) {
    var dotsWrap = card.querySelector('[data-slider-dots]');
    if (!dotsWrap) return;
    var visible = getVisibleSlides(card);
    dotsWrap.innerHTML = '';
    if (visible.length <= 1) return;
    visible.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('data-slider-dot', '');
      dot.setAttribute('data-index', i);
      dot.setAttribute('aria-label', 'Image ' + (i + 1));
      dotsWrap.appendChild(dot);
    });
  }

  function goToSlide(card, index) {
    var visible = getVisibleSlides(card);
    if (!visible.length) return;
    index = ((index % visible.length) + visible.length) % visible.length;
    var track = card.querySelector('[data-slider-track]');
    if (track) {
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      track.setAttribute('data-current-index', index);
    }
    var dotsWrap = card.querySelector('[data-slider-dots]');
    if (dotsWrap) {
      dotsWrap.querySelectorAll('[data-slider-dot]').forEach(function (d, i) {
        d.classList.toggle('is-active', i === index);
      });
    }
  }

  // Show only the slides that belong to the chosen color (plus any
  // "generic" shots with no color tag). If a color has zero matching
  // slides, fall back to showing every image, but still try to jump to
  // that swatch's own assigned photo (targetImageUrl) if we can find it.
  function filterSlidesByColor(card, colorValueDown, targetImageUrl) {
    var slides = card.querySelectorAll('[data-slide]');
    if (!slides.length) return;
    var matchCount = 0;
    slides.forEach(function (s) {
      var colors = s.getAttribute('data-slide-colors') || '';
      if (colors.indexOf(colorValueDown + '|') > -1) matchCount++;
    });
    slides.forEach(function (s) {
      var colors = s.getAttribute('data-slide-colors');
      if (colors === null) { s.style.display = ''; return; } // no color data on this card at all
      var isMatch = colors.indexOf(colorValueDown + '|') > -1;
      var isGeneric = colors === '';
      var visible = matchCount === 0 ? true : (isMatch || isGeneric);
      s.style.display = visible ? '' : 'none';
    });
    rebuildDots(card);

    var targetIndex = 0;
    if (targetImageUrl) {
      var visibleSlides = getVisibleSlides(card);
      for (var i = 0; i < visibleSlides.length; i++) {
        var img = visibleSlides[i].querySelector('[data-slide-img]');
        if (img && img.getAttribute('src') && targetImageUrl.indexOf(img.getAttribute('src').split('?')[0]) > -1) {
          targetIndex = i;
          break;
        }
      }
    }
    goToSlide(card, targetIndex);
  }

  /* ---- Arrows / dots / swipe (delegated) ---- */
  document.addEventListener('click', function (e) {
    var next = e.target.closest('[data-slider-next]');
    var prev = e.target.closest('[data-slider-prev]');
    var dot = e.target.closest('[data-slider-dot]');
    if (!next && !prev && !dot) return;
    e.preventDefault();
    var card = e.target.closest('[data-product-card]');
    if (!card) return;
    var track = card.querySelector('[data-slider-track]');
    var current = parseInt(track && track.getAttribute('data-current-index'), 10) || 0;
    if (next) goToSlide(card, current + 1);
    else if (prev) goToSlide(card, current - 1);
    else if (dot) goToSlide(card, parseInt(dot.getAttribute('data-index'), 10) || 0);
  });

  var touchStartX = null;
  var touchCard = null;
  document.addEventListener('touchstart', function (e) {
    var slider = e.target.closest('[data-card-slider]');
    if (!slider) return;
    touchCard = slider.closest('[data-product-card]');
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (touchStartX === null || !touchCard) return;
    var deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 40) {
      var track = touchCard.querySelector('[data-slider-track]');
      var current = parseInt(track && track.getAttribute('data-current-index'), 10) || 0;
      goToSlide(touchCard, deltaX < 0 ? current + 1 : current - 1);
    }
    touchStartX = null;
    touchCard = null;
  }, { passive: true });

  /* ---- Swatch click: switch slide group, price, link, variant, buttons ---- */
  document.addEventListener('click', function (e) {
    var swatch = e.target.closest('[data-card-swatch]');
    if (!swatch) return;

    var group = swatch.closest('[data-card-swatches]');
    var card = swatch.closest('[data-product-card]');
    if (!group || !card) return;

    group.querySelectorAll('[data-card-swatch]').forEach(function (s) { s.classList.remove('is-selected'); });
    swatch.classList.add('is-selected');

    var valueDown = (swatch.getAttribute('data-value') || '').toLowerCase();
    var variantImage = swatch.getAttribute('data-variant-image');
    filterSlidesByColor(card, valueDown, variantImage);

    var url = swatch.getAttribute('data-variant-url');
    var price = swatch.getAttribute('data-variant-price');
    var comparePrice = swatch.getAttribute('data-variant-compare-price');
    var variantId = swatch.getAttribute('data-variant-id');
    var available = swatch.getAttribute('data-variant-available') === 'true';

    card.querySelectorAll('[data-card-link]').forEach(function (link) {
      if (url) link.setAttribute('href', url);
    });

    var priceCurrent = card.querySelector('[data-card-price-current]');
    var priceCompare = card.querySelector('[data-card-price-compare]');
    if (priceCurrent && price) priceCurrent.textContent = formatMoneyCents(parseInt(price, 10));
    if (priceCompare) {
      if (comparePrice && parseInt(comparePrice, 10) > parseInt(price, 10)) {
        priceCompare.textContent = formatMoneyCents(parseInt(comparePrice, 10));
        priceCompare.hidden = false;
      } else {
        priceCompare.hidden = true;
      }
    }

    var variantInput = card.querySelector('[data-card-variant-id]');
    if (variantInput && variantId) variantInput.value = variantId;

    var addBtn = card.querySelector('[data-card-add-btn]');
    var buyBtn = card.querySelector('[data-card-buy-now]');
    if (addBtn) {
      addBtn.disabled = !available;
      if (addBtn.getAttribute('data-needs-selection') !== 'true') {
        addBtn.textContent = available ? 'Add to cart' : 'Sold out';
      }
    }
    if (buyBtn) buyBtn.disabled = !available;
  });

  /* ---- Add to cart button: if the product needs a size/other option,
     open Quick view instead of submitting (card can't determine a variant) ---- */
  document.addEventListener('click', function (e) {
    var addBtn = e.target.closest('[data-card-add-btn]');
    if (!addBtn || addBtn.disabled) return;
    if (addBtn.getAttribute('data-needs-selection') !== 'true') return; // let the form submit normally
    e.preventDefault();
    var card = addBtn.closest('[data-product-card]');
    var qvTrigger = card && card.querySelector('[data-quick-view]');
    if (qvTrigger) {
      qvTrigger.click();
    } else if (card) {
      window.location.href = card.getAttribute('data-product-url');
    }
  });

  /* ---- Buy now button: AJAX add the current variant, then go to checkout ---- */
  document.addEventListener('click', function (e) {
    var buyBtn = e.target.closest('[data-card-buy-now]');
    if (!buyBtn || buyBtn.disabled) return;
    e.preventDefault();
    var card = buyBtn.closest('[data-product-card]');

    if (buyBtn.getAttribute('data-needs-selection') === 'true') {
      var qvTrigger = card && card.querySelector('[data-quick-view]');
      if (qvTrigger) {
        qvTrigger.click();
      } else if (card) {
        window.location.href = card.getAttribute('data-product-url');
      }
      return;
    }

    var form = buyBtn.closest('form');
    var variantInput = form && form.querySelector('[data-card-variant-id]');
    var variantId = variantInput ? variantInput.value : null;
    if (!variantId) return;

    buyBtn.disabled = true;
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: parseInt(variantId, 10), quantity: 1 })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.status) throw new Error(data.description || 'Could not add to cart');
        window.location.href = '/checkout';
      })
      .catch(function () {
        alert('Sorry, this item could not be added to your cart.');
        buyBtn.disabled = false;
      });
  });
})();

/* =========================================================
   COLLECTION FILTERS (facets) — fully AJAX via Shopify's
   Section Rendering API, no app / no full page reload.
   Only runs on pages that actually have a product grid container.
   ========================================================= */
(function initCollectionFilters() {
  if (!document.querySelector('[data-product-grid-container]')) return;

  function withSectionId(url) {
    var hasQuery = url.indexOf('?') > -1;
    return url + (hasQuery ? '&' : '?') + 'section_id=main-collection';
  }

  function fetchFacets(url, opts) {
    opts = opts || {};
    var gridContainer = document.querySelector('[data-product-grid-container]');
    if (gridContainer) gridContainer.classList.add('is-loading');

    fetch(withSectionId(url))
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');

        var newGrid = doc.querySelector('[data-product-grid-container]');
        var newFilters = doc.querySelector('[data-filters-panel]');
        var newCount = doc.querySelector('[data-result-count]');

        var oldGrid = document.querySelector('[data-product-grid-container]');
        var oldFilters = document.querySelector('[data-filters-panel]');
        var oldCount = document.querySelector('[data-result-count]');

        if (newGrid && oldGrid) oldGrid.replaceWith(newGrid);
        if (newFilters && oldFilters) oldFilters.replaceWith(newFilters);
        if (newCount && oldCount) oldCount.replaceWith(newCount);

        // Re-apply configured swatch colors/images and wishlist/compare
        // pressed-states to the freshly-injected cards.
        if (typeof window.themeApplyCardSwatchStyles === 'function') window.themeApplyCardSwatchStyles(document);
        if (typeof window.themeSyncWishlistCompare === 'function') window.themeSyncWishlistCompare();

        if (!opts.skipHistory) window.history.pushState({}, '', url);

        if (!opts.skipScroll) {
          var freshGrid = document.querySelector('[data-product-grid-container]');
          if (freshGrid) freshGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      })
      .catch(function (err) {
        console.error('Filter update failed', err);
        if (gridContainer) gridContainer.classList.remove('is-loading');
      });
  }

  function openMobileFilters(fromEl) {
    var sidebar = (fromEl && fromEl.closest('.collection-filters-sidebar')) || document.querySelector('.collection-filters-sidebar');
    if (!sidebar) return;
    sidebar.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileFilters() {
    var sidebar = document.querySelector('.collection-filters-sidebar[data-open="true"]');
    if (!sidebar) return;
    sidebar.removeAttribute('data-open');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-facet-link]');
    if (link) {
      e.preventDefault();
      fetchFacets(link.getAttribute('href'));
      return;
    }

    var swatch = e.target.closest('[data-facet-swatch]');
    if (swatch) {
      e.preventDefault();
      var swatchUrl = swatch.classList.contains('is-active')
        ? swatch.getAttribute('data-url-remove')
        : swatch.getAttribute('data-url-add');
      if (swatchUrl) fetchFacets(swatchUrl);
      return;
    }

    var priceApply = e.target.closest('[data-price-apply]');
    if (priceApply) {
      e.preventDefault();
      var wrap = priceApply.closest('[data-price-filter]');
      if (!wrap) return;
      var minInput = wrap.querySelector('[data-price-min]');
      var maxInput = wrap.querySelector('[data-price-max]');
      var paramMin = wrap.getAttribute('data-param-min');
      var paramMax = wrap.getAttribute('data-param-max');
      var urlObj = new URL(window.location.href);
      if (minInput && minInput.value) urlObj.searchParams.set(paramMin, Math.round(parseFloat(minInput.value) * 100));
      else if (paramMin) urlObj.searchParams.delete(paramMin);
      if (maxInput && maxInput.value) urlObj.searchParams.set(paramMax, Math.round(parseFloat(maxInput.value) * 100));
      else if (paramMax) urlObj.searchParams.delete(paramMax);
      fetchFacets(urlObj.pathname + '?' + urlObj.searchParams.toString());
      return;
    }

    if (e.target.closest('[data-facet-link][data-clear-price]')) return; // handled by the generic data-facet-link branch above

    if (e.target.closest('[data-filters-mobile-toggle]')) {
      openMobileFilters(e.target);
      return;
    }
    if (e.target.closest('[data-filters-mobile-close]') || e.target.closest('[data-filters-backdrop]')) {
      closeMobileFilters();
      return;
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target.matches('[data-facet-checkbox]')) {
      var url = e.target.checked ? e.target.getAttribute('data-url-add') : e.target.getAttribute('data-url-remove');
      if (url) fetchFacets(url);
      return;
    }

    if (e.target.matches('[data-sort-by]')) {
      var urlObj2 = new URL(window.location.href);
      urlObj2.searchParams.set('sort_by', e.target.value);
      fetchFacets(urlObj2.pathname + '?' + urlObj2.searchParams.toString(), { skipScroll: true });
      return;
    }

    if (e.target.matches('[data-out-of-stock-only]')) {
      var checked = e.target.checked;
      document.querySelectorAll('[data-product-grid-container] .product-card').forEach(function (card) {
        var soldOut = card.querySelector('.badge-soldout');
        card.style.display = (checked && !soldOut) ? 'none' : '';
      });
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMobileFilters();
  });

  window.addEventListener('popstate', function () {
    if (!document.querySelector('[data-product-grid-container]')) return;
    fetchFacets(window.location.pathname + window.location.search, { skipHistory: true, skipScroll: true });
  });
})();