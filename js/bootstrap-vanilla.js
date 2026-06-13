/*!
 * Bootstrap 3.4.1 behavior — vanilla JS (modal, dropdown, alert, collapse, carousel, tab, tooltip)
 *
 * Usage: include after Bootstrap 3 CSS. Do not load jQuery or bootstrap.js for these
 * components (avoid duplicate handlers).
 *
 * Dispatched events match Bootstrap 3: show.bs.modal, shown.bs.modal, hide.bs.modal,
 * hidden.bs.modal (modal remote HTML / loaded.bs.modal intentionally omitted — no innerHTML);
 * show/hide/shown/hidden.bs.dropdown; show/shown/hide/
 * hidden.bs.collapse; slide/slid.bs.carousel; close.bs.alert, closed.bs.alert;
 * show/hide/shown/hidden.bs.tab; show/shown/hide/hidden/inserted.bs.tooltip.
 *
 * CSS: this file does not animate. Bootstrap’s .fade / .carousel.slide rules may still
 * apply CSS transitions; remove those classes or override in CSS for fully instant UI.
 *
 * Public API: global BootstrapVanilla.init() runs on DOMContentLoaded; methods
 * BootstrapVanilla.modal(selector, option), .collapse(), .carousel(), .tab(), .tooltip().
 *
 * XSS: no innerHTML, eval, or network-loaded HTML. Selectors come from existing DOM attributes;
 * keep server-rendered data-target/href/id values trusted. Programmatic APIs should not pass
 * unsanitized user input as CSS selectors.
 *
 * Copyright (c) 2026 Andreas Kollaros. Licensed under the MIT License — see LICENSE in repo root.
 * Bootstrap CSS in this distribution: Copyright (c) 2011-2019 Twitter, Inc. (MIT).
 */
(function (global, document) {
  'use strict';

  var BV = {};

  // --- Utilities ---

  function elementFromEventTarget(t) {
    if (!t) return null;
    return t.nodeType === 1 ? t : t.parentElement;
  }

  function closest(el, selector) {
    el = elementFromEventTarget(el);
    if (!el) return null;
    if (el.closest) return el.closest(selector);
    var matchesFn =
      el.matches ||
      el.webkitMatchesSelector ||
      el.mozMatchesSelector ||
      el.msMatchesSelector;
    var node = el;
    while (node && node.nodeType === 1) {
      if (matchesFn && matchesFn.call(node, selector)) return node;
      node = node.parentElement;
    }
    return null;
  }

  function matches(el, selector) {
    if (!el || !el.matches) return false;
    return el.matches(selector);
  }

  function findAll(root, sel) {
    try {
      return root.querySelectorAll(sel);
    } catch (e) {
      return [];
    }
  }

  function findOne(root, sel) {
    try {
      return root.querySelector(sel);
    } catch (e) {
      return null;
    }
  }

  function containsNode(root, node) {
    if (!node) return false;
    if (root === document) {
      return document.documentElement && document.documentElement.contains(node);
    }
    return typeof root.contains === 'function' && root.contains(node);
  }

  function on(root, eventType, selector, handler, capture) {
    root.addEventListener(
      eventType,
      function (e) {
        var t = elementFromEventTarget(e.target);
        if (selector) {
          var match = closest(t, selector);
          if (!match || !containsNode(root, match)) return;
          handler.call(match, e);
        } else {
          handler.call(root, e);
        }
      },
      !!capture
    );
  }

  function fireEvent(target, type, detail, cancelable) {
    detail = detail || {};
    var evt;
    try {
      evt = new CustomEvent(type, {
        bubbles: true,
        cancelable: cancelable !== false,
        detail: detail
      });
    } catch (err) {
      evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(type, true, cancelable !== false, detail);
    }
    // jQuery-compat: relatedTarget on the event object for listeners using e.relatedTarget
    if (detail.relatedTarget !== undefined) {
      evt.relatedTarget = detail.relatedTarget;
    }
    target.dispatchEvent(evt);
    return evt;
  }

  function parseDataOptions(el) {
    var ds = el.dataset || {};
    var out = {};
    var k;
    for (k in ds) {
      if (!Object.prototype.hasOwnProperty.call(ds, k)) continue;
      var v = ds[k];
      if (v === 'true') v = true;
      else if (v === 'false') v = false;
      else if (/^\d+$/.test(v)) v = parseInt(v, 10);
      else if (v !== '' && !isNaN(Number(v)) && String(Number(v)) === v) v = Number(v);
      out[k] = v;
    }
    return out;
  }

  function extend(a, b) {
    var k;
    for (k in b) {
      if (Object.prototype.hasOwnProperty.call(b, k)) a[k] = b[k];
    }
    return a;
  }

  function stripHashHref(href) {
    return href && href.replace(/.*(?=#[^\s]*$)/, '');
  }

  /** Escape an HTML id for use in CSS selectors (mitigates selector breakage / odd matches). */
  function escapeCssIdent(id) {
    if (id == null || id === '') return '';
    var s = String(id);
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(s);
    return s.replace(/([\0-\x1f\x7f!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
  }

  // --- Alert ---

  var ALERT_DISMISS = '[data-dismiss="alert"]';

  function getAlertParent(trigger) {
    var selector = trigger.getAttribute('data-target');
    if (!selector) {
      selector = trigger.getAttribute('href');
      selector = selector && stripHashHref(selector);
    }
    if (selector && selector !== '#') {
      var bySel = findOne(document, selector);
      if (bySel) return bySel;
    }
    return closest(trigger, '.alert');
  }

  function closeAlert(trigger, e) {
    if (e) e.preventDefault();
    var parent = getAlertParent(trigger);
    if (!parent) return;

    var evt = fireEvent(parent, 'close.bs.alert', {}, true);
    if (evt.defaultPrevented) return;

    parent.classList.remove('in');
    parent.parentNode && parent.parentNode.removeChild(parent);
    fireEvent(parent, 'closed.bs.alert', {}, false);
  }

  function initAlert() {
    on(document, 'click', ALERT_DISMISS, function (e) {
      closeAlert(this, e);
    });
  }

  // --- Dropdown ---

  var DROPDOWN_TOGGLE = '[data-toggle="dropdown"]';
  var DROPDOWN_BACKDROP = 'dropdown-backdrop';

  function dropdownGetParent(toggle) {
    var selector = toggle.getAttribute('data-target');
    if (!selector) {
      selector = toggle.getAttribute('href');
      selector =
        selector && /#[A-Za-z]/.test(selector) ? stripHashHref(selector) : null;
    }
    if (selector && selector !== '#') {
      var p = findOne(document, selector);
      if (p) return p;
    }
    return toggle.parentElement;
  }

  function dropdownClearMenus(e) {
    if (e && e.which === 3) return;
    var backs = findAll(document, '.' + DROPDOWN_BACKDROP);
    for (var i = 0; i < backs.length; i++) backs[i].parentNode && backs[i].parentNode.removeChild(backs[i]);

    var toggles = findAll(document, DROPDOWN_TOGGLE);
    for (var j = 0; j < toggles.length; j++) {
      var toggle = toggles[j];
      var parent = dropdownGetParent(toggle);
      var relatedTarget = { relatedTarget: toggle };
      if (!parent.classList.contains('open')) continue;

      if (
        e &&
        e.type === 'click' &&
        /input|textarea/i.test(e.target.tagName) &&
        parent.contains(e.target)
      ) {
        continue;
      }

      var hideEvt = fireEvent(parent, 'hide.bs.dropdown', relatedTarget, true);
      if (hideEvt.defaultPrevented) continue;

      toggle.setAttribute('aria-expanded', 'false');
      parent.classList.remove('open');
      fireEvent(parent, 'hidden.bs.dropdown', relatedTarget, false);
    }
  }

  function dropdownToggle(e) {
    var toggle = this;
    if (matches(toggle, '.disabled') || toggle.disabled) return;

    var parent = dropdownGetParent(toggle);
    var isActive = parent.classList.contains('open');

    dropdownClearMenus();

    if (!isActive) {
      if (
        'ontouchstart' in document.documentElement &&
        !closest(toggle, '.navbar-nav')
      ) {
        var backdrop = document.createElement('div');
        backdrop.className = DROPDOWN_BACKDROP;
        toggle.parentNode.insertBefore(backdrop, toggle.nextSibling);
        backdrop.addEventListener('click', dropdownClearMenus);
      }

      var relatedTarget = { relatedTarget: toggle };
      var showEvt = fireEvent(parent, 'show.bs.dropdown', relatedTarget, true);
      if (showEvt.defaultPrevented) return;

      toggle.focus();
      toggle.setAttribute('aria-expanded', 'true');
      parent.classList.add('open');
      fireEvent(parent, 'shown.bs.dropdown', relatedTarget, false);
    }
    return false;
  }

  function dropdownKeydown(e) {
    if (!/(38|40|27|32)/.test(String(e.which)) || /input|textarea/i.test(e.target.tagName))
      return;

    var toggle = this;
    e.preventDefault();
    e.stopPropagation();

    if (matches(toggle, '.disabled') || toggle.disabled) return;

    var parent = dropdownGetParent(toggle);
    var isActive = parent.classList.contains('open');

    if ((!isActive && e.which !== 27) || (isActive && e.which === 27)) {
      if (e.which === 27) {
        var t = findOne(parent, DROPDOWN_TOGGLE);
        if (t) t.focus();
      }
      var ev = document.createEvent('HTMLEvents');
      ev.initEvent('click', true, true);
      toggle.dispatchEvent(ev);
      return;
    }

    var desc = ' li:not(.disabled):visible a';
    var items = findAll(parent, '.dropdown-menu' + desc);
    if (!items.length) return;

    var index = Array.prototype.indexOf.call(items, e.target);
    if (e.which === 38 && index > 0) index--;
    if (e.which === 40 && index < items.length - 1) index++;
    if (index < 0) index = 0;
    items[index].focus();
  }

  function initDropdown() {
    on(document, 'click', null, dropdownClearMenus);
    on(
      document,
      'click',
      '.dropdown form',
      function (e) {
        e.stopPropagation();
      }
    );
    on(document, 'click', DROPDOWN_TOGGLE, function (e) {
      dropdownToggle.call(this, e);
      e.preventDefault();
      e.stopPropagation();
    });
    on(document, 'keydown', DROPDOWN_TOGGLE, dropdownKeydown);
    on(document, 'keydown', '.dropdown-menu', dropdownKeydown);
  }

  // --- Collapse ---

  var collapseMap = new WeakMap();

  function getTargetFromCollapseTrigger(trigger) {
    var target = trigger.getAttribute('data-target');
    var href = trigger.getAttribute('href');
    if (!target && href) target = stripHashHref(href);
    return target ? findOne(document, target) : null;
  }

  function findCollapseTriggersForId(id) {
    if (!id) return [];
    var eid = escapeCssIdent(id);
    return findAll(
      document,
      '[data-toggle="collapse"][href="#' +
        eid +
        '"], [data-toggle="collapse"][data-target="#' +
        eid +
        '"]'
    );
  }

  Collapse.prototype.getParent = function () {
    var parent = findOne(document, this.options.parent);
    if (!parent) return null;
    var triggers = findAll(
      parent,
      '[data-toggle="collapse"][data-parent="' + this.options.parent + '"]'
    );
    for (var i = 0; i < triggers.length; i++) {
      var te = getTargetFromCollapseTrigger(triggers[i]);
      if (te) this.addAriaAndCollapsedClass(te, [triggers[i]]);
    }
    return parent;
  };

  function Collapse(element, options) {
    this.element = element;
    this.options = extend({}, Collapse.DEFAULTS, options || {});
    this.transitioning = false;
    this.triggers = findCollapseTriggersForId(element.id);

    if (this.options.parent) {
      this.parent = this.getParent();
    } else {
      this.parent = null;
      this.addAriaAndCollapsedClass(element, this.triggers);
    }

    if (this.options.toggle) this.toggle();
  }

  Collapse.VERSION = '3.4.1';
  Collapse.DEFAULTS = { toggle: true };

  Collapse.prototype.dimension = function () {
    return this.element.classList.contains('width') ? 'width' : 'height';
  };

  Collapse.prototype.addAriaAndCollapsedClass = function (el, triggers) {
    var isOpen = el.classList.contains('in');
    el.setAttribute('aria-expanded', isOpen);
    for (var i = 0; i < triggers.length; i++) {
      var tr = triggers[i];
      if (isOpen) tr.classList.remove('collapsed');
      else tr.classList.add('collapsed');
      tr.setAttribute('aria-expanded', isOpen);
    }
  };

  Collapse.prototype.show = function () {
    if (this.transitioning || this.element.classList.contains('in')) return;

    var actives;
    if (this.parent) {
      actives = findAll(this.parent, '.panel > .in, .panel > .collapsing');
    }

    if (actives && actives.length) {
      for (var i = 0; i < actives.length; i++) {
        var prevInst = collapseMap.get(actives[i]);
        if (prevInst && prevInst.transitioning) return;
      }
    }

    var startEvt = fireEvent(this.element, 'show.bs.collapse', {}, true);
    if (startEvt.defaultPrevented) return;

    if (actives && actives.length) {
      for (var j = 0; j < actives.length; j++) {
        if (actives[j] !== this.element) {
          var other = collapseMap.get(actives[j]);
          if (other) other.hide();
          else collapsePluginAction(actives[j], 'hide');
        }
      }
    }

    var dim = this.dimension();
    this.element.classList.remove('collapsing');
    this.element.classList.add('in');
    if (dim === 'height') this.element.style.height = '';
    else this.element.style.width = '';

    for (var k = 0; k < this.triggers.length; k++) {
      this.triggers[k].classList.remove('collapsed');
      this.triggers[k].setAttribute('aria-expanded', 'true');
    }
    this.element.setAttribute('aria-expanded', 'true');

    fireEvent(this.element, 'shown.bs.collapse', {}, false);
  };

  Collapse.prototype.hide = function () {
    if (this.transitioning || !this.element.classList.contains('in')) return;

    var startEvt = fireEvent(this.element, 'hide.bs.collapse', {}, true);
    if (startEvt.defaultPrevented) return;

    this.element.classList.remove('in');
    this.element.classList.add('collapse');
    this.element.setAttribute('aria-expanded', 'false');

    for (var i = 0; i < this.triggers.length; i++) {
      this.triggers[i].classList.add('collapsed');
      this.triggers[i].setAttribute('aria-expanded', 'false');
    }

    fireEvent(this.element, 'hidden.bs.collapse', {}, false);
  };

  Collapse.prototype.toggle = function () {
    if (this.element.classList.contains('in')) this.hide();
    else this.show();
  };

  function collapsePluginAction(element, option) {
    var data = collapseMap.get(element);
    var opts = extend({}, Collapse.DEFAULTS, parseDataOptions(element));
    if (typeof option === 'object' && option !== null) extend(opts, option);
    if (!data && opts.toggle && typeof option === 'string' && /show|hide/.test(option))
      opts.toggle = false;
    if (!data) {
      data = new Collapse(element, opts);
      collapseMap.set(element, data);
    }
    if (typeof option === 'string') data[option]();
  }

  function initCollapse() {
    on(document, 'click', '[data-toggle="collapse"]', function (e) {
      var trigger = this;
      if (!trigger.getAttribute('data-target')) e.preventDefault();
      var targetEl = getTargetFromCollapseTrigger(trigger);
      if (!targetEl) return;
      var data = collapseMap.get(targetEl);
      var option = data ? 'toggle' : parseDataOptions(trigger);
      collapsePluginAction(targetEl, option);
    });
  }

  // --- Modal ---

  var modalMap = new WeakMap();
  var Modal = function (element, options) {
    this.options = extend({}, Modal.DEFAULTS, options || {});
    this.element = element;
    this.dialog = findOne(element, '.modal-dialog');
    this.backdropEl = null;
    this.isShown = false;
    this.originalBodyPad = '';
    this.scrollbarWidth = 0;
    this.ignoreBackdropClick = false;
    this.fixedContent = '.navbar-fixed-top, .navbar-fixed-bottom';
    this.onFocusIn = this.onFocusIn.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
    this.onResize = this.onResize.bind(this);
  };

  Modal.VERSION = '3.4.1';
  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  };

  Modal.prototype.toggle = function (relatedTarget) {
    return this.isShown ? this.hide() : this.show(relatedTarget);
  };

  /** Sync options from data-* on the modal node (Bootstrap reads these per show). */
  Modal.prototype.refreshOptionsFromElement = function () {
    var el = this.element;
    var bd = el.getAttribute('data-backdrop');
    if (bd !== null) {
      if (bd === 'false' || bd === '') this.options.backdrop = false;
      else if (bd === 'true') this.options.backdrop = true;
      else this.options.backdrop = bd;
    }
    var kb = el.getAttribute('data-keyboard');
    if (kb !== null) this.options.keyboard = kb !== 'false';
  };

  Modal.prototype.show = function (relatedTarget) {
    var self = this;
    var el = this.element;
    extend(this.options, parseDataOptions(el));
    this.refreshOptionsFromElement();

    var e = fireEvent(el, 'show.bs.modal', { relatedTarget: relatedTarget }, true);
    if (this.isShown || e.defaultPrevented) return;

    this.isShown = true;
    this.checkScrollbar();
    this.setScrollbar();
    document.body.classList.add('modal-open');

    el.addEventListener('keydown', this.onKeydown);
    global.addEventListener('resize', this.onResize);

    this._handleDismissClick = function (ev) {
      if (closest(ev.target, '[data-dismiss="modal"]')) self.hide(ev);
    };
    el.addEventListener('click', this._handleDismissClick);

    this._onMouseDownDialog = function () {
      el.addEventListener('mouseup', self._onMouseUpModal);
    };
    this._onMouseUpModal = function (ev) {
      el.removeEventListener('mouseup', self._onMouseUpModal);
      if (ev.target === el) self.ignoreBackdropClick = true;
    };
    if (this.dialog) {
      this.dialog.addEventListener('mousedown', this._onMouseDownDialog);
    }

    this._onBackdropClick = function (ev) {
      if (self.ignoreBackdropClick) {
        self.ignoreBackdropClick = false;
        return;
      }
      if (ev.target !== el) return;
      if (self.options.backdrop === 'static') el.focus();
      else self.hide();
    };

    this.backdrop(function () {
      if (!el.parentNode) document.body.appendChild(el);

      el.style.display = 'block';
      el.scrollTop = 0;
      self.adjustDialog();
      el.classList.add('in');
      el.addEventListener('click', self._onBackdropClick);
      document.addEventListener('focusin', self.onFocusIn, true);

      fireEvent(el, 'shown.bs.modal', { relatedTarget: relatedTarget }, false);
      el.focus();
    });
  };

  Modal.prototype.hide = function (e) {
    if (e) e.preventDefault();
    var el = this.element;
    var ev = fireEvent(el, 'hide.bs.modal', {}, true);
    if (!this.isShown || ev.defaultPrevented) return;

    this.isShown = false;
    document.removeEventListener('focusin', this.onFocusIn, true);
    el.removeEventListener('keydown', this.onKeydown);
    global.removeEventListener('resize', this.onResize);

    if (this._handleDismissClick) {
      el.removeEventListener('click', this._handleDismissClick);
      this._handleDismissClick = null;
    }
    if (this.dialog && this._onMouseDownDialog) {
      this.dialog.removeEventListener('mousedown', this._onMouseDownDialog);
    }
    if (this._onBackdropClick) {
      el.removeEventListener('click', this._onBackdropClick);
      this._onBackdropClick = null;
    }

    el.classList.remove('in');
    this.hideModal();
  };

  Modal.prototype.onFocusIn = function (e) {
    if (
      document !== e.target &&
      this.element !== e.target &&
      !this.element.contains(e.target)
    ) {
      this.element.focus();
    }
  };

  Modal.prototype.onKeydown = function (e) {
    if (this.isShown && this.options.keyboard && e.which === 27) this.hide();
  };

  Modal.prototype.onResize = function () {
    this.adjustDialog();
  };

  Modal.prototype.hideModal = function () {
    var self = this;
    this.element.style.display = 'none';
    this.backdrop(function () {
      document.body.classList.remove('modal-open');
      self.resetAdjustments();
      self.resetScrollbar();
      fireEvent(self.element, 'hidden.bs.modal', {}, false);
    });
  };

  Modal.prototype.removeBackdrop = function () {
    if (this.backdropEl && this.backdropEl.parentNode) {
      this.backdropEl.parentNode.removeChild(this.backdropEl);
    }
    this.backdropEl = null;
  };

  Modal.prototype.backdrop = function (callback) {
    var self = this;
    var animate = this.element.classList.contains('fade');

    if (this.isShown && this.options.backdrop) {
      this.backdropEl = document.createElement('div');
      this.backdropEl.className = 'modal-backdrop' + (animate ? ' fade' : '');
      document.body.appendChild(this.backdropEl);

      if (animate) this.backdropEl.offsetWidth;
      this.backdropEl.classList.add('in');

      if (callback) callback();
    } else if (!this.isShown && this.backdropEl) {
      this.removeBackdrop();
      if (callback) callback();
    } else if (callback) {
      callback();
    }
  };

  Modal.prototype.adjustDialog = function () {
    var modalIsOverflowing =
      this.element.scrollHeight > document.documentElement.clientHeight;
    var pl = !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '';
    var pr = this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : '';
    this.element.style.paddingLeft = pl ? pl + 'px' : '';
    this.element.style.paddingRight = pr ? pr + 'px' : '';
  };

  Modal.prototype.resetAdjustments = function () {
    this.element.style.paddingLeft = '';
    this.element.style.paddingRight = '';
  };

  Modal.prototype.checkScrollbar = function () {
    var fullWindowWidth = window.innerWidth;
    if (!fullWindowWidth) {
      var r = document.documentElement.getBoundingClientRect();
      fullWindowWidth = r.right - Math.abs(r.left);
    }
    this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth;
    this.scrollbarWidth = this.measureScrollbar();
  };

  Modal.prototype.setScrollbar = function () {
    var body = document.body;
    var bodyPad = parseInt(global.getComputedStyle(body).paddingRight, 10) || 0;
    this.originalBodyPad = body.style.paddingRight || '';
    var sw = this.scrollbarWidth;
    if (this.bodyIsOverflowing) {
      body.style.paddingRight = bodyPad + sw + 'px';
      var fixed = findAll(document, this.fixedContent);
      for (var i = 0; i < fixed.length; i++) {
        var el = fixed[i];
        var actual = el.style.paddingRight;
        var calculated = parseFloat(global.getComputedStyle(el).paddingRight) || 0;
        el.setAttribute('data-padding-right', actual || '');
        el.style.paddingRight = calculated + sw + 'px';
      }
    }
  };

  Modal.prototype.resetScrollbar = function () {
    document.body.style.paddingRight = this.originalBodyPad;
    var fixed = findAll(document, this.fixedContent);
    for (var i = 0; i < fixed.length; i++) {
      var el = fixed[i];
      var padding = el.getAttribute('data-padding-right');
      el.removeAttribute('data-padding-right');
      el.style.paddingRight = padding || '';
    }
  };

  Modal.prototype.measureScrollbar = function () {
    var scrollDiv = document.createElement('div');
    scrollDiv.className = 'modal-scrollbar-measure';
    document.body.appendChild(scrollDiv);
    var w = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);
    return w;
  };

  function getModal(el, options) {
    var m = modalMap.get(el);
    if (!m) {
      m = new Modal(el, extend({}, Modal.DEFAULTS, parseDataOptions(el), options || {}));
      modalMap.set(el, m);
    }
    return m;
  }

  function modalPlugin(el, option, relatedTarget) {
    var opts = extend({}, Modal.DEFAULTS, parseDataOptions(el));
    if (typeof option === 'object' && option !== null) extend(opts, option);
    var m = getModal(el, opts);
    if (typeof option === 'string') m[option](relatedTarget);
    else if (opts.show) m.show(relatedTarget);
  }

  function initModal() {
    on(document, 'click', '[data-toggle="modal"]', function (e) {
      var trigger = this;
      var href = trigger.getAttribute('href');
      var target =
        trigger.getAttribute('data-target') ||
        (href && stripHashHref(href));
      if (!target) return;
      var modalEl = findOne(document, target);
      if (!modalEl) return;

      if (matches(trigger, 'a')) e.preventDefault();

      var existing = modalMap.get(modalEl);
      var option = existing
        ? 'toggle'
        : extend(parseDataOptions(modalEl), parseDataOptions(trigger));

      modalEl.addEventListener(
        'show.bs.modal',
        function showOnce(ev) {
          if (ev.defaultPrevented) return;
          modalEl.addEventListener(
            'hidden.bs.modal',
            function hiddenOnce() {
              if (trigger.offsetParent !== null) trigger.focus();
            },
            { once: true }
          );
        },
        { once: true }
      );

      modalPlugin(modalEl, option, trigger);
    });
  }

  // --- Carousel ---

  var carouselMap = new WeakMap();

  function Carousel(element, options) {
    this.element = element;
    this.options = extend({}, Carousel.DEFAULTS, options || {});
    this.indicators = findOne(element, '.carousel-indicators');
    this.paused = false;
    this.sliding = false;
    this.interval = null;
    this.active = null;
    this.items = null;

    var self = this;
    if (this.options.keyboard) {
      element.addEventListener('keydown', function (e) {
        self.keydown(e);
      });
    }
    if (this.options.pause === 'hover' && !('ontouchstart' in document.documentElement)) {
      element.addEventListener('mouseenter', function (e) {
        self.pause(e);
      });
      element.addEventListener('mouseleave', function (e) {
        self.cycle(e);
      });
    }
  }

  Carousel.VERSION = '3.4.1';
  Carousel.DEFAULTS = {
    interval: 5000,
    pause: 'hover',
    wrap: true,
    keyboard: true
  };

  Carousel.prototype.getItemIndex = function (item) {
    if (!item) return -1;
    var parent = item.parentNode;
    if (!parent) return -1;
    this.items = findAll(parent, '.item');
    return Array.prototype.indexOf.call(this.items, item);
  };

  Carousel.prototype.getItemForDirection = function (direction, active) {
    var activeIndex = this.getItemIndex(active);
    var len = this.items.length;
    var willWrap =
      (direction === 'prev' && activeIndex === 0) ||
      (direction === 'next' && activeIndex === len - 1);
    if (willWrap && !this.options.wrap) return active;
    var delta = direction === 'prev' ? -1 : 1;
    var itemIndex = (activeIndex + delta + len) % len;
    return this.items[itemIndex];
  };

  Carousel.prototype.to = function (pos) {
    var self = this;
    this.active = findOne(this.element, '.item.active');
    var activeIndex = this.getItemIndex(this.active);

    if (pos > this.items.length - 1 || pos < 0) return;

    if (this.sliding) {
      this.element.addEventListener(
        'slid.bs.carousel',
        function once() {
          self.element.removeEventListener('slid.bs.carousel', once);
          self.to(pos);
        }
      );
      return;
    }
    if (activeIndex === pos) {
      this.pause();
      this.cycle();
      return;
    }

    this.slide(pos > activeIndex ? 'next' : 'prev', this.items[pos]);
  };

  Carousel.prototype.cycle = function (e) {
    if (e) this.paused = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.options.interval && !this.paused) {
      var self = this;
      this.interval = setInterval(function () {
        self.next();
      }, this.options.interval);
    }
    return this;
  };

  Carousel.prototype.pause = function (e) {
    if (!e) this.paused = true;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    return this;
  };

  Carousel.prototype.next = function () {
    if (this.sliding) return;
    return this.slide('next');
  };

  Carousel.prototype.prev = function () {
    if (this.sliding) return;
    return this.slide('prev');
  };

  Carousel.prototype.keydown = function (e) {
    if (/input|textarea/i.test(e.target.tagName)) return;
    if (e.which === 37) {
      this.prev();
      e.preventDefault();
    } else if (e.which === 39) {
      this.next();
      e.preventDefault();
    }
  };

  Carousel.prototype.slide = function (type, next) {
    var active = findOne(this.element, '.item.active');
    var nextItem = next || this.getItemForDirection(type, active);
    var isCycling = !!this.interval;
    var direction = type === 'next' ? 'left' : 'right';

    if (!active || !nextItem) {
      this.sliding = false;
      return;
    }

    if (nextItem.classList.contains('active')) {
      this.sliding = false;
      return;
    }

    var slideEvt = fireEvent(
      this.element,
      'slide.bs.carousel',
      { relatedTarget: nextItem, direction: direction },
      true
    );
    if (slideEvt.defaultPrevented) return;

    this.sliding = true;
    if (isCycling) this.pause();

    if (this.indicators) {
      var actInd = findOne(this.indicators, '.active');
      if (actInd) actInd.classList.remove('active');
      var nextInd = this.indicators.children[this.getItemIndex(nextItem)];
      if (nextInd) nextInd.classList.add('active');
    }

    active.classList.remove('active');
    nextItem.classList.add('active');
    this.sliding = false;

    fireEvent(
      this.element,
      'slid.bs.carousel',
      { relatedTarget: nextItem, direction: direction },
      false
    );

    if (isCycling) this.cycle();
    return this;
  };

  function carouselPlugin(el, option) {
    var data = carouselMap.get(el);
    var opts = extend({}, Carousel.DEFAULTS, parseDataOptions(el), typeof option === 'object' && option ? option : {});
    var action =
      typeof option === 'string'
        ? option
        : opts.slide !== undefined && opts.slide !== null && opts.slide !== ''
          ? opts.slide
          : null;

    if (!data) {
      data = new Carousel(el, opts);
      carouselMap.set(el, data);
    }
    if (typeof option === 'number') data.to(option);
    else if (action) {
      if (typeof data[action] === 'function') data[action]();
    } else if (opts.interval) data.pause().cycle();
  }

  /** Ensure a carousel instance exists (same options source as data-ride init). */
  function getOrCreateCarousel(el) {
    var data = carouselMap.get(el);
    if (!data) {
      carouselPlugin(el, parseDataOptions(el));
      data = carouselMap.get(el);
    }
    return data;
  }

  function initCarouselDataApi() {
    // Direct listeners: comma-separated groups in closest() are not reliable in all browsers;
    // delegation also missed some nested targets. Bind each control once.
    var controls = document.querySelectorAll('[data-slide], [data-slide-to]');
    for (var i = 0; i < controls.length; i++) {
      controls[i].addEventListener('click', carouselControlClick);
    }
  }

  function carouselControlClick(e) {
    carouselClickHandler.call(this, e);
  }

  function carouselClickHandler(e) {
    var trigger = this;
    var href = trigger.getAttribute('href');
    if (href) href = stripHashHref(href);
    var target = trigger.getAttribute('data-target') || href;
    var carouselEl = target ? findOne(document, target) : null;
    if (!carouselEl || !carouselEl.classList.contains('carousel')) {
      carouselEl = closest(trigger, '.carousel');
    }
    if (!carouselEl || !carouselEl.classList.contains('carousel')) return;

    e.preventDefault();

    var slideDir = trigger.getAttribute('data-slide');
    var slideIndex = trigger.getAttribute('data-slide-to');

    // Same pattern as Bootstrap / dots: resolve instance, then call inst.to() or inst.prev()/next().
    // Relying on carouselPlugin(opts.slide) for arrows was brittle; dots already used inst.to() only.
    var inst = getOrCreateCarousel(carouselEl);
    if (!inst) return;

    if (slideIndex !== null && slideIndex !== '') {
      inst.to(parseInt(slideIndex, 10));
    } else if (slideDir === 'prev' || slideDir === 'next') {
      inst[slideDir]();
    }
  }

  function initCarouselRide() {
    var rides = findAll(document, '[data-ride="carousel"]');
    for (var i = 0; i < rides.length; i++) {
      carouselPlugin(rides[i], parseDataOptions(rides[i]));
    }
  }

  // --- Tab ---
  // Reference: Bootstrap 3.4.1 tab.js — https://github.com/twbs/bootstrap/blob/v3.4.1/js/tab.js

  var tabMap = new WeakMap();
  var TAB_TOGGLE = '[data-toggle="tab"], [data-toggle="pill"]';

  function getTabSelectorFromTrigger(trigger) {
    var selector = trigger.getAttribute('data-target');
    if (!selector) {
      var href = trigger.getAttribute('href');
      selector = href && stripHashHref(href);
    }
    return selector || null;
  }

  function findDirectActiveChild(container) {
    if (!container || !container.children) return null;
    var children = container.children;
    for (var i = 0; i < children.length; i++) {
      if (children[i].classList.contains('active')) return children[i];
    }
    return null;
  }

  function Tab(element) {
    this.element = element;
  }

  Tab.VERSION = '3.4.1';

  Tab.prototype.show = function () {
    var trigger = this.element;
    var ul = closest(trigger, 'ul:not(.dropdown-menu)');
    if (!ul) return;

    var selector = getTabSelectorFromTrigger(trigger);
    if (!selector) return;

    var li = closest(trigger, 'li');
    if (!li || li.classList.contains('active')) return;

    var previousLi = findDirectActiveChild(ul);
    var previousLink = previousLi ? findOne(previousLi, 'a') : null;

    var hideEvt = previousLink
      ? fireEvent(previousLink, 'hide.bs.tab', { relatedTarget: trigger }, true)
      : { defaultPrevented: false };
    var showEvt = fireEvent(
      trigger,
      'show.bs.tab',
      { relatedTarget: previousLink || null },
      true
    );

    if (showEvt.defaultPrevented || hideEvt.defaultPrevented) return;

    var target = findOne(document, selector);
    if (!target) return;

    this.activate(li, ul);
    this.activate(target, target.parentNode, function () {
      if (previousLink) {
        fireEvent(previousLink, 'hidden.bs.tab', { relatedTarget: trigger }, false);
      }
      fireEvent(trigger, 'shown.bs.tab', { relatedTarget: previousLink || null }, false);
    });
  };

  Tab.prototype.activate = function (element, container, callback) {
    if (!element || !container) {
      if (callback) callback();
      return;
    }

    var activeEl = findDirectActiveChild(container);

    if (activeEl) {
      activeEl.classList.remove('active', 'in');
      var nestedActives = findAll(activeEl, '.dropdown-menu > .active');
      for (var i = 0; i < nestedActives.length; i++) {
        nestedActives[i].classList.remove('active');
      }
      var tabToggles = findAll(activeEl, '[data-toggle="tab"], [data-toggle="pill"]');
      for (var j = 0; j < tabToggles.length; j++) {
        tabToggles[j].setAttribute('aria-expanded', 'false');
      }
    }

    element.classList.add('active');
    element.classList.remove('fade');

    var togglesInElement = findAll(element, '[data-toggle="tab"], [data-toggle="pill"]');
    for (var k = 0; k < togglesInElement.length; k++) {
      togglesInElement[k].setAttribute('aria-expanded', 'true');
    }

    if (closest(element, '.dropdown-menu')) {
      var dropdownLi = closest(element, 'li.dropdown');
      if (dropdownLi) dropdownLi.classList.add('active');
    }

    if (callback) callback();
  };

  function tabPluginAction(element, option) {
    var data = tabMap.get(element);
    if (!data) {
      data = new Tab(element);
      tabMap.set(element, data);
    }
    if (typeof option === 'string') data[option]();
    else data.show();
  }

  function initTab() {
    on(document, 'click', TAB_TOGGLE, function (e) {
      e.preventDefault();
      tabPluginAction(this, 'show');
    });
  }

  // --- Tooltip ---
  // Reference: Bootstrap 3.4.1 tooltip.js — https://github.com/twbs/bootstrap/blob/v3.4.1/js/tooltip.js
  // Plain-text titles only (textContent). No html option, no remote content, fixed DOM template.

  var tooltipMap = new WeakMap();

  function createTooltipTipElement() {
    var tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.setAttribute('role', 'tooltip');
    var arrow = document.createElement('div');
    arrow.className = 'tooltip-arrow';
    var inner = document.createElement('div');
    inner.className = 'tooltip-inner';
    tip.appendChild(arrow);
    tip.appendChild(inner);
    return tip;
  }

  function normalizeTooltipDelay(delay) {
    if (delay && typeof delay === 'object') return delay;
    var n = delay || 0;
    return { show: n, hide: n };
  }

  function parseTooltipOptions(element, options) {
    var opts = extend({}, Tooltip.DEFAULTS, parseDataOptions(element), options || {});
    opts.delay = normalizeTooltipDelay(opts.delay);
    if (typeof opts.placement !== 'string') opts.placement = Tooltip.DEFAULTS.placement;
    if (typeof opts.trigger !== 'string') opts.trigger = Tooltip.DEFAULTS.trigger;
    return opts;
  }

  function tooltipTriggerList(options) {
    return String(options.trigger || '')
      .trim()
      .split(/\s+/)
      .filter(function (t) {
        return !!t;
      });
  }

  function getScrollTop(el) {
    return el === document.body
      ? global.pageYOffset || document.documentElement.scrollTop || 0
      : el.scrollTop;
  }

  function getScrollLeft(el) {
    return el === document.body
      ? global.pageXOffset || document.documentElement.scrollLeft || 0
      : el.scrollLeft;
  }

  function getElementOffset(el) {
    var rect = el.getBoundingClientRect();
    return {
      top: rect.top + getScrollTop(document.documentElement),
      left: rect.left + getScrollLeft(document.documentElement),
      width: rect.width || rect.right - rect.left,
      height: rect.height || rect.bottom - rect.top
    };
  }

  function getElementClientRect(el) {
    if (!el) return null;
    var rect = el.getBoundingClientRect();
    var width = rect.width != null ? rect.width : rect.right - rect.left;
    var height = rect.height != null ? rect.height : rect.bottom - rect.top;
    return {
      top: rect.top,
      left: rect.left,
      width: width,
      height: height,
      bottom: rect.bottom,
      right: rect.right
    };
  }

  function getWindowViewport() {
    return {
      width: global.innerWidth || document.documentElement.clientWidth,
      height: global.innerHeight || document.documentElement.clientHeight
    };
  }

  function getElementPosition(el, viewportEl) {
    if (!el) return null;
    var isBody = el.tagName === 'BODY';
    var rect = el.getBoundingClientRect();
    var width = rect.width != null ? rect.width : rect.right - rect.left;
    var height = rect.height != null ? rect.height : rect.bottom - rect.top;
    var pos = {
      top: rect.top,
      left: rect.left,
      width: width,
      height: height,
      bottom: rect.bottom,
      right: rect.right
    };
    if (isBody) {
      pos.width = global.innerWidth || document.documentElement.clientWidth;
      pos.height = global.innerHeight || document.documentElement.clientHeight;
    } else if (!viewportEl || viewportEl === el) {
      var off = getElementOffset(el);
      pos.top = off.top;
      pos.left = off.left;
      pos.bottom = off.top + off.height;
      pos.right = off.left + off.width;
    }
    if (viewportEl) {
      pos.scroll = getScrollTop(viewportEl);
    }
    return pos;
  }

  function Tooltip(element, options) {
    this.type = 'tooltip';
    this.element = element;
    this.options = parseTooltipOptions(element, options);
    this.enabled = true;
    this.timeout = null;
    this.hoverState = null;
    this.tipEl = null;
    this.arrowEl = null;
    this.inState = { click: false, hover: false, focus: false };
    this._handlers = [];
    this.viewportEl =
      this.options.viewport &&
      findOne(
        document,
        this.options.viewport.selector || this.options.viewport
      );

    this.init();
  }

  Tooltip.VERSION = '3.4.1';

  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    container: false,
    viewport: { selector: 'body', padding: 0 }
  };

  Tooltip.prototype.on = function (target, eventType, handler) {
    target.addEventListener(eventType, handler);
    this._handlers.push([target, eventType, handler]);
  };

  Tooltip.prototype.offAll = function () {
    for (var i = 0; i < this._handlers.length; i++) {
      var h = this._handlers[i];
      h[0].removeEventListener(h[1], h[2]);
    }
    this._handlers = [];
  };

  Tooltip.prototype.init = function () {
    var triggers = tooltipTriggerList(this.options);
    var self = this;

    this.offAll();

    for (var i = 0; i < triggers.length; i++) {
      var trigger = triggers[i];
      if (trigger === 'manual') continue;
      if (trigger === 'click') {
        this.on(this.element, 'click', function (e) {
          self.toggle(e);
        });
      } else {
        var eventIn = trigger === 'hover' ? 'mouseenter' : 'focusin';
        var eventOut = trigger === 'hover' ? 'mouseleave' : 'focusout';
        this.on(this.element, eventIn, function (e) {
          self.enter(e);
        });
        this.on(this.element, eventOut, function (e) {
          self.leave(e);
        });
      }
    }

    this.fixTitle();
  };

  Tooltip.prototype.fixTitle = function () {
    var el = this.element;
    var title = el.getAttribute('title');
    if (title != null && title !== '') {
      el.setAttribute('data-original-title', title);
    } else if (!el.hasAttribute('data-original-title')) {
      el.setAttribute('data-original-title', '');
    }
    if (el.hasAttribute('title')) {
      el.removeAttribute('title');
    }
  };

  Tooltip.prototype.getTitle = function () {
    var title =
      this.element.getAttribute('data-original-title') ||
      (typeof this.options.title === 'function'
        ? this.options.title.call(this.element)
        : this.options.title);
    if (title == null) title = '';
    return String(title);
  };

  Tooltip.prototype.hasContent = function () {
    return this.getTitle().length > 0;
  };

  Tooltip.prototype.tip = function () {
    if (!this.tipEl) {
      this.tipEl = createTooltipTipElement();
    }
    return this.tipEl;
  };

  Tooltip.prototype.arrow = function () {
    if (!this.arrowEl) {
      this.arrowEl = findOne(this.tip(), '.tooltip-arrow');
    }
    return this.arrowEl;
  };

  Tooltip.prototype.getUID = function (prefix) {
    do {
      prefix += ~~(Math.random() * 1000000);
    } while (document.getElementById(prefix));
    return prefix;
  };

  Tooltip.prototype.isInStateTrue = function () {
    for (var key in this.inState) {
      if (this.inState[key]) return true;
    }
    return false;
  };

  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof Tooltip ? obj : this;
    if (!(obj instanceof Tooltip)) {
      if (obj && obj.type === 'focusin') self.inState.focus = true;
      else if (obj && obj.type === 'mouseenter') self.inState.hover = true;
    }

    if (self.tip().classList.contains('in') || self.hoverState === 'in') {
      self.hoverState = 'in';
      return;
    }

    clearTimeout(self.timeout);
    self.hoverState = 'in';

    if (self.options.delay.show) {
      self.timeout = setTimeout(function () {
        if (self.hoverState === 'in') self.show();
      }, self.options.delay.show);
    } else {
      self.show();
    }
  };

  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof Tooltip ? obj : this;
    if (!(obj instanceof Tooltip)) {
      if (obj && obj.type === 'focusout') self.inState.focus = false;
      else if (obj && obj.type === 'mouseleave') self.inState.hover = false;
    }

    if (self.isInStateTrue()) return;

    clearTimeout(self.timeout);
    self.hoverState = 'out';

    if (self.options.delay.hide) {
      self.timeout = setTimeout(function () {
        if (self.hoverState === 'out') self.hide();
      }, self.options.delay.hide);
    } else {
      self.hide();
    }
  };

  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    if (placement === 'bottom') {
      return { top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2 };
    }
    if (placement === 'top') {
      return { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 };
    }
    if (placement === 'left') {
      return { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth };
    }
    return { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width };
  };

  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = { top: 0, left: 0 };

    var padding = (this.options.viewport && this.options.viewport.padding) || 0;
    var viewportDimensions = getWindowViewport();
    var scroll = 0;

    if (/right|left/.test(placement)) {
      var topEdgeOffset = pos.top - padding - scroll;
      var bottomEdgeOffset = pos.top - scroll + padding + actualHeight;
      if (topEdgeOffset < 0) delta.top = -topEdgeOffset;
      else if (bottomEdgeOffset > viewportDimensions.height) {
        delta.top = viewportDimensions.height - bottomEdgeOffset;
      }
    } else {
      var leftEdgeOffset = pos.left - padding;
      var rightEdgeOffset = pos.left + padding + actualWidth;
      if (leftEdgeOffset < 0) delta.left = -leftEdgeOffset;
      else if (rightEdgeOffset > viewportDimensions.width) {
        delta.left = viewportDimensions.width - rightEdgeOffset;
      }
    }
    return delta;
  };

  Tooltip.prototype.applyPlacement = function (offset, placement) {
    var tip = this.tip();
    var width = tip.offsetWidth;
    var height = tip.offsetHeight;
    var style = global.getComputedStyle(tip);
    var marginTop = parseInt(style.marginTop, 10) || 0;
    var marginLeft = parseInt(style.marginLeft, 10) || 0;

    offset.top += marginTop;
    offset.left += marginLeft;

    tip.style.top = Math.round(offset.top) + 'px';
    tip.style.left = Math.round(offset.left) + 'px';
    tip.classList.add('in');

    var actualWidth = tip.offsetWidth;
    var actualHeight = tip.offsetHeight;

    if (placement === 'top' && actualHeight !== height) {
      offset.top = offset.top + height - actualHeight;
      tip.style.top = Math.round(offset.top) + 'px';
    }

    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight);
    if (delta.left) {
      offset.left += delta.left;
      tip.style.left = Math.round(offset.left) + 'px';
    } else if (delta.top) {
      offset.top += delta.top;
      tip.style.top = Math.round(offset.top) + 'px';
    }

    var isVertical = /top|bottom/.test(placement);
    var arrow = this.arrow();
    if (arrow) {
      var arrowDelta = isVertical
        ? delta.left * 2 - width + actualWidth
        : delta.top * 2 - height + actualHeight;
      var dimension = isVertical ? actualWidth : actualHeight;
      if (isVertical) {
        arrow.style.left = 50 * (1 - arrowDelta / dimension) + '%';
        arrow.style.top = '';
      } else {
        arrow.style.top = 50 * (1 - arrowDelta / dimension) + '%';
        arrow.style.left = '';
      }
    }
  };

  Tooltip.prototype.setContent = function () {
    var tip = this.tip();
    var inner = findOne(tip, '.tooltip-inner');
    if (inner) inner.textContent = this.getTitle();
    tip.classList.remove('in', 'top', 'bottom', 'left', 'right');
  };

  Tooltip.prototype.show = function () {
    this.fixTitle();
    if (!this.hasContent() || !this.enabled) return;

    var e = fireEvent(this.element, 'show.bs.tooltip', {}, true);
    if (e.defaultPrevented) return;
    if (!document.documentElement.contains(this.element)) return;

    var tip = this.tip();
    var tipId = this.getUID('tooltip');
    this.setContent();
    tip.setAttribute('id', tipId);
    this.element.setAttribute('aria-describedby', tipId);

    if (this.options.animation) tip.classList.add('fade');

    var placement =
      typeof this.options.placement === 'function'
        ? this.options.placement.call(this, tip, this.element)
        : this.options.placement;

    var autoToken = /\s?auto?\s?/i;
    var autoPlace = autoToken.test(placement);
    if (autoPlace) placement = placement.replace(autoToken, '') || 'top';

    tip.style.position = 'fixed';
    tip.style.top = '0';
    tip.style.left = '0';
    tip.style.display = 'block';
    tip.classList.add(placement);

    if (tip.parentNode) tip.parentNode.removeChild(tip);

    var container = this.options.container
      ? findOne(document, this.options.container)
      : null;
    if (container) container.appendChild(tip);
    else document.body.appendChild(tip);

    fireEvent(this.element, 'inserted.bs.tooltip', {}, false);

    var pos = getElementClientRect(this.element);
    var actualWidth = tip.offsetWidth;
    var actualHeight = tip.offsetHeight;

    if (autoPlace) {
      var orgPlacement = placement;
      var viewportDim = getWindowViewport();
      if (
        placement === 'bottom' &&
        pos.top + pos.height + actualHeight > viewportDim.height
      ) {
        placement = 'top';
      } else if (placement === 'top' && pos.top - actualHeight < 0) {
        placement = 'bottom';
      } else if (
        placement === 'right' &&
        pos.left + pos.width + actualWidth > viewportDim.width
      ) {
        placement = 'left';
      } else if (placement === 'left' && pos.left - actualWidth < 0) {
        placement = 'right';
      }
      tip.classList.remove(orgPlacement);
      tip.classList.add(placement);
    }

    var offset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight);
    this.applyPlacement(offset, placement);

    var self = this;
    var prevHoverState = self.hoverState;
    fireEvent(this.element, 'shown.bs.tooltip', {}, false);
    self.hoverState = null;
    if (prevHoverState === 'out') self.leave(self);
  };

  Tooltip.prototype.hide = function (callback) {
    var self = this;
    var tip = this.tip();
    var e = fireEvent(this.element, 'hide.bs.tooltip', {}, true);
    if (e.defaultPrevented) return;

    tip.classList.remove('in');

    if (this.hoverState !== 'in') {
      if (tip.parentNode) tip.parentNode.removeChild(tip);
      this.element.removeAttribute('aria-describedby');
      fireEvent(this.element, 'hidden.bs.tooltip', {}, false);
    }
    this.hoverState = null;
    if (callback) callback();
  };

  Tooltip.prototype.toggle = function (e) {
    if (e) {
      this.inState.click = !this.inState.click;
      if (this.isInStateTrue()) this.enter(this);
      else this.leave(this);
    } else if (this.tip().classList.contains('in')) {
      this.leave(this);
    } else {
      this.enter(this);
    }
  };

  Tooltip.prototype.enable = function () {
    this.enabled = true;
  };

  Tooltip.prototype.disable = function () {
    this.enabled = false;
  };

  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled;
  };

  Tooltip.prototype.destroy = function () {
    var self = this;
    clearTimeout(this.timeout);
    this.hide(function () {
      self.offAll();
      if (self.tipEl && self.tipEl.parentNode) {
        self.tipEl.parentNode.removeChild(self.tipEl);
      }
      self.tipEl = null;
      self.arrowEl = null;
    });
  };

  function tooltipPluginAction(element, option) {
    var data = tooltipMap.get(element);
    if (!data && typeof option === 'string' && /destroy|hide/.test(option)) return;

    if (!data) {
      var opts =
        typeof option === 'object' && option !== null ? option : {};
      data = new Tooltip(element, opts);
      tooltipMap.set(element, data);
    } else if (typeof option === 'object' && option !== null) {
      extend(data.options, parseTooltipOptions(element, option));
      data.init();
    }

    if (typeof option === 'string') {
      if (option === 'destroy') {
        data.destroy();
        tooltipMap.delete(element);
      } else if (typeof data[option] === 'function') {
        data[option]();
      }
    }
  }

  function tooltipResolveElements(selector) {
    if (!selector) return [];
    if (typeof selector === 'string') return findAll(document, selector);
    if (selector.nodeType === 1) return [selector];
    if (typeof selector.length === 'number') {
      var out = [];
      for (var i = 0; i < selector.length; i++) {
        if (selector[i] && selector[i].nodeType === 1) out.push(selector[i]);
      }
      return out;
    }
    return [];
  }

  // --- Public API ---

  BV.VERSION = '3.4.1';

  BV.Alert = {
    close: function (element) {
      var t = element.querySelector ? element.querySelector(ALERT_DISMISS) : null;
      if (t) closeAlert(t, null);
    }
  };

  BV.Dropdown = function (element) {
    /* construction is automatic via data-api */
  };

  BV.Collapse = Collapse;
  BV.Modal = Modal;
  BV.Carousel = Carousel;
  BV.Tab = Tab;
  BV.Tooltip = Tooltip;

  BV.collapse = function (selector, option) {
    var el = typeof selector === 'string' ? findOne(document, selector) : selector;
    if (el) collapsePluginAction(el, option || 'toggle');
  };

  BV.modal = function (selector, option, relatedTarget) {
    var el = typeof selector === 'string' ? findOne(document, selector) : selector;
    if (el) modalPlugin(el, option, relatedTarget);
  };

  BV.carousel = function (selector, option) {
    var el = typeof selector === 'string' ? findOne(document, selector) : selector;
    if (el) carouselPlugin(el, option);
  };

  BV.tab = function (selector, option) {
    var el = typeof selector === 'string' ? findOne(document, selector) : selector;
    if (el) tabPluginAction(el, option || 'show');
  };

  BV.tooltip = function (selector, option) {
    var els = tooltipResolveElements(selector);
    for (var i = 0; i < els.length; i++) {
      tooltipPluginAction(els[i], option);
    }
  };

  BV.init = function () {
    initAlert();
    initDropdown();
    initCollapse();
    initModal();
    initCarouselDataApi();
    initCarouselRide();
    initTab();
  };

  global.BootstrapVanilla = BV;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', BV.init);
  } else {
    BV.init();
  }
})(typeof window !== 'undefined' ? window : this, document);
