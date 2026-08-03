import { getCurrentInstance, watch, onMounted, ref, computed, onDeactivated, onBeforeUnmount, nextTick, h, onBeforeUpdate, inject, onActivated, Transition } from 'vue';
import { a as noop, c as createComponent, b as client, i as isRuntimeSsrPreHydration, H as History, l as listenOpts, f as formKey, s as stopAndPrevent, p as prevent, d as stop } from '../virtual/entry.mjs';
import { v as vmHasRouter, b as vmIsDestroyed, i as isKeyCode, c as QIcon, d as QSpinner, s as shouldIgnoreKey } from './QBtn.mjs';
import { u as useDarkProps, a as useDark } from './QCard.mjs';
import { a as hSlot } from './render.mjs';

function injectProp(target, propName, get, set) {
  Object.defineProperty(target, propName, {
    get,
    set,
    enumerable: true
  });
  return target
}

// oxlint-disable-next-line default-param-last
function debounce(fn, wait = 250, immediate) {
  let timer = null;

  function debounced(...args) {
    const later = () => {
      timer = null;
      fn.apply(this, args);
    };

    if (timer !== null) {
      clearTimeout(timer);
    }

    timer = setTimeout(later, wait);
  }

  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced
}

// internal
function childHasFocus(el, focusedEl) {
  if (el === void 0 || el === null || el.contains(focusedEl)) {
    return true
  }

  for (
    let next = el.nextElementSibling;
    next !== null;
    next = next.nextElementSibling
  ) {
    if (next.contains(focusedEl)) return true
  }

  return false
}

const useModelToggleProps = {
  modelValue: {
    type: Boolean,
    default: null
  },

  'onUpdate:modelValue': [Function, Array]
};

const useModelToggleEmits = ['beforeShow', 'show', 'beforeHide', 'hide'];

// handleShow/handleHide -> removeTick(), self (& emit show)

function useModelToggle({
  showing,
  canShow, // optional
  hideOnRouteChange, // optional
  handleShow, // optional
  handleHide, // optional
  handleRouteChange, // optional
  processOnMount // optional
}) {
  const vm = getCurrentInstance();
  const { props, emit, proxy } = vm;

  let payload;

  function toggle(evt) {
    if (showing.value) ; else {
      show(evt);
    }
  }

  function show(evt) {
    if (
      props.disable ||
      evt?.qAnchorHandled === true ||
      (canShow !== void 0 && !canShow(evt))
    ) {
      return
    }

    props['onUpdate:modelValue'] !== void 0;

    {
      processShow(evt);
    }
  }

  function processShow(evt) {
    if (showing.value) return

    showing.value = true;
    emit('beforeShow', evt);

    if (handleShow !== void 0) {
      handleShow(evt);
    } else {
      emit('show', evt);
    }
  }

  function hide(evt) {
    return
  }

  function processHide(evt) {
    if (!showing.value) return

    showing.value = false;

    emit('beforeHide', evt);

    if (handleHide !== void 0) {
      handleHide(evt);
    } else {
      emit('hide', evt);
    }
  }

  function processModelChange(val) {
    if (props.disable && val) {
      if (props['onUpdate:modelValue'] !== void 0) {
        emit('update:modelValue', false);
      }
    } else if ((val === true) !== showing.value) {
      const fn = val ? processShow : processHide;
      fn(payload);
    }
  }

  watch(() => props.modelValue, processModelChange);

  if (hideOnRouteChange !== void 0 && vmHasRouter(vm)) {
    watch(
      () => proxy.$route.fullPath,
      () => {
        if (hideOnRouteChange.value && showing.value) {
          handleRouteChange?.();
        }
      }
    );
  }

  {
    onMounted(() => {
      processModelChange(props.modelValue);
    });
  }

  // expose public methods
  const publicMethods = { show, hide, toggle };
  Object.assign(proxy, publicMethods);

  return publicMethods
}

let queue = [];
let waitFlags = [];

function addFocusFn(fn) {
  if (waitFlags.length === 0) {
    fn();
  } else {
    queue.push(fn);
  }
}

function removeFocusFn(fn) {
  queue = queue.filter(entry => entry !== fn);
}

/**
 * Noop internal component to ease testing
 * of the teleported content.
 *
 * const wrapper = mount(QDialog, { ... })
 * const teleportedWrapper = wrapper.findComponent({ name: 'QPortal' })
 */
createComponent({
  name: 'QPortal',
  setup(_, { slots }) {
    return () => slots.default()
  }
});

// Warning!
// You MUST specify "inheritAttrs: false" in your component

function usePortal(vm, innerRef, renderPortalContent, type) {
  // showing, including while in show/hide transition
  const portalIsActive = ref(false);

  // showing & not in any show/hide transition
  const portalIsAccessible = ref(false);

  {
    return {
      portalIsActive,
      portalIsAccessible,

      showPortal: noop,
      hidePortal: noop,
      renderPortal: noop
    }
  }
}

const useTransitionProps = {
  transitionShow: {
    type: String,
    default: 'fade'
  },

  transitionHide: {
    type: String,
    default: 'fade'
  },

  transitionDuration: {
    type: [String, Number],
    default: 300
  }
};

function useTransition(
  props,
  defaultShowFn = () => {},
  defaultHideFn = () => {}
) {
  return {
    transitionProps: computed(() => {
      const show = `q-transition--${props.transitionShow || defaultShowFn()}`;
      const hide = `q-transition--${props.transitionHide || defaultHideFn()}`;

      return {
        appear: true,

        enterFromClass: `${show}-enter-from`,
        enterActiveClass: `${show}-enter-active`,
        enterToClass: `${show}-enter-to`,

        leaveFromClass: `${hide}-leave-from`,
        leaveActiveClass: `${hide}-leave-active`,
        leaveToClass: `${hide}-leave-to`
      }
    }),

    transitionStyle: computed(
      () => `--q-transition-duration: ${props.transitionDuration}ms`
    )
  }
}

/*
 * Usage:
 *    registerTick(fn)
 *    removeTick()
 */

function useTick() {
  let tickFn;
  const vm = getCurrentInstance();

  function removeTick() {
    tickFn = void 0;
  }

  onDeactivated(removeTick);
  onBeforeUnmount(removeTick);

  return {
    removeTick,

    registerTick(fn) {
      tickFn = fn;

      nextTick(() => {
        if (tickFn === fn) {
          // we also check if VM is destroyed, since if it
          // got to trigger one nextTick() we cannot stop it
          if (!vmIsDestroyed(vm)) tickFn();
          tickFn = void 0;
        }
      });
    }
  }
}

/*
 * Usage:
 *    registerTimeout(fn[, delay])
 *    removeTimeout()
 */

function useTimeout() {
  {
    return {
      removeTimeout: noop,
      registerTimeout: noop
    }
  }
}

function getVerticalScrollPosition(scrollTarget) {
  return scrollTarget === window
    ? window.pageYOffset || window.scrollY || document.body.scrollTop || 0
    : scrollTarget.scrollTop
}

function getHorizontalScrollPosition(scrollTarget) {
  return scrollTarget === window
    ? window.pageXOffset || window.scrollX || document.body.scrollLeft || 0
    : scrollTarget.scrollLeft
}

const handlers$1 = [];
let escDown;

function onKeydown(evt) {
  if (evt.keyCode === 27) {
    escDown = true;
  }
}

function onBlur() {
  if (escDown) {
    escDown = false;
  }
}

function onKeyup(evt) {
  if (escDown && isKeyCode(evt, 27)) {
    escDown = false;
    handlers$1.at(-1)(evt);
  }
}

function update(action) {
  window[action]('keydown', onKeydown);
  window[action]('blur', onBlur);
  window[action]('keyup', onKeyup);
  escDown = false;
}

function addEscapeKey(fn) {
  if (client.is.desktop) {
    handlers$1.push(fn);

    if (handlers$1.length === 1) {
      update('addEventListener');
    }
  }
}

function removeEscapeKey(fn) {
  const index = handlers$1.indexOf(fn);
  if (index !== -1) {
    handlers$1.splice(index, 1);

    if (handlers$1.length === 0) {
      update('removeEventListener');
    }
  }
}

const handlers = [];

function trigger(e) {
  handlers.at(-1)(e);
}

function addFocusout(fn) {
  if (client.is.desktop) {
    handlers.push(fn);

    if (handlers.length === 1) {
      document.body.addEventListener('focusin', trigger);
    }
  }
}

function removeFocusout(fn) {
  const index = handlers.indexOf(fn);
  if (index !== -1) {
    handlers.splice(index, 1);

    if (handlers.length === 0) {
      document.body.removeEventListener('focusin', trigger);
    }
  }
}

function createUidFn() {
  if (typeof crypto === 'undefined') {
    return () => {
      throw new Error(
        '[Quasar uid()] Secure RNG not available. Cannot generate collision-resistant UUID.'
      )
    }
  }

  // Fast Path: Native C++/Rust implementation (Node.js & HTTPS Browsers)
  if (crypto.randomUUID) return () => crypto.randomUUID()

  // Pre-compute hex map for the HTTP fallback
  const hex = Array.from({ length: 256 }, (_, i) =>
    (i + 0x1_00).toString(16).slice(1)
  );
  let buf, bufIdx;

  return () => {
    if (buf === void 0 || bufIdx + 16 > 4096) {
      bufIdx = 0;
      buf = new Uint8Array(4096);
      crypto.getRandomValues(buf);
    }

    const i = bufIdx;
    bufIdx += 16;

    // Set UUIDv4 version (4) and variant (8, 9, a, or b)
    buf[i + 6] = (buf[i + 6] & 0x0f) | 0x40;
    buf[i + 8] = (buf[i + 8] & 0x3f) | 0x80;

    return (
      hex[buf[i]] +
      hex[buf[i + 1]] +
      hex[buf[i + 2]] +
      hex[buf[i + 3]] +
      '-' +
      hex[buf[i + 4]] +
      hex[buf[i + 5]] +
      '-' +
      hex[buf[i + 6]] +
      hex[buf[i + 7]] +
      '-' +
      hex[buf[i + 8]] +
      hex[buf[i + 9]] +
      '-' +
      hex[buf[i + 10]] +
      hex[buf[i + 11]] +
      hex[buf[i + 12]] +
      hex[buf[i + 13]] +
      hex[buf[i + 14]] +
      hex[buf[i + 15]]
    )
  }
}

const uid = createUidFn();

function parseValue(val) {
  return val === void 0 || val === null ? null : val
}

function getId(val, required) {
  return val === void 0 || val === null ? (required ? `f_${uid()}` : null) : val
}

/**
 * Returns an "id" which is a ref() that can be used as
 * a unique identifier to apply to a DOM node attribute.
 *
 * On SSR/SSG, it takes care of generating the id on the client side (only) to
 * avoid hydration errors.
 */
function useId({ getValue, required = true } = {}) {
  if (isRuntimeSsrPreHydration.value) {
    const id = getValue !== void 0 ? ref(parseValue(getValue())) : ref(null);

    if (required && id.value === null) {
      onMounted(() => {
        id.value = `f_${uid()}`; // getId(null, true)
      });
    }

    if (getValue !== void 0) {
      watch(getValue, newId => {
        id.value = getId(newId, required);
      });
    }

    return id
  }

  return getValue !== void 0
    ? computed(() => getId(getValue(), required))
    : ref(`f_${uid()}`) // getId(null, true)
}

const useFormProps = {
  name: String
};

function useFormInject(formAttrs = {}) {
  return (child, action, className) => {
    child[action](
      h('input', {
        class: 'hidden' + (className || ''),
        ...formAttrs.value
      })
    );
  }
}

function useFormInputNameAttr(props) {
  return computed(() => props.name || props.for)
}

// file referenced from docs

const hexRE = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/,
  hexaRE = /^#[0-9a-fA-F]{4}([0-9a-fA-F]{4})?$/,
  hexOrHexaRE =
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
  rgbRE =
    /^rgb\(((0|[1-9][\d]?|1[\d]{0,2}|2[\d]?|2[0-4][\d]|25[0-5]),){2}(0|[1-9][\d]?|1[\d]{0,2}|2[\d]?|2[0-4][\d]|25[0-5])\)$/,
  rgbaRE =
    /^rgba\(((0|[1-9][\d]?|1[\d]{0,2}|2[\d]?|2[0-4][\d]|25[0-5]),){2}(0|[1-9][\d]?|1[\d]{0,2}|2[\d]?|2[0-4][\d]|25[0-5]),(0(\.[\d]+)?|1(\.0+)?)\)$/,
  dateRE = /^-?[\d]+\/(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])$/,
  timeRE = /^([0-1]?\d|2[0-3]):[0-5]\d$/,
  fulltimeRE = /^([0-1]?\d|2[0-3]):[0-5]\d:[0-5]\d$/,
  timeOrFulltimeRE = /^([0-1]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
  emailRE =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// Keep in sync with ui/types/api/validation.d.ts
const testPattern = {
  date: v => dateRE.test(v),
  time: v => timeRE.test(v),
  fulltime: v => fulltimeRE.test(v),
  timeOrFulltime: v => timeOrFulltimeRE.test(v),

  // -- RFC 5322 --
  // -- Added in v2.6.6 --
  // This is a basic helper validation.
  // For something more complex (like RFC 822) you should write and use your own rule.
  // We won't be accepting PRs to enhance the one below because of the reason above.
  email: v => emailRE.test(v),

  hexColor: v => hexRE.test(v),
  hexaColor: v => hexaRE.test(v),
  hexOrHexaColor: v => hexOrHexaRE.test(v),

  rgbColor: v => rgbRE.test(v),
  rgbaColor: v => rgbaRE.test(v),
  rgbOrRgbaColor: v => rgbRE.test(v) || rgbaRE.test(v),

  hexOrRgbColor: v => hexRE.test(v) || rgbRE.test(v),
  hexaOrRgbaColor: v => hexaRE.test(v) || rgbaRE.test(v),
  anyColor: v => hexOrHexaRE.test(v) || rgbRE.test(v) || rgbaRE.test(v)
};

function useHistory(showing, hide, hideOnRouteChange) {
  let historyEntry;

  function removeFromHistory() {
    if (historyEntry !== void 0) {
      History.remove(historyEntry);
      historyEntry = void 0;
    }
  }

  onBeforeUnmount(() => {
    if (showing.value) removeFromHistory();
  });

  return {
    removeFromHistory,

    addToHistory() {
      historyEntry = {
        condition: () => hideOnRouteChange.value,
        handler: hide
      };

      History.add(historyEntry);
    }
  }
}

let registered = 0,
  scrollPositionX,
  scrollPositionY,
  maxScrollTop,
  vpPendingUpdate = false,
  bodyLeft,
  bodyTop,
  routePath,
  closeTimer = null;

function onAppleScroll(e) {
  if (e.target === document) {
    // required, otherwise iOS blocks further scrolling
    // until the mobile scrollbar dissappears
    document.scrollingElement.scrollTop = document.scrollingElement.scrollTop; // oxlint-disable-line
  }
}

function onAppleResize(evt) {
  if (vpPendingUpdate) return

  vpPendingUpdate = true;

  requestAnimationFrame(() => {
    vpPendingUpdate = false;

    const { height } = evt.target,
      { clientHeight, scrollTop } = document.scrollingElement;

    if (maxScrollTop === void 0 || height !== window.innerHeight) {
      maxScrollTop = clientHeight - height;
      document.scrollingElement.scrollTop = scrollTop;
    }

    if (scrollTop > maxScrollTop) {
      document.scrollingElement.scrollTop -= Math.ceil(
        (scrollTop - maxScrollTop) / 8
      );
    }
  });
}

function apply(action) {
  const body = document.body,
    hasViewport = window.visualViewport !== void 0;

  if (action === 'add') {
    const { overflowY, overflowX } = window.getComputedStyle(body);

    scrollPositionX = getHorizontalScrollPosition(window);
    scrollPositionY = getVerticalScrollPosition(window);
    bodyLeft = body.style.left;
    bodyTop = body.style.top;

    routePath = window.location.pathname;

    body.style.left = `-${scrollPositionX}px`;
    body.style.top = `-${scrollPositionY}px`;

    if (
      overflowX !== 'hidden' &&
      (overflowX === 'scroll' || body.scrollWidth > window.innerWidth)
    ) {
      body.classList.add('q-body--force-scrollbar-x');
    }
    if (
      overflowY !== 'hidden' &&
      (overflowY === 'scroll' || body.scrollHeight > window.innerHeight)
    ) {
      body.classList.add('q-body--force-scrollbar-y');
    }

    document.documentElement.classList.add('q-document--prevent-scroll');
    document.qScrollPrevented = true;

    if (client.is.ios) {
      if (hasViewport) {
        window.scrollTo(0, 0);
        window.visualViewport.addEventListener(
          'resize',
          onAppleResize,
          listenOpts.passiveCapture
        );
        window.visualViewport.addEventListener(
          'scroll',
          onAppleResize,
          listenOpts.passiveCapture
        );
        window.scrollTo(0, 0);
      } else {
        window.addEventListener(
          'scroll',
          onAppleScroll,
          listenOpts.passiveCapture
        );
      }
    }
  } else {
    // action === 'remove'

    if (client.is.ios) {
      if (hasViewport) {
        window.visualViewport.removeEventListener(
          'resize',
          onAppleResize,
          listenOpts.passiveCapture
        );
        window.visualViewport.removeEventListener(
          'scroll',
          onAppleResize,
          listenOpts.passiveCapture
        );
      } else {
        window.removeEventListener(
          'scroll',
          onAppleScroll,
          listenOpts.passiveCapture
        );
      }
    }

    document.documentElement.classList.remove('q-document--prevent-scroll');
    body.classList.remove(
      'q-body--force-scrollbar-x',
      'q-body--force-scrollbar-y'
    );

    document.qScrollPrevented = false;

    body.style.left = bodyLeft;
    body.style.top = bodyTop;

    // scroll back only if route path has not changed
    if (window.location.pathname === routePath) {
      window.scrollTo(scrollPositionX, scrollPositionY);
    }

    maxScrollTop = void 0;
  }
}

function preventScroll(state) {
  let action = 'add';

  if (state === true) {
    registered++;

    if (closeTimer !== null) {
      clearTimeout(closeTimer);
      closeTimer = null;
      return
    }

    if (registered > 1) return
  } else {
    if (registered === 0) return

    registered--;

    if (registered > 0) return

    action = 'remove';

    if (client.is.ios && client.is.nativeMobile) {
      if (closeTimer !== null) clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        apply(action);
        closeTimer = null;
      }, 100);
      return
    }
  }

  apply(action);
}

function usePreventScroll() {
  let currentState;

  return {
    preventBodyScroll(state) {
      if (state !== currentState && (currentState !== void 0 || state)) {
        currentState = state;
        preventScroll(state);
      }
    }
  }
}

let maximizedModals = 0;

const positionClass = {
  standard: 'fixed-full flex-center',
  top: 'fixed-top justify-center',
  bottom: 'fixed-bottom justify-center',
  right: 'fixed-right items-center',
  left: 'fixed-left items-center'
};

const defaultTransitions = {
  standard: ['scale', 'scale'],
  top: ['slide-down', 'slide-up'],
  bottom: ['slide-up', 'slide-down'],
  right: ['slide-left', 'slide-right'],
  left: ['slide-right', 'slide-left']
};

const QDialog = createComponent({
  name: 'QDialog',

  inheritAttrs: false,

  props: {
    ...useModelToggleProps,
    ...useTransitionProps,

    transitionShow: String, // override useTransitionProps
    transitionHide: String, // override useTransitionProps

    persistent: Boolean,
    autoClose: Boolean,
    allowFocusOutside: Boolean,

    noEscDismiss: Boolean,
    noBackdropDismiss: Boolean,
    noRouteDismiss: Boolean,
    noRefocus: Boolean,
    noFocus: Boolean,
    noShake: Boolean,

    seamless: Boolean,

    maximized: Boolean,
    fullWidth: Boolean,
    fullHeight: Boolean,

    square: Boolean,

    backdropFilter: String,

    position: {
      type: String,
      default: 'standard',
      validator: val =>
        ['standard', 'top', 'bottom', 'left', 'right'].includes(val)
    }
  },

  emits: [...useModelToggleEmits, 'shake', 'click', 'escapeKey'],

  setup(props, { slots, emit, attrs }) {
    const vm = getCurrentInstance();

    const innerRef = ref(null);
    const showing = ref(false);
    const animating = ref(false);

    let shakeTimeout = null,
      refocusTarget = null,
      isMaximized = false,
      avoidAutoClose = false;

    const hideOnRouteChange = computed(
      () => !props.persistent && !props.noRouteDismiss && !props.seamless
    );

    const { preventBodyScroll } = usePreventScroll();
    const { registerTimeout } = useTimeout();
    const { registerTick, removeTick } = useTick();

    const { transitionStyle } = useTransition(
      props,
      () => defaultTransitions[props.position][0],
      () => defaultTransitions[props.position][1]
    );

    computed(
      () =>
        transitionStyle.value +
        (props.backdropFilter !== void 0
          ? // Safari requires the -webkit prefix
            `;backdrop-filter:${props.backdropFilter};-webkit-backdrop-filter:${props.backdropFilter}`
          : '')
    );

    const { showPortal, hidePortal, portalIsAccessible, renderPortal } =
      usePortal();

    const { hide } = useModelToggle({
      showing,
      hideOnRouteChange,
      handleShow,
      handleHide,
      handleRouteChange,
      processOnMount: true
    });

    const { addToHistory, removeFromHistory } = useHistory(
      showing,
      hide,
      hideOnRouteChange
    );

    computed(
      () =>
        'q-dialog__inner flex no-pointer-events' +
        ` q-dialog__inner--${props.maximized ? 'maximized' : 'minimized'}` +
        ` q-dialog__inner--${props.position} ${positionClass[props.position]}` +
        (animating.value ? ' q-dialog__inner--animating' : '') +
        (props.fullWidth ? ' q-dialog__inner--fullwidth' : '') +
        (props.fullHeight ? ' q-dialog__inner--fullheight' : '') +
        (props.square ? ' q-dialog__inner--square' : '')
    );

    const useBackdrop = computed(() => showing.value && !props.seamless);

    computed(() =>
      props.autoClose ? { onClick: onAutoClose } : {}
    );

    computed(() => [
      'q-dialog fullscreen no-pointer-events ' +
        `q-dialog--${useBackdrop.value ? 'modal' : 'seamless'}`,
      attrs.class
    ]);

    watch(
      () => props.maximized,
      state => {
        if (showing.value) updateMaximized(state);
      }
    );

    watch(useBackdrop, val => {
      preventBodyScroll(val);

      if (val) {
        addFocusout(onFocusChange);
        addEscapeKey(onEscapeKey);
      } else {
        removeFocusout(onFocusChange);
        removeEscapeKey(onEscapeKey);
      }
    });

    function handleShow(evt) {
      addToHistory();

      refocusTarget =
        !props.noRefocus && document.activeElement !== null
          ? document.activeElement
          : null;

      updateMaximized(props.maximized);
      showPortal();
      animating.value = true;

      if (props.noFocus) removeTick();
      else {
        document.activeElement?.blur();
        registerTick(focus);
      }

      // should removeTimeout() if this gets removed
      registerTimeout(() => {
        if (vm.proxy.$q.platform.is.ios) {
          if (!props.seamless && document.activeElement) {
            const { top, bottom } =
                document.activeElement.getBoundingClientRect(),
              { innerHeight } = window,
              height =
                window.visualViewport !== void 0
                  ? window.visualViewport.height
                  : innerHeight;

            if (top > 0 && bottom > height / 2) {
              document.scrollingElement.scrollTop = Math.min(
                document.scrollingElement.scrollHeight - height,
                bottom >= innerHeight
                  ? Infinity
                  : Math.ceil(
                      document.scrollingElement.scrollTop + bottom - height / 2
                    )
              );
            }

            document.activeElement.scrollIntoView();
          }

          // required in order to avoid the "double-tap needed" issue
          avoidAutoClose = true;
          innerRef.value.click();
          avoidAutoClose = false;
        }

        showPortal(true); // done showing portal
        animating.value = false;
        emit('show', evt);
      }, props.transitionDuration);
    }

    function handleHide(evt) {
      removeTick();
      removeFromHistory();
      cleanup(true);
      animating.value = true;
      hidePortal();

      if (refocusTarget !== null) {
        const target =
          (evt?.type.indexOf('key') === 0
            ? refocusTarget.closest('[tabindex]:not([tabindex^="-"])')
            : void 0) || refocusTarget;

        refocusTarget = null;
        addFocusFn(() => {
          if (target.isConnected) target.focus();
        });
      }

      // should removeTimeout() if this gets removed
      registerTimeout(() => {
        hidePortal(true); // done hiding, now destroy
        animating.value = false;
        emit('hide', evt);
      }, props.transitionDuration);
    }

    function handleRouteChange() {
      refocusTarget = null;
    }

    function focus(selector) {
      addFocusFn(() => {
        let node = innerRef.value;

        if (node === null) return

        if (selector !== void 0) {
          const target = node.querySelector(selector);
          if (target !== null) {
            target.focus({ preventScroll: true });
            return
          }
        }

        if (!node.contains(document.activeElement)) {
          node =
            node.querySelector(
              '[autofocus][tabindex], [data-autofocus][tabindex]'
            ) ||
            node.querySelector(
              '[autofocus] [tabindex], [data-autofocus] [tabindex]'
            ) ||
            node.querySelector('[autofocus], [data-autofocus]') ||
            node;

          node.focus({ preventScroll: true });
        }
      });
    }

    function shake(focusTarget) {
      if (focusTarget && typeof focusTarget.focus === 'function') {
        focusTarget.focus({ preventScroll: true });
      } else {
        focus();
      }

      emit('shake');

      const node = innerRef.value;

      if (node !== null) {
        node.classList.remove('q-animate--scale');
        node.classList.add('q-animate--scale');
        if (shakeTimeout !== null) clearTimeout(shakeTimeout);
        shakeTimeout = setTimeout(() => {
          shakeTimeout = null;
          if (innerRef.value !== null) {
            node.classList.remove('q-animate--scale');
            // some platforms (like desktop Chrome)
            // require calling focus() again
            focus();
          }
        }, 170);
      }
    }

    function onEscapeKey() {
      if (!props.seamless) {
        if (props.persistent || props.noEscDismiss) {
          if (!props.maximized && !props.noShake) shake();
        } else {
          emit('escapeKey');
          hide();
        }
      }
    }

    function cleanup(hiding) {
      if (shakeTimeout !== null) {
        clearTimeout(shakeTimeout);
        shakeTimeout = null;
      }

      if (hiding || showing.value) {
        updateMaximized(false);

        if (!props.seamless) {
          preventBodyScroll(false);
          removeFocusout(onFocusChange);
          removeEscapeKey(onEscapeKey);
        }
      }

      if (!hiding) {
        refocusTarget = null;
      }
    }

    function updateMaximized(active) {
      if (active) {
        if (!isMaximized) {
          if (maximizedModals < 1) {
            document.body.classList.add('q-body--dialog');
          }
          maximizedModals++;

          isMaximized = true;
        }
      } else if (isMaximized) {
        if (maximizedModals < 2) {
          document.body.classList.remove('q-body--dialog');
        }

        maximizedModals--;
        isMaximized = false;
      }
    }

    function onAutoClose(e) {
      if (!avoidAutoClose) {
        hide(e);
        emit('click', e);
      }
    }

    function onFocusChange(evt) {
      // the focus is not in a vue child component
      if (
        !props.allowFocusOutside &&
        portalIsAccessible.value &&
        !childHasFocus(innerRef.value, evt.target)
      ) {
        focus('[tabindex]:not([tabindex="-1"])');
      }
    }

    Object.assign(vm.proxy, {
      // expose public methods
      focus,
      shake,

      // private but needed by QSelect
      __updateRefocusTarget(target) {
        refocusTarget = target || null;
      }
    });

    onBeforeUnmount(cleanup);

    return renderPortal
  }
});

const listenerRE = /^on[A-Z]/;

function useSplitAttrs() {
  const vm = getCurrentInstance();
  const { attrs } = vm;

  const acc = {
    listeners: ref({}),
    attributes: ref({})
  };

  function update() {
    const attributes = {};
    const listeners = {};

    for (const key in attrs) {
      if (key !== 'class' && key !== 'style' && !listenerRE.test(key)) {
        attributes[key] = attrs[key];
      }
    }

    for (const key in vm.vnode.props) {
      if (listenerRE.test(key)) {
        listeners[key] = vm.vnode.props[key];
      }
    }

    acc.attributes.value = attributes;
    acc.listeners.value = listeners;
  }

  onBeforeUpdate(update);

  update();

  return acc
}

function useFormChild({
  validate,
  resetValidation,
  requiresQForm
}) {
  const $form = inject(formKey, false);

  if ($form !== false) {
    const { props, proxy } = getCurrentInstance();

    // export public method (so it can be used in QForm)
    Object.assign(proxy, { validate, resetValidation });

    watch(
      () => props.disable,
      val => {
        if (val) {
          if (typeof resetValidation === 'function') resetValidation();
          $form.unbindComponent(proxy);
        } else {
          $form.bindComponent(proxy);
        }
      }
    );

    onMounted(() => {
      // register to parent QForm
      if (!props.disable) $form.bindComponent(proxy);
    });

    onBeforeUnmount(() => {
      // un-register from parent QForm
      if (!props.disable) $form.unbindComponent(proxy);
    });
  } else if (requiresQForm) {
    console.error('Parent QForm not found on useFormChild()!');
  }
}

const lazyRulesValues = [true, false, 'ondemand'];

const useValidateProps = {
  modelValue: {},

  error: {
    type: Boolean,
    default: null
  },
  errorMessage: String,
  noErrorIcon: Boolean,

  rules: Array,
  reactiveRules: Boolean,
  lazyRules: {
    type: [Boolean, String],
    default: false, // statement unneeded but avoids future vue implementation changes
    validator: v => lazyRulesValues.includes(v)
  }
};

function useValidate(focused, innerLoading) {
  const { props, proxy } = getCurrentInstance();

  const innerError = ref(false);
  const innerErrorMessage = ref(null);
  const isDirtyModel = ref(false);

  useFormChild({ validate, resetValidation });

  let validateIndex = 0,
    unwatchRules;

  const hasRules = computed(
    () =>
      props.rules !== void 0 && props.rules !== null && props.rules.length !== 0
  );

  const canDebounceValidate = computed(
    () =>
      !props.disable &&
      hasRules.value &&
      // Should not have a validation in progress already;
      // It might mean that focus switched to submit btn and
      // QForm's submit() has been called already (ENTER key)
      !innerLoading.value
  );

  const hasError = computed(() => props.error === true || innerError.value);

  const errorMessage = computed(() =>
    typeof props.errorMessage === 'string' && props.errorMessage.length !== 0
      ? props.errorMessage
      : innerErrorMessage.value
  );

  watch(
    () => props.modelValue,
    () => {
      isDirtyModel.value = true;

      if (
        canDebounceValidate.value &&
        // trigger validation if not using any kind of lazy-rules
        props.lazyRules === false
      ) {
        debouncedValidate();
      }
    }
  );

  function onRulesChange() {
    if (
      props.lazyRules !== 'ondemand' &&
      canDebounceValidate.value &&
      isDirtyModel.value
    ) {
      debouncedValidate();
    }
  }

  watch(
    () => props.reactiveRules,
    val => {
      if (val) {
        if (unwatchRules === void 0) {
          unwatchRules = watch(() => props.rules, onRulesChange, {
            immediate: true,
            deep: true
          });
        }
      } else if (unwatchRules !== void 0) {
        unwatchRules();
        unwatchRules = void 0;
      }
    },
    { immediate: true }
  );

  watch(() => props.lazyRules, onRulesChange);

  watch(focused, val => {
    if (val) {
      isDirtyModel.value = true;
    } else if (canDebounceValidate.value && props.lazyRules !== 'ondemand') {
      debouncedValidate();
    }
  });

  function resetValidation() {
    validateIndex++;
    innerLoading.value = false;
    isDirtyModel.value = false;
    innerError.value = false;
    innerErrorMessage.value = null;
    debouncedValidate.cancel();
  }

  /*
   * Return value
   *   - true (validation succeeded)
   *   - false (validation failed)
   *   - Promise (pending async validation)
   */
  function validate(val = props.modelValue) {
    if (props.disable || !hasRules.value) return true

    const index = ++validateIndex;
    const setDirty = innerLoading.value
      ? () => {}
      : () => {
          isDirtyModel.value = true;
        };

    const update = (hasErr, msg) => {
      if (hasErr) setDirty();

      innerError.value = hasErr;
      innerErrorMessage.value = msg || null;
      innerLoading.value = false;
    };

    const promises = [];

    for (let i = 0; i < props.rules.length; i++) {
      const rule = props.rules[i];
      let res;

      if (typeof rule === 'function') {
        res = rule(val, testPattern);
      } else if (typeof rule === 'string' && testPattern[rule] !== void 0) {
        res = testPattern[rule](val);
      }

      if (res === false || typeof res === 'string') {
        update(true, res);
        return false
      } else if (res !== true && res !== void 0) {
        promises.push(res);
      }
    }

    if (promises.length === 0) {
      update(false);
      return true
    }

    innerLoading.value = true;

    return Promise.all(promises).then(
      res => {
        if (res === void 0 || !Array.isArray(res) || res.length === 0) {
          if (index === validateIndex) update(false);
          return true
        }

        const msg = res.find(r => r === false || typeof r === 'string');
        if (index === validateIndex) update(msg !== void 0, msg);
        return msg === void 0
      },
      err => {
        if (index === validateIndex) {
          console.error(err);
          update(true);
        }

        return false
      }
    )
  }

  const debouncedValidate = debounce(validate, 0);

  onBeforeUnmount(() => {
    unwatchRules?.();
    debouncedValidate.cancel();
  });

  // expose public methods & props
  Object.assign(proxy, { resetValidation, validate });
  injectProp(proxy, 'hasError', () => hasError.value);

  return {
    isDirtyModel,
    hasRules,
    hasError,
    errorMessage,

    validate,
    resetValidation
  }
}

function fieldValueIsFilled(val) {
  return val !== void 0 && val !== null && String(val).length !== 0
}

const useNonInputFieldProps = {
  ...useDarkProps,
  ...useValidateProps,

  label: String,
  stackLabel: Boolean,
  hint: String,
  hideHint: Boolean,
  prefix: String,
  suffix: String,

  labelColor: String,
  color: String,
  bgColor: String,

  filled: Boolean,
  outlined: Boolean,
  borderless: Boolean,
  standout: [Boolean, String],

  square: Boolean,

  loading: Boolean,

  labelSlot: Boolean,

  bottomSlots: Boolean,
  hideBottomSpace: Boolean,

  rounded: Boolean,
  dense: Boolean,
  itemAligned: Boolean,

  counter: Boolean,

  clearable: Boolean,
  clearIcon: String,

  disable: Boolean,
  readonly: Boolean,

  autofocus: Boolean,

  for: String
};

const useFieldProps = {
  ...useNonInputFieldProps,
  maxlength: [Number, String]
};

const useFieldEmits = ['update:modelValue', 'clear', 'focus', 'blur'];

function useFieldState({
  requiredForAttr = true,
  tagProp,
  changeEvent = false
} = {}) {
  const { props, proxy } = getCurrentInstance();

  const isDark = useDark(props, proxy.$q);
  const targetUid = useId({
    required: requiredForAttr,
    getValue: () => props.for
  });

  return {
    requiredForAttr,
    changeEvent,
    tag: tagProp ? computed(() => props.tag) : { value: 'label' },

    isDark,

    editable: computed(() => !props.disable && !props.readonly),

    innerLoading: ref(false),
    focused: ref(false),
    hasPopupOpen: false,

    splitAttrs: useSplitAttrs(),
    targetUid,

    rootRef: ref(null),
    targetRef: ref(null),
    controlRef: ref(null)

    /**
     * user supplied additionals:

     * innerValue - computed
     * floatingLabel - computed
     * inputRef - computed

     * fieldClass - computed
     * hasShadow - computed

     * controlEvents - Object with fn(e)

     * getControl - fn
     * getInnerAppend - fn
     * getControlChild - fn
     * getShadowControl - fn
     * showPopup - fn
     */
  }
}

function getInnerAppendNode(key, content) {
  return content === null
    ? null
    : h(
        'div',
        {
          key,
          class:
            'q-field__append q-field__marginal row no-wrap items-center q-anchor--skip'
        },
        content
      )
}

function useField(state) {
  const { props, emit, slots, attrs, proxy } = getCurrentInstance();
  const { $q } = proxy;

  let focusoutTimer = null;

  if (state.hasValue === void 0) {
    state.hasValue = computed(() => fieldValueIsFilled(props.modelValue));
  }

  if (state.emitValue === void 0) {
    state.emitValue = value => {
      emit('update:modelValue', value);
    };
  }

  if (state.controlEvents === void 0) {
    state.controlEvents = {
      onFocusin: onControlFocusin,
      onFocusout: onControlFocusout
    };
  }

  Object.assign(state, {
    clearValue,
    onControlFocusin,
    onControlFocusout,
    focus
  });

  if (state.computedCounter === void 0) {
    state.computedCounter = computed(() => {
      if (props.counter) {
        const len =
          typeof props.modelValue === 'string' ||
          typeof props.modelValue === 'number'
            ? String(props.modelValue).length
            : Array.isArray(props.modelValue)
              ? props.modelValue.length
              : 0;

        const max =
          props.maxlength !== void 0 ? props.maxlength : props.maxValues;

        return len + (max !== void 0 ? ' / ' + max : '')
      }
    });
  }

  const { isDirtyModel, hasRules, hasError, errorMessage, resetValidation } =
    useValidate(state.focused, state.innerLoading);

  const floatingLabel =
    state.floatingLabel !== void 0
      ? computed(
          () =>
            props.stackLabel || state.focused.value || state.floatingLabel.value
        )
      : computed(
          () => props.stackLabel || state.focused.value || state.hasValue.value
        );

  const shouldRenderBottom = computed(
    () =>
      props.bottomSlots ||
      props.hint !== void 0 ||
      hasRules.value ||
      props.counter ||
      props.error !== null
  );

  const styleType = computed(() => {
    if (props.filled) return 'filled'
    if (props.outlined) return 'outlined'
    if (props.borderless) return 'borderless'
    if (props.standout) return 'standout'
    return 'standard'
  });

  const classes = computed(
    () =>
      `q-field row no-wrap items-start q-field--${styleType.value}` +
      (state.fieldClass !== void 0 ? ` ${state.fieldClass.value}` : '') +
      (props.rounded ? ' q-field--rounded' : '') +
      (props.square ? ' q-field--square' : '') +
      (floatingLabel.value ? ' q-field--float' : '') +
      (hasLabel.value ? ' q-field--labeled' : '') +
      (props.dense ? ' q-field--dense' : '') +
      (props.itemAligned ? ' q-field--item-aligned q-item-type' : '') +
      (state.isDark.value ? ' q-field--dark' : '') +
      (state.getControl === void 0 ? ' q-field--auto-height' : '') +
      (state.focused.value ? ' q-field--focused' : '') +
      (hasError.value ? ' q-field--error' : '') +
      (hasError.value || state.focused.value ? ' q-field--highlighted' : '') +
      (!props.hideBottomSpace && shouldRenderBottom.value
        ? ' q-field--with-bottom'
        : '') +
      (props.disable
        ? ' q-field--disabled'
        : props.readonly
          ? ' q-field--readonly'
          : '')
  );

  const contentClass = computed(
    () =>
      'q-field__control relative-position row no-wrap' +
      (props.bgColor !== void 0 ? ` bg-${props.bgColor}` : '') +
      (hasError.value
        ? ' text-negative'
        : typeof props.standout === 'string' &&
            props.standout.length !== 0 &&
            state.focused.value
          ? ` ${props.standout}`
          : props.color !== void 0
            ? ` text-${props.color}`
            : '')
  );

  const hasLabel = computed(() => props.labelSlot || props.label !== void 0);

  const labelClass = computed(
    () =>
      'q-field__label no-pointer-events absolute ellipsis' +
      (props.labelColor !== void 0 && !hasError.value
        ? ` text-${props.labelColor}`
        : '')
  );

  const controlSlotScope = computed(() => ({
    id: state.targetUid.value,
    editable: state.editable.value,
    focused: state.focused.value,
    floatingLabel: floatingLabel.value,
    modelValue: props.modelValue,
    emitValue: state.emitValue
  }));

  const attributes = computed(() => {
    const acc = {};

    if (state.targetUid.value) {
      acc.for = state.targetUid.value;
    }

    if (props.disable) {
      acc['aria-disabled'] = 'true';
    }

    return acc
  });

  function focusHandler() {
    const el = document.activeElement;
    let target = state.targetRef?.value;

    if (target && (el === null || el.id !== state.targetUid.value)) {
      if (!target.hasAttribute('tabindex')) {
        target = target.querySelector('[tabindex]');
      }

      if (target !== el) {
        target?.focus({ preventScroll: true });
      }
    }
  }

  function focus() {
    addFocusFn(focusHandler);
  }

  function blur() {
    removeFocusFn(focusHandler);
    const el = document.activeElement;
    if (el !== null && state.rootRef.value.contains(el)) {
      el.blur();
    }
  }

  function onControlFocusin(e) {
    if (focusoutTimer !== null) {
      clearTimeout(focusoutTimer);
      focusoutTimer = null;
    }

    if (state.editable.value && !state.focused.value) {
      state.focused.value = true;
      emit('focus', e);
    }
  }

  function onControlFocusout(e, then) {
    if (focusoutTimer !== null) clearTimeout(focusoutTimer);
    focusoutTimer = setTimeout(() => {
      focusoutTimer = null;

      if (
        document.hasFocus() &&
        (state.hasPopupOpen ||
          state.controlRef === void 0 ||
          state.controlRef.value === null ||
          state.controlRef.value.contains(document.activeElement))
      ) {
        return
      }

      if (state.focused.value) {
        state.focused.value = false;
        emit('blur', e);
      }

      then?.();
    }, 0);
  }

  function clearValue(e) {
    // prevent activating the field but keep focus on desktop
    stopAndPrevent(e);

    if (!$q.platform.is.mobile) {
      const el = state.targetRef?.value || state.rootRef.value;
      el.focus();
    } else if (state.rootRef.value.contains(document.activeElement)) {
      document.activeElement.blur();
    }

    if (props.type === 'file') {
      // do not let focus be triggered
      // as it will make the native file dialog
      // appear for another selection
      state.inputRef.value.value = null;
    }

    state.onClear?.();

    emit('update:modelValue', null);
    if (state.changeEvent) emit('change', null);
    emit('clear', props.modelValue);

    nextTick(() => {
      const isDirty = isDirtyModel.value;
      resetValidation();
      isDirtyModel.value = isDirty;
    });
  }

  function onClearableKeyup(evt) {
    if ([13, 32].includes(evt.keyCode)) clearValue(evt);
  }

  function getContent() {
    const node = [];

    if (slots.prepend !== void 0) {
      node.push(
        h(
          'div',
          {
            class:
              'q-field__prepend q-field__marginal row no-wrap items-center',
            key: 'prepend',
            onClick: prevent
          },
          slots.prepend()
        )
      );
    }

    node.push(
      h(
        'div',
        {
          class:
            'q-field__control-container col relative-position row no-wrap q-anchor--skip'
        },
        getControlContainer()
      )
    );

    if (hasError.value && !props.noErrorIcon) {
      node.push(
        getInnerAppendNode('error', [
          h(QIcon, { name: $q.iconSet.field.error, color: 'negative' })
        ])
      );
    }

    if (props.loading || state.innerLoading.value) {
      node.push(
        getInnerAppendNode(
          'inner-loading-append',
          slots.loading !== void 0
            ? slots.loading()
            : [h(QSpinner, { color: props.color })]
        )
      );
    } else if (
      props.clearable &&
      state.hasValue.value &&
      state.editable.value
    ) {
      node.push(
        getInnerAppendNode('inner-clearable-append', [
          h(QIcon, {
            class: 'q-field__focusable-action',
            name: props.clearIcon || $q.iconSet.field.clear,
            tabindex: 0,
            role: 'button',
            'aria-hidden': 'false',
            'aria-label': $q.lang.label.clear,
            onKeyup: onClearableKeyup,
            onClick: clearValue
          })
        ])
      );
    }

    if (slots.append !== void 0) {
      node.push(
        h(
          'div',
          {
            class: 'q-field__append q-field__marginal row no-wrap items-center',
            key: 'append',
            onClick: prevent
          },
          slots.append()
        )
      );
    }

    if (state.getInnerAppend !== void 0) {
      node.push(getInnerAppendNode('inner-append', state.getInnerAppend()));
    }

    if (state.getControlChild !== void 0) {
      node.push(state.getControlChild());
    }

    return node
  }

  function getControlContainer() {
    const node = [];

    if (props.prefix !== void 0 && props.prefix !== null) {
      node.push(
        h(
          'div',
          {
            class: 'q-field__prefix no-pointer-events row items-center'
          },
          props.prefix
        )
      );
    }

    if (state.getShadowControl !== void 0 && state.hasShadow.value) {
      node.push(state.getShadowControl());
    }

    if (hasLabel.value) {
      node.push(
        h(
          'div',
          {
            class: labelClass.value
          },
          hSlot(slots.label, props.label)
        )
      );
    }

    if (state.getControl !== void 0) {
      node.push(state.getControl());
    }
    // internal usage only:
    else if (slots.rawControl !== void 0) {
      node.push(slots.rawControl());
    } else if (slots.control !== void 0) {
      node.push(
        h(
          'div',
          {
            ref: state.targetRef,
            class: 'q-field__native row',
            tabindex: -1,
            ...state.splitAttrs.attributes.value,
            'data-autofocus': props.autofocus || void 0
          },
          slots.control(controlSlotScope.value)
        )
      );
    }

    if (props.suffix !== void 0 && props.suffix !== null) {
      node.push(
        h(
          'div',
          {
            class: 'q-field__suffix no-pointer-events row items-center'
          },
          props.suffix
        )
      );
    }

    // oxlint-disable-next-line unicorn/prefer-spread
    return node.concat(hSlot(slots.default))
  }

  function getBottom() {
    let msg, key;

    if (hasError.value) {
      if (errorMessage.value !== null) {
        msg = [h('div', { role: 'alert' }, errorMessage.value)];
        key = `q--slot-error-${errorMessage.value}`;
      } else {
        msg = hSlot(slots.error);
        key = 'q--slot-error';
      }
    } else if (!props.hideHint || state.focused.value) {
      if (props.hint !== void 0) {
        msg = [h('div', props.hint)];
        key = `q--slot-hint-${props.hint}`;
      } else {
        msg = hSlot(slots.hint);
        key = 'q--slot-hint';
      }
    }

    const hasCounter = props.counter || slots.counter !== void 0;

    if (props.hideBottomSpace && !hasCounter && msg === void 0) {
      return
    }

    const main = h(
      'div',
      {
        key,
        class: 'q-field__messages col'
      },
      msg
    );

    return h(
      'div',
      {
        class:
          'q-field__bottom row items-start q-field__bottom--' +
          (props.hideBottomSpace ? 'stale' : 'animated'),
        onClick: prevent
      },
      [
        props.hideBottomSpace
          ? main
          : h(Transition, { name: 'q-transition--field-message' }, () => main),

        hasCounter
          ? h(
              'div',
              {
                class: 'q-field__counter'
              },
              slots.counter !== void 0
                ? slots.counter()
                : state.computedCounter.value
            )
          : null
      ]
    )
  }

  let shouldActivate = false;

  onDeactivated(() => {
    shouldActivate = true;
  });

  onActivated(() => {
    if (shouldActivate && props.autofocus) {
      proxy.focus();
    }
  });

  if (props.autofocus) {
    onMounted(() => {
      proxy.focus();
    });
  }

  onBeforeUnmount(() => {
    if (focusoutTimer !== null) clearTimeout(focusoutTimer);
  });

  // expose public methods
  Object.assign(proxy, { focus, blur });

  return function renderField() {
    const labelAttrs =
      state.getControl === void 0 && slots.control === void 0
        ? {
            ...state.splitAttrs.attributes.value,
            'data-autofocus': props.autofocus || void 0,
            ...attributes.value
          }
        : attributes.value;

    return h(
      state.tag.value,
      {
        ref: state.rootRef,
        class: [classes.value, attrs.class],
        style: attrs.style,
        ...labelAttrs
      },
      [
        slots.before !== void 0
          ? h(
              'div',
              {
                class:
                  'q-field__before q-field__marginal row no-wrap items-center',
                onClick: prevent
              },
              slots.before()
            )
          : null,

        h(
          'div',
          {
            class: 'q-field__inner relative-position col self-stretch'
          },
          [
            h(
              'div',
              {
                ref: state.controlRef,
                class: contentClass.value,
                tabindex: -1,
                ...state.controlEvents
              },
              getContent()
            ),

            shouldRenderBottom.value ? getBottom() : null
          ]
        ),

        slots.after !== void 0
          ? h(
              'div',
              {
                class:
                  'q-field__after q-field__marginal row no-wrap items-center',
                onClick: prevent
              },
              slots.after()
            )
          : null
      ]
    )
  }
}

function useFileDomProps(props, typeGuard) {
  function getFormDomProps() {
    const model = props.modelValue;

    try {
      const dt =
        'DataTransfer' in window
          ? new DataTransfer()
          : 'ClipboardEvent' in window
            ? new ClipboardEvent('').clipboardData
            : void 0;

      if (Object(model) === model) {
        ;('length' in model ? [...model] : [model]).forEach(file => {
          dt.items.add(file);
        });
      }

      return {
        files: dt.files
      }
    } catch {
      return {
        files: void 0
      }
    }
  }

  return computed(() => {
        if (props.type !== 'file') return
        return getFormDomProps()
      })
    
}

// leave NAMED_MASKS at top of file (code referenced from docs)
const NAMED_MASKS = {
  date: '####/##/##',
  datetime: '####/##/## ##:##',
  time: '##:##',
  fulltime: '##:##:##',
  phone: '(###) ### - ####',
  card: '#### #### #### ####'
};

const { tokenMap: DEFAULT_TOKEN_MAP, tokenKeys: DEFAULT_TOKEN_MAP_KEYS } =
  getTokenMap({
    '#': { pattern: '[\\d]', negate: '[^\\d]' },

    S: { pattern: '[a-zA-Z]', negate: '[^a-zA-Z]' },
    N: { pattern: '[0-9a-zA-Z]', negate: '[^0-9a-zA-Z]' },

    A: {
      pattern: '[a-zA-Z]',
      negate: '[^a-zA-Z]',
      transform: v => v.toLocaleUpperCase()
    },
    a: {
      pattern: '[a-zA-Z]',
      negate: '[^a-zA-Z]',
      transform: v => v.toLocaleLowerCase()
    },

    X: {
      pattern: '[0-9a-zA-Z]',
      negate: '[^0-9a-zA-Z]',
      transform: v => v.toLocaleUpperCase()
    },
    x: {
      pattern: '[0-9a-zA-Z]',
      negate: '[^0-9a-zA-Z]',
      transform: v => v.toLocaleLowerCase()
    }
  });

function getTokenMap(tokens) {
  const tokenKeys = Object.keys(tokens);
  const tokenMap = {};

  tokenKeys.forEach(key => {
    const entry = tokens[key];
    tokenMap[key] = {
      ...entry,
      regex: new RegExp(entry.pattern)
    };
  });

  return { tokenMap, tokenKeys }
}

function getTokenRegexMask(keys) {
  return new RegExp(
    // oxlint-disable-next-line no-template-curly-in-string
    '\\\\([^.*+?^${}()|([\\]])|([.*+?^${}()|[\\]])|([' +
      keys.join('') +
      '])|(.)',
    'g'
  )
}

const escRegex = /[.*+?^${}()|[\]\\]/g;
const DEFAULT_TOKEN_REGEX_MASK = getTokenRegexMask(DEFAULT_TOKEN_MAP_KEYS);
const MARKER = String.fromCodePoint(1);

const useMaskProps = {
  mask: String,
  reverseFillMask: Boolean,
  fillMask: [Boolean, String],
  unmaskedValue: Boolean,
  maskTokens: Object
};

function useMask(props, emit, emitValue, inputRef) {
  let maskMarked,
    maskReplaced,
    computedMask,
    computedUnmask,
    pastedTextStart,
    selectionAnchor;

  const tokens = computed(() => {
    if (props.maskTokens === void 0 || props.maskTokens === null) {
      return {
        tokenMap: DEFAULT_TOKEN_MAP,
        tokenRegexMask: DEFAULT_TOKEN_REGEX_MASK
      }
    }

    const { tokenMap: customTokens } = getTokenMap(props.maskTokens);
    const tokenMap = {
      ...DEFAULT_TOKEN_MAP,
      ...customTokens
    };

    return {
      tokenMap,
      tokenRegexMask: getTokenRegexMask(Object.keys(tokenMap))
    }
  });

  const hasMask = ref(null);
  const innerValue = ref(getInitialMaskedValue());

  function getIsTypeText() {
    return (
      props.autogrow ||
      ['textarea', 'text', 'search', 'url', 'tel', 'password'].includes(
        props.type
      )
    )
  }

  watch(() => props.type + props.autogrow, updateMaskInternals);

  watch(
    () => props.mask,
    v => {
      if (v !== void 0) {
        updateMaskValue(innerValue.value, true);
      } else {
        const val = unmaskValue(innerValue.value);
        updateMaskInternals();
        if (props.modelValue !== val) emit('update:modelValue', val);
      }
    }
  );

  watch(
    () => props.fillMask + props.reverseFillMask,
    () => {
      if (hasMask.value) updateMaskValue(innerValue.value, true);
    }
  );

  watch(
    () => props.unmaskedValue,
    () => {
      if (hasMask.value) updateMaskValue(innerValue.value);
    }
  );

  watch(
    () => props.maskTokens,
    () => {
      if (hasMask.value) updateMaskValue(innerValue.value, true);
    },
    { deep: true }
  );

  function getInitialMaskedValue() {
    updateMaskInternals();

    if (hasMask.value) {
      const masked = maskValue(unmaskValue(props.modelValue));

      return props.fillMask !== false ? fillWithMask(masked) : masked
    }

    return props.modelValue
  }

  function getPaddedMaskMarked(size) {
    if (size < maskMarked.length) {
      return maskMarked.slice(-size)
    }

    let pad = '',
      localMaskMarked = maskMarked;
    const padPos = localMaskMarked.indexOf(MARKER);

    if (padPos !== -1) {
      for (let i = size - localMaskMarked.length; i > 0; i--) {
        pad += MARKER;
      }

      localMaskMarked =
        localMaskMarked.slice(0, padPos) + pad + localMaskMarked.slice(padPos);
    }

    return localMaskMarked
  }

  function updateMaskInternals() {
    hasMask.value =
      props.mask !== void 0 && props.mask.length !== 0 && getIsTypeText();

    if (!hasMask.value) {
      computedUnmask = void 0;
      maskMarked = '';
      maskReplaced = '';
      return
    }

    const localComputedMask =
        NAMED_MASKS[props.mask] === void 0
          ? props.mask
          : NAMED_MASKS[props.mask],
      fillChar =
        typeof props.fillMask === 'string' && props.fillMask.length !== 0
          ? props.fillMask.slice(0, 1)
          : '_',
      fillCharEscaped = fillChar.replace(escRegex, String.raw`\$&`),
      unmask = [],
      extract = [],
      mask = [];

    let firstMatch = props.reverseFillMask,
      unmaskChar = '',
      negateChar = '';

    localComputedMask.replace(
      tokens.value.tokenRegexMask,
      (_, char1, esc, token, char2) => {
        if (token !== void 0) {
          const c = tokens.value.tokenMap[token];
          mask.push(c);
          negateChar = c.negate;
          if (firstMatch) {
            extract.push(
              '(?:' +
                negateChar +
                '+)?(' +
                c.pattern +
                '+)?(?:' +
                negateChar +
                '+)?(' +
                c.pattern +
                '+)?'
            );
            firstMatch = false;
          }
          extract.push('(?:' + negateChar + '+)?(' + c.pattern + ')?');
          return
        }

        if (esc !== void 0) {
          unmaskChar = '\\' + (esc === '\\' ? '' : esc);
          mask.push(esc);
        } else {
          const c = char1 !== void 0 ? char1 : char2;
          unmaskChar =
            c === '\\'
              ? String.raw`\\\\`
              : c.replace(escRegex, String.raw`\\$&`);
          mask.push(c);
        }

        unmask.push('([^' + unmaskChar + ']+)?' + unmaskChar + '?');
      }
    );

    const unmaskMatcher = new RegExp(
        '^' +
          unmask.join('') +
          '(' +
          (unmaskChar === '' ? '.' : '[^' + unmaskChar + ']') +
          '+)?' +
          (unmaskChar === '' ? '' : '[' + unmaskChar + ']*') +
          '$'
      ),
      extractLast = extract.length - 1,
      extractMatcher = extract.map((re, index) => {
        if (index === 0 && props.reverseFillMask) {
          return new RegExp('^' + fillCharEscaped + '*' + re)
        } else if (index === extractLast) {
          return new RegExp(
            '^' +
              re +
              '(' +
              (negateChar === '' ? '.' : negateChar) +
              '+)?' +
              (props.reverseFillMask ? '$' : fillCharEscaped + '*')
          )
        }

        return new RegExp('^' + re)
      });

    computedMask = mask;
    computedUnmask = val => {
      const unmaskMatch = unmaskMatcher.exec(
        props.reverseFillMask ? val : val.slice(0, mask.length + 1)
      );
      if (unmaskMatch !== null) {
        val = unmaskMatch.slice(1).join('');
      }

      const extractMatch = [],
        extractMatcherLength = extractMatcher.length;

      for (let i = 0, str = val; i < extractMatcherLength; i++) {
        const m = extractMatcher[i].exec(str);

        if (m === null) {
          break
        }

        str = str.slice(m.shift().length);
        extractMatch.push(...m);
      }
      if (extractMatch.length !== 0) {
        return extractMatch.join('')
      }

      return val
    };
    maskMarked = mask.map(v => (typeof v === 'string' ? v : MARKER)).join('');
    maskReplaced = maskMarked.split(MARKER).join(fillChar);
  }

  function updateMaskValue(rawVal, updateMaskInternalsFlag, inputType) {
    const inp = inputRef.value,
      end = inp?.selectionEnd ?? 0,
      endReverse = inp === null ? 0 : inp.value.length - end,
      unmasked = unmaskValue(rawVal);

    // Update here so unmask uses the original fillChar
    if (updateMaskInternalsFlag === true) updateMaskInternals();

    const preMasked = maskValue(unmasked, updateMaskInternalsFlag),
      masked = props.fillMask !== false ? fillWithMask(preMasked) : preMasked,
      changed = innerValue.value !== masked;

    // We want to avoid "flickering" so we set value immediately
    if (inp !== null && inp.value !== masked) inp.value = masked;

    if (changed) innerValue.value = masked;

    if (inp !== null && document.activeElement === inp) {
      nextTick(() => {
        if (masked === maskReplaced) {
          const cursor = props.reverseFillMask ? maskReplaced.length : 0;
          inp.setSelectionRange(cursor, cursor, 'forward');
          return
        }

        if (inputType === 'insertFromPaste' && !props.reverseFillMask) {
          const maxEnd = inp.selectionEnd;
          let cursor = end - 1;
          // each non-marker char means we move once to right
          for (let i = pastedTextStart; i <= cursor && i < maxEnd; i++) {
            if (maskMarked[i] !== MARKER) {
              cursor++;
            }
          }

          moveCursor.right(inp, cursor);
          return
        }

        if (
          ['deleteContentBackward', 'deleteContentForward'].includes(inputType)
        ) {
          const cursor = props.reverseFillMask
            ? end === 0
              ? masked.length > preMasked.length
                ? 1
                : 0
              : Math.max(
                  0,
                  masked.length -
                    (masked === maskReplaced
                      ? 0
                      : Math.min(preMasked.length, endReverse) + 1)
                ) + 1
            : end;

          inp.setSelectionRange(cursor, cursor, 'forward');
          return
        }

        if (props.reverseFillMask) {
          if (changed) {
            const cursor = Math.max(
              0,
              masked.length -
                (masked === maskReplaced
                  ? 0
                  : Math.min(preMasked.length, endReverse + 1))
            );

            if (cursor === 1 && end === 1) {
              inp.setSelectionRange(cursor, cursor, 'forward');
            } else {
              moveCursor.rightReverse(inp, cursor);
            }
          } else {
            const cursor = masked.length - endReverse;
            inp.setSelectionRange(cursor, cursor, 'backward');
          }
        } else if (changed) {
          const cursor = Math.max(
            0,
            maskMarked.indexOf(MARKER),
            Math.min(preMasked.length, end) - 1
          );
          moveCursor.right(inp, cursor);
        } else {
          const cursor = end - 1;
          moveCursor.right(inp, cursor);
        }
      });
    }

    const val = props.unmaskedValue ? unmaskValue(masked) : masked;

    if (
      String(props.modelValue) !== val &&
      (props.modelValue !== null || val !== '')
    ) {
      emitValue(val, true);
    }
  }

  function moveCursorForPaste(inp, start, end) {
    const preMasked = maskValue(unmaskValue(inp.value));

    start = Math.max(
      0,
      maskMarked.indexOf(MARKER),
      Math.min(preMasked.length, start)
    );
    pastedTextStart = start;

    inp.setSelectionRange(start, end, 'forward');
  }

  const moveCursor = {
    left(inp, cursor) {
      const noMarkBefore = !maskMarked.slice(cursor - 1).includes(MARKER);
      let i = Math.max(0, cursor - 1);

      for (; i >= 0; i--) {
        if (maskMarked[i] === MARKER) {
          cursor = i;
          if (noMarkBefore) cursor++;
          break
        }
      }

      if (
        i < 0 &&
        maskMarked[cursor] !== void 0 &&
        maskMarked[cursor] !== MARKER
      ) {
        return moveCursor.right(inp, 0)
      }

      if (cursor >= 0) inp.setSelectionRange(cursor, cursor, 'backward');
    },

    right(inp, cursor) {
      const limit = inp.value.length;
      let i = Math.min(limit, cursor + 1);

      for (; i <= limit; i++) {
        if (maskMarked[i] === MARKER) {
          cursor = i;
          break
        } else if (maskMarked[i - 1] === MARKER) {
          cursor = i;
        }
      }

      if (
        i > limit &&
        maskMarked[cursor - 1] !== void 0 &&
        maskMarked[cursor - 1] !== MARKER
      ) {
        return moveCursor.left(inp, limit)
      }

      inp.setSelectionRange(cursor, cursor, 'forward');
    },

    leftReverse(inp, cursor) {
      const localMaskMarked = getPaddedMaskMarked(inp.value.length);
      let i = Math.max(0, cursor - 1);

      for (; i >= 0; i--) {
        if (localMaskMarked[i - 1] === MARKER) {
          cursor = i;
          break
        } else if (localMaskMarked[i] === MARKER) {
          cursor = i;
          if (i === 0) {
            break
          }
        }
      }

      if (
        i < 0 &&
        localMaskMarked[cursor] !== void 0 &&
        localMaskMarked[cursor] !== MARKER
      ) {
        return moveCursor.rightReverse(inp, 0)
      }

      if (cursor >= 0) inp.setSelectionRange(cursor, cursor, 'backward');
    },

    rightReverse(inp, cursor) {
      const limit = inp.value.length,
        localMaskMarked = getPaddedMaskMarked(limit),
        noMarkBefore = !localMaskMarked.slice(0, cursor + 1).includes(MARKER);
      let i = Math.min(limit, cursor + 1);

      for (; i <= limit; i++) {
        if (localMaskMarked[i - 1] === MARKER) {
          cursor = i;
          if (cursor > 0 && noMarkBefore) cursor--;
          break
        }
      }

      if (
        i > limit &&
        localMaskMarked[cursor - 1] !== void 0 &&
        localMaskMarked[cursor - 1] !== MARKER
      ) {
        return moveCursor.leftReverse(inp, limit)
      }

      inp.setSelectionRange(cursor, cursor, 'forward');
    }
  };

  function onMaskedClick(e) {
    emit('click', e);

    selectionAnchor = void 0;
  }

  function onMaskedKeydown(e) {
    emit('keydown', e);

    if (
      shouldIgnoreKey(e) ||
      e.altKey // let browser handle these
    ) {
      return
    }

    const inp = inputRef.value,
      start = inp.selectionStart,
      end = inp.selectionEnd;

    if (!e.shiftKey) {
      selectionAnchor = void 0;
    }

    if (e.keyCode === 37 || e.keyCode === 39) {
      // Left / Right
      if (e.shiftKey && selectionAnchor === void 0) {
        selectionAnchor = inp.selectionDirection === 'forward' ? start : end;
      }

      const fn =
        moveCursor[
          (e.keyCode === 39 ? 'right' : 'left') +
            (props.reverseFillMask ? 'Reverse' : '')
        ];

      e.preventDefault();
      fn(inp, selectionAnchor === start ? end : start);

      if (e.shiftKey) {
        const cursor = inp.selectionStart;
        inp.setSelectionRange(
          Math.min(selectionAnchor, cursor),
          Math.max(selectionAnchor, cursor),
          'forward'
        );
      }
    } else if (
      e.keyCode === 8 && // Backspace
      !props.reverseFillMask &&
      start === end
    ) {
      moveCursor.left(inp, start);
      inp.setSelectionRange(inp.selectionStart, end, 'backward');
    } else if (
      e.keyCode === 46 && // Delete
      props.reverseFillMask &&
      start === end
    ) {
      moveCursor.rightReverse(inp, end);
      inp.setSelectionRange(start, inp.selectionEnd, 'forward');
    }
  }

  function maskValue(val, updateMaskInternalsFlag) {
    if (val === void 0 || val === null || val === '') {
      return ''
    }

    if (props.reverseFillMask) {
      return maskValueReverse(val, updateMaskInternalsFlag)
    }

    const mask = computedMask;

    let valIndex = 0,
      output = '';

    for (let maskIndex = 0; maskIndex < mask.length; maskIndex++) {
      const valChar = val[valIndex],
        maskDef = mask[maskIndex];

      if (typeof maskDef === 'string') {
        output += maskDef;

        if (updateMaskInternalsFlag === true && valChar === maskDef) {
          valIndex++;
        }
      } else if (valChar !== void 0 && maskDef.regex.test(valChar)) {
        output +=
          maskDef.transform !== void 0 ? maskDef.transform(valChar) : valChar;
        valIndex++;
      } else {
        return output
      }
    }

    return output
  }

  function maskValueReverse(val, updateMaskInternalsFlag) {
    const mask = computedMask,
      firstTokenIndex = maskMarked.indexOf(MARKER);

    let valIndex = val.length - 1,
      output = '';

    for (
      let maskIndex = mask.length - 1;
      maskIndex >= 0 && valIndex !== -1;
      maskIndex--
    ) {
      const maskDef = mask[maskIndex];

      let valChar = val[valIndex];

      if (typeof maskDef === 'string') {
        output = maskDef + output;

        if (updateMaskInternalsFlag === true && valChar === maskDef) {
          valIndex--;
        }
      } else if (valChar !== void 0 && maskDef.regex.test(valChar)) {
        do {
          output =
            (maskDef.transform !== void 0
              ? maskDef.transform(valChar)
              : valChar) + output;
          valIndex--;
          valChar = val[valIndex];
        } while (
          // oxlint-disable-next-line no-unmodified-loop-condition
          firstTokenIndex === maskIndex &&
          valChar !== void 0 &&
          maskDef.regex.test(valChar)
        )
      } else {
        return output
      }
    }

    return output
  }

  function unmaskValue(val) {
    return typeof val !== 'string' || computedUnmask === void 0
      ? typeof val === 'number'
        ? computedUnmask(String(val))
        : val
      : computedUnmask(val)
  }

  function fillWithMask(val) {
    if (maskReplaced.length - val.length <= 0) {
      return val
    }

    return props.reverseFillMask && val.length !== 0
      ? maskReplaced.slice(0, -val.length) + val
      : val + maskReplaced.slice(val.length)
  }

  return {
    innerValue,
    hasMask,
    moveCursorForPaste,
    updateMaskValue,
    onMaskedKeydown,
    onMaskedClick
  }
}

const isJapanese =
  /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFF9F\u4E00-\u9FAF\u3400-\u4DBF]/;
const isChinese =
  /[\u4E00-\u9FFF\u3400-\u4DBF\u{20000}-\u{2A6DF}\u{2A700}-\u{2B73F}\u{2B740}-\u{2B81F}\u{2B820}-\u{2CEAF}\uF900-\uFAFF\u3300-\u33FF\uFE30-\uFE4F\uF900-\uFAFF\u{2F800}-\u{2FA1F}]/u;
const isKorean = /[\u3131-\u314E\u314F-\u3163\uAC00-\uD7A3]/;
const isPlainText = /[a-z0-9_ -]$/i;

function useKeyComposition(onInput) {
  return function onComposition(e) {
    if (e.type === 'compositionend' || e.type === 'change') {
      if (!e.target.qComposing) return
      e.target.qComposing = false;
      onInput(e);
    } else if (
      e.type === 'compositionupdate' &&
      !e.target.qComposing &&
      typeof e.data === 'string'
    ) {
      const isComposing = client.is.firefox
        ? !isPlainText.test(e.data)
        : isJapanese.test(e.data) ||
          isChinese.test(e.data) ||
          isKorean.test(e.data);

      if (isComposing) {
        e.target.qComposing = true;
      }
    }
  }
}

const QInput = createComponent({
  name: 'QInput',

  inheritAttrs: false,

  props: {
    ...useFieldProps,
    ...useMaskProps,
    ...useFormProps,

    // override of useFieldProps > modelValue
    modelValue: {} // SSR/SSG does not know about FileList
      ,
    modelModifiers: Object,

    shadowText: String,

    type: {
      type: String,
      default: 'text'
    },

    debounce: [String, Number],

    autogrow: Boolean, // makes a textarea

    inputClass: [Array, String, Object],
    inputStyle: [Array, String, Object]
  },

  emits: [
    ...useFieldEmits,
    'paste',
    'change',
    'keydown',
    'click',
    'animationend'
  ],

  setup(props, { emit, attrs }) {
    const { proxy } = getCurrentInstance();
    const { $q } = proxy;

    const temp = {};
    let emitCachedValue = Number.NaN,
      typedNumber = false,
      stopValueWatcher = false,
      emitTimer = null,
      emitValueFn;

    const inputRef = ref(null);
    const nameProp = useFormInputNameAttr(props);

    const {
      innerValue,
      hasMask,
      moveCursorForPaste,
      updateMaskValue,
      onMaskedKeydown,
      onMaskedClick
    } = useMask(props, emit, emitValue, inputRef);

    const formDomProps = useFileDomProps(props);
    const hasValue = computed(() => fieldValueIsFilled(innerValue.value));

    const onComposition = useKeyComposition(onInput);

    const state = useFieldState({ changeEvent: true });

    const isTextarea = computed(
      () => props.type === 'textarea' || props.autogrow
    );

    const isTypeText = computed(
      () =>
        isTextarea.value ||
        ['text', 'search', 'url', 'tel', 'password'].includes(props.type)
    );

    const onEvents = computed(() => {
      const evt = {
        ...state.splitAttrs.listeners.value,
        onInput,
        onPaste,
        // Safari < 10.2 & UIWebView doesn't fire compositionend when
        // switching focus before confirming composition choice
        // this also fixes the issue where some browsers e.g. iOS Chrome
        // fires "change" instead of "input" on autocomplete.
        onChange,
        onBlur: onFinishEditing,
        onFocus: stop
      };

      evt.onCompositionstart =
        evt.onCompositionupdate =
        evt.onCompositionend =
          onComposition;

      if (hasMask.value) {
        evt.onKeydown = onMaskedKeydown;
        // reset selection anchor on pointer selection
        evt.onClick = onMaskedClick;
      }

      if (props.autogrow) {
        evt.onAnimationend = onAnimationend;
      }

      return evt
    });

    const inputAttrs = computed(() => {
      const acc = {
        tabindex: 0,
        'data-autofocus': props.autofocus || void 0,
        rows: props.type === 'textarea' ? 6 : void 0,
        'aria-label': props.label,
        name: nameProp.value,
        ...state.splitAttrs.attributes.value,
        id: state.targetUid.value,
        maxlength: props.maxlength,
        disabled: props.disable,
        readonly: props.readonly
      };

      if (!isTextarea.value) {
        acc.type = props.type;
      }

      if (props.autogrow) {
        acc.rows = 1;
      }

      return acc
    });

    // some browsers lose the native input value
    // so we need to reattach it dynamically
    // (like type="password" <-> type="text"; see #12078)
    watch(
      () => props.type,
      () => {
        if (inputRef.value) {
          inputRef.value.value = props.modelValue;
        }
      }
    );

    watch(
      () => props.modelValue,
      v => {
        if (emitTimer !== null) {
          cancelPendingValueEmission();
          typedNumber = false;
          stopValueWatcher = false;
          delete temp.value;
        }

        if (hasMask.value) {
          if (stopValueWatcher) {
            stopValueWatcher = false;
            if (String(v) === emitCachedValue) return
          }

          updateMaskValue(v);
        } else if (innerValue.value !== v) {
          innerValue.value = v;

          if (props.type === 'number' && Object.hasOwn(temp, 'value')) {
            if (typedNumber) {
              typedNumber = false;
            } else {
              delete temp.value;
            }
          }

          if (
            props.modelModifiers?.trim === true &&
            Object.hasOwn(temp, 'value') &&
            (typeof temp.value !== 'string' || temp.value.trim() !== v)
          ) {
            delete temp.value;
          }
        }

        // textarea only
        if (props.autogrow) nextTick(adjustHeight);
      }
    );

    watch(
      () => props.autogrow,
      val => {
        // textarea only
        if (val) {
          nextTick(adjustHeight);
        }
        // if it has a number of rows set respect it
        else if (inputRef.value !== null && attrs.rows > 0) {
          inputRef.value.style.height = 'auto';
        }
      }
    );

    watch(
      () => props.dense,
      () => {
        if (props.autogrow) nextTick(adjustHeight);
      }
    );

    function focusHandler() {
      const el = document.activeElement;
      if (
        inputRef.value !== null &&
        inputRef.value !== el &&
        (el === null || el.id !== state.targetUid.value)
      ) {
        inputRef.value.focus({ preventScroll: true });
      }
    }

    function focus() {
      addFocusFn(focusHandler);
    }

    function blur() {
      removeFocusFn(focusHandler);
      const el = document.activeElement;
      if (el !== null && state.rootRef.value.contains(el)) {
        el.blur();
      }
    }

    function select() {
      inputRef.value?.select();
    }

    function onPaste(e) {
      if (hasMask.value && props.reverseFillMask !== true) {
        const inp = e.target;
        moveCursorForPaste(inp, inp.selectionStart, inp.selectionEnd);
      }

      emit('paste', e);
    }

    function onInput(e) {
      if (!e || !e.target) return

      if (props.type === 'file') {
        emit('update:modelValue', e.target.files);
        return
      }

      const val = e.target.value;

      if (e.target.qComposing) {
        temp.value = val;
        return
      }

      if (hasMask.value) {
        updateMaskValue(val, false, e.inputType);
      } else {
        if (props.modelModifiers?.trim === true) {
          temp.value = val;
        }

        emitValue(val);

        if (isTypeText.value && e.target === document.activeElement) {
          const { selectionStart, selectionEnd } = e.target;

          if (selectionStart !== void 0 && selectionEnd !== void 0) {
            nextTick(() => {
              if (
                e.target === document.activeElement &&
                val.indexOf(e.target.value) === 0
              ) {
                e.target.setSelectionRange(selectionStart, selectionEnd);
              }
            });
          }
        }
      }

      // we need to trigger it immediately too,
      // to avoid "flickering"
      if (props.autogrow) adjustHeight();
    }

    function onAnimationend(e) {
      emit('animationend', e);
      adjustHeight();
    }

    function emitValue(val, stopWatcher) {
      emitValueFn = () => {
        emitTimer = null;

        if (
          props.type !== 'number' &&
          (props.modelModifiers?.trim !== true || hasMask.value) &&
          Object.hasOwn(temp, 'value')
        ) {
          delete temp.value;
        }

        if (props.modelValue !== val && emitCachedValue !== val) {
          emitCachedValue = val;

          if (stopWatcher === true) stopValueWatcher = true;
          emit('update:modelValue', val);

          nextTick(() => {
            if (emitCachedValue === val) emitCachedValue = Number.NaN;
          });
        }

        emitValueFn = void 0;
      };

      if (props.type === 'number') {
        typedNumber = true;
        temp.value = val;
      }

      if (props.debounce !== void 0) {
        if (emitTimer !== null) clearTimeout(emitTimer);
        temp.value = val;
        emitTimer = setTimeout(emitValueFn, props.debounce);
      } else {
        emitValueFn();
      }
    }

    function cancelPendingValueEmission() {
      if (emitTimer !== null) {
        clearTimeout(emitTimer);
        emitTimer = null;
      }

      emitValueFn = void 0;
    }

    function onClear() {
      cancelPendingValueEmission();
      typedNumber = false;
      stopValueWatcher = false;
      delete temp.value;
    }

    // textarea only
    function adjustHeight() {
      requestAnimationFrame(() => {
        const inp = inputRef.value;
        if (inp !== null) {
          const parentStyle = inp.parentNode.style;
          // chrome does not keep scroll #15498
          const { scrollTop } = inp;
          // chrome calculates a smaller scrollHeight when in a .column container
          const { overflowY, maxHeight } = $q.platform.is.firefox
            ? {}
            : window.getComputedStyle(inp);
          // on firefox or if overflowY is specified as scroll #14263, #14344
          // we don't touch overflow
          // firefox is not so bad in the end
          const changeOverflow = overflowY !== void 0 && overflowY !== 'scroll';

          // reset height of textarea to a small size to detect the real height
          // but keep the total control size the same
          if (changeOverflow) inp.style.overflowY = 'hidden';
          parentStyle.marginBottom = inp.scrollHeight - 1 + 'px';
          inp.style.height = '1px';

          inp.style.height = inp.scrollHeight + 'px';
          // we should allow scrollbars only
          // if there is maxHeight and content is taller than maxHeight
          if (changeOverflow) {
            inp.style.overflowY =
              Number.parseInt(maxHeight, 10) < inp.scrollHeight
                ? 'auto'
                : 'hidden';
          }
          parentStyle.marginBottom = '';
          inp.scrollTop = scrollTop;
        }
      });
    }

    function onChange(e) {
      onComposition(e);

      if (emitTimer !== null) {
        clearTimeout(emitTimer);
        emitTimer = null;
      }

      emitValueFn?.();

      emit('change', e.target.value);
    }

    function onFinishEditing(e) {
      if (e !== void 0) stop(e);

      if (emitTimer !== null) {
        clearTimeout(emitTimer);
        emitTimer = null;
      }

      emitValueFn?.();

      typedNumber = false;
      stopValueWatcher = false;
      delete temp.value;

      // we need to use setTimeout instead of this.$nextTick
      // to avoid a bug where focusout is not emitted for type date/time/week/...
      if (props.type !== 'file') {
        setTimeout(() => {
          if (inputRef.value !== null) {
            inputRef.value.value =
              innerValue.value !== void 0 ? innerValue.value : '';
          }
        }, 0);
      }
    }

    function getCurValue() {
      return Object.hasOwn(temp, 'value')
        ? temp.value
        : innerValue.value !== void 0
          ? innerValue.value
          : ''
    }

    onBeforeUnmount(() => {
      onFinishEditing();
    });

    onMounted(() => {
      // textarea only
      if (props.autogrow) adjustHeight();
    });

    Object.assign(state, {
      innerValue,

      fieldClass: computed(
        () =>
          `q-${isTextarea.value ? 'textarea' : 'input'}` +
          (props.autogrow ? ' q-textarea--autogrow' : '')
      ),

      hasShadow: computed(
        () =>
          props.type !== 'file' &&
          typeof props.shadowText === 'string' &&
          props.shadowText.length !== 0
      ),

      inputRef,

      emitValue,
      onClear,

      hasValue,

      floatingLabel: computed(
        () =>
          (hasValue.value &&
            (props.type !== 'number' ||
              Number.isFinite(Number(innerValue.value)))) ||
          fieldValueIsFilled(props.displayValue)
      ),

      getControl: () =>
        h(isTextarea.value ? 'textarea' : 'input', {
          ref: inputRef,
          class: ['q-field__native q-placeholder', props.inputClass],
          style: props.inputStyle,
          ...inputAttrs.value,
          ...onEvents.value,
          ...(props.type !== 'file'
            ? { value: getCurValue() }
            : formDomProps.value)
        }),

      getShadowControl: () =>
        h(
          'div',
          {
            class:
              'q-field__native q-field__shadow absolute-bottom no-pointer-events' +
              (isTextarea.value ? '' : ' text-no-wrap')
          },
          [
            h('span', { class: 'invisible' }, getCurValue()),
            h('span', props.shadowText)
          ]
        )
    });

    const renderFn = useField(state);

    // expose public methods
    Object.assign(proxy, {
      focus,
      blur,
      select,
      getNativeElement: () => inputRef.value // deprecated
    });

    injectProp(proxy, 'nativeEl', () => inputRef.value);

    return renderFn
  }
});

export { QDialog as Q, QInput as a };
//# sourceMappingURL=QInput.mjs.map
