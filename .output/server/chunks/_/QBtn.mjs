import { computed, getCurrentInstance, h, ref, onBeforeUnmount, Transition, withDirectives } from 'vue';
import { c as createComponent, h as createDirective, s as stopAndPrevent, l as listenOpts, p as prevent, d as stop } from '../virtual/entry.mjs';
import { a as hSlot, b as hMergeSlot } from './render.mjs';

function shouldIgnoreKey(evt) {
  return (
    evt !== Object(evt) ||
    evt.isComposing ||
    evt.qKeyEvent
  )
}

function isKeyCode(evt, keyCodes) {
  return !shouldIgnoreKey(evt) && [keyCodes].flat().includes(evt.keyCode)
}

const useSizeDefaults = {
  xs: 18,
  sm: 24,
  md: 32,
  lg: 38,
  xl: 46
};

const useSizeProps = {
  size: String
};

function useSize(props, sizes = useSizeDefaults) {
  // return sizeStyle
  return computed(() =>
    props.size !== void 0
      ? {
          fontSize: props.size in sizes ? `${sizes[props.size]}px` : props.size
        }
      : null
  )
}

const defaultViewBox = '0 0 24 24';

const sameFn = i => i;
const ionFn = i => `ionicons ${i}`;

const libMap = {
  'mdi-': i => `mdi ${i}`,
  'icon-': sameFn, // fontawesome equiv
  'bt-': i => `bt ${i}`,
  'eva-': i => `eva ${i}`,
  'ion-md': ionFn,
  'ion-ios': ionFn,
  'ion-logo': ionFn,
  'iconfont ': sameFn,
  'ti-': i => `themify-icon ${i}`,
  'bi-': i => `bootstrap-icons ${i}`,
  'i-': sameFn // UnoCSS pure icons
};

const matMap = {
  o_: '-outlined',
  r_: '-round',
  s_: '-sharp'
};

const symMap = {
  sym_o_: '-outlined',
  sym_r_: '-rounded',
  sym_s_: '-sharp'
};

const libRE = new RegExp('^(' + Object.keys(libMap).join('|') + ')');
const matRE = new RegExp('^(' + Object.keys(matMap).join('|') + ')');
const symRE = new RegExp('^(' + Object.keys(symMap).join('|') + ')');
const mRE = /^[Mm]\s?[-+]?\.?\d/;
const imgRE = /^img:/;
const svgUseRE = /^svguse:/;
const ionRE = /^ion-/;
const faRE =
  /^(fa-(classic|sharp|solid|regular|light|brands|duotone|thin)|[lf]a[srlbdk]?) /;

const QIcon = createComponent({
  name: 'QIcon',

  props: {
    ...useSizeProps,

    tag: {
      type: String,
      default: 'i'
    },

    name: String,
    color: String,
    left: Boolean,
    right: Boolean
  },

  setup(props, { slots }) {
    const {
      proxy: { $q }
    } = getCurrentInstance();
    const sizeStyle = useSize(props);

    const classes = computed(
      () =>
        'q-icon' +
        (props.left ? ' on-left' : '') + // TODO Qv3: drop this
        (props.right ? ' on-right' : '') +
        (props.color !== void 0 ? ` text-${props.color}` : '')
    );

    const type = computed(() => {
      let cls;
      let icon = props.name;

      if (icon === 'none' || !icon) {
        return { none: true }
      }

      if ($q.iconMapFn !== null) {
        const res = $q.iconMapFn(icon);
        if (res !== void 0) {
          if (res.icon !== void 0) {
            icon = res.icon;
            if (icon === 'none' || !icon) {
              return { none: true }
            }
          } else {
            return {
              cls: res.cls,
              content: res.content !== void 0 ? res.content : ' '
            }
          }
        }
      }

      if (mRE.test(icon)) {
        const [def, viewBox = defaultViewBox] = icon.split('|');

        return {
          svg: true,
          viewBox,
          nodes: def.split('&&').map(path => {
            const [d, style, transform] = path.split('@@');
            return h('path', { style, d, transform })
          })
        }
      }

      if (imgRE.test(icon)) {
        return {
          img: true,
          src: icon.slice(4)
        }
      }

      if (svgUseRE.test(icon)) {
        const [def, viewBox = defaultViewBox] = icon.split('|');

        return {
          svguse: true,
          src: def.slice(7),
          viewBox
        }
      }

      let content = ' ';
      const matches = icon.match(libRE);

      if (matches !== null) {
        cls = libMap[matches[1]](icon);
      } else if (faRE.test(icon)) {
        cls = icon;
      } else if (ionRE.test(icon)) {
        cls = `ionicons ion-${$q.platform.is.ios ? 'ios' : 'md'}${icon.slice(3)}`;
      } else if (symRE.test(icon)) {
        // "notranslate" class is for Google Translate
        // to avoid tampering with Material Symbols ligature font
        //
        // Caution: To be able to add suffix to the class name,
        // keep the 'material-symbols' at the end of the string.
        cls = 'notranslate material-symbols';

        const symMatches = icon.match(symRE);
        if (symMatches !== null) {
          icon = icon.slice(6);
          cls += symMap[symMatches[1]];
        }

        content = icon;
      } else {
        // "notranslate" class is for Google Translate
        // to avoid tampering with Material Icons ligature font
        //
        // Caution: To be able to add suffix to the class name,
        // keep the 'material-icons' at the end of the string.
        cls = 'notranslate material-icons';

        const matMatches = icon.match(matRE);
        if (matMatches !== null) {
          icon = icon.slice(2);
          cls += matMap[matMatches[1]];
        }

        content = icon;
      }

      return {
        cls,
        content
      }
    });

    return () => {
      const data = {
        class: classes.value,
        style: sizeStyle.value,
        'aria-hidden': 'true'
      };

      if (type.value.none) {
        return h(props.tag, data, hSlot(slots.default))
      }

      if (type.value.img) {
        return h(
          props.tag,
          data,
          hMergeSlot(slots.default, [h('img', { src: type.value.src })])
        )
      }

      if (type.value.svg) {
        return h(
          props.tag,
          data,
          hMergeSlot(slots.default, [
            h(
              'svg',
              {
                viewBox: type.value.viewBox || '0 0 24 24'
              },
              type.value.nodes
            )
          ])
        )
      }

      if (type.value.svguse) {
        return h(
          props.tag,
          data,
          hMergeSlot(slots.default, [
            h(
              'svg',
              {
                viewBox: type.value.viewBox
              },
              [h('use', { 'xlink:href': type.value.src })]
            )
          ])
        )
      }

      if (type.value.cls !== void 0) {
        data.class += ' ' + type.value.cls;
      }

      return h(props.tag, data, hMergeSlot(slots.default, [type.value.content]))
    }
  }
});

const alignMap = {
  left: 'start',
  center: 'center',
  right: 'end',
  between: 'between',
  around: 'around',
  evenly: 'evenly',
  stretch: 'stretch'
};

const alignValues = Object.keys(alignMap);

const useAlignProps = {
  align: {
    type: String,
    validator: v => alignValues.includes(v)
  }
};

function useAlign(props) {
  // return alignClass
  return computed(() => {
    const align =
      props.align === void 0
        ? props.vertical
          ? 'stretch'
          : 'left'
        : props.align;

    return `${props.vertical ? 'items' : 'justify'}-${alignMap[align]}`
  })
}

// copied to docs too

function vmHasRouter(vm) {
  return vm.appContext.config.globalProperties.$router !== void 0
}

function vmIsDestroyed(vm) {
  return vm.isUnmounted === true || vm.isDeactivated === true
}

/*
 * Inspired by RouterLink from Vue Router
 *  --> API should match!
 */


// Get the original path value of a record by following its aliasOf
function getOriginalPath(record) {
  return record ? (record.aliasOf ? record.aliasOf.path : record.path) : ''
}

function isSameRouteRecord(a, b) {
  // since the original record has an undefined value for aliasOf
  // but all aliases point to the original record, this will always compare
  // the original record
  return (a.aliasOf || a) === (b.aliasOf || b)
}

function includesParams(outer, inner) {
  for (const key in inner) {
    const innerValue = inner[key],
      outerValue = outer[key];

    if (typeof innerValue === 'string') {
      if (innerValue !== outerValue) return false
    } else if (
      !Array.isArray(outerValue) ||
      outerValue.length !== innerValue.length ||
      innerValue.some((value, i) => value !== outerValue[i])
    ) {
      return false
    }
  }

  return true
}

function isEquivalentArray(a, b) {
  return Array.isArray(b)
    ? a.length === b.length && a.every((value, i) => value === b[i])
    : a.length === 1 && a[0] === b
}

function isSameRouteLocationParamsValue(a, b) {
  return Array.isArray(a)
    ? isEquivalentArray(a, b)
    : Array.isArray(b)
      ? isEquivalentArray(b, a)
      : a === b
}

function isSameRouteLocationParams(a, b) {
  if (Object.keys(a).length !== Object.keys(b).length) {
    return false
  }

  for (const key in a) {
    if (!isSameRouteLocationParamsValue(a[key], b[key])) {
      return false
    }
  }

  return true
}

const useRouterLinkNonMatchingProps = {
  // router-link
  to: [String, Object],
  replace: Boolean,

  // regular <a> link
  href: String,
  target: String,

  // state
  disable: Boolean
};

// external props: type, tag

function useRouterLink({
  fallbackTag,
  useDisableForRouterLinkProps = true
} = {}) {
  const vm = getCurrentInstance();
  const { props, proxy, emit } = vm;

  const hasRouter = vmHasRouter(vm);
  const hasHrefLink = computed(() => !props.disable && props.href !== void 0);

  // for perf reasons, we use minimum amount of runtime work
  const hasRouterLinkProps = useDisableForRouterLinkProps
    ? computed(
        () =>
          hasRouter &&
          !props.disable &&
          !hasHrefLink.value &&
          props.to !== void 0 &&
          props.to !== null &&
          props.to !== ''
      )
    : computed(
        () =>
          hasRouter &&
          !hasHrefLink.value &&
          props.to !== void 0 &&
          props.to !== null &&
          props.to !== ''
      );

  const resolvedLink = computed(() =>
    hasRouterLinkProps.value ? getLink(props.to) : null
  );

  const hasRouterLink = computed(() => resolvedLink.value !== null);
  const hasLink = computed(() => hasHrefLink.value || hasRouterLink.value);

  const linkTag = computed(() =>
    props.type === 'a' || hasLink.value
      ? 'a'
      : props.tag || fallbackTag || 'div'
  );

  const linkAttrs = computed(() =>
    hasHrefLink.value
      ? {
          href: props.href,
          target: props.target
        }
      : hasRouterLink.value
        ? {
            href: resolvedLink.value.href,
            target: props.target
          }
        : {}
  );

  const linkActiveIndex = computed(() => {
    if (!hasRouterLink.value) return -1

    const { matched } = resolvedLink.value,
      { length } = matched,
      routeMatched = matched[length - 1];

    if (routeMatched === void 0) {
      return -1
    }

    const currentMatched = proxy.$route.matched;

    if (currentMatched.length === 0) {
      return -1
    }

    const index = currentMatched.findIndex(
      isSameRouteRecord.bind(null, routeMatched)
    );

    if (index !== -1) return index

    // possible parent record
    const parentRecordPath = getOriginalPath(matched[length - 2]);

    return (
      // we are dealing with nested routes
      length > 1 &&
        // if the parent and matched route have the same path, this link is
        // referring to the empty child. Or we currently are on a different
        // child of the same parent
        getOriginalPath(routeMatched) === parentRecordPath &&
        // avoid comparing the child with its parent
        currentMatched.at(-1).path !== parentRecordPath
        ? currentMatched.findIndex(
            isSameRouteRecord.bind(null, matched[length - 2])
          )
        : index
    )
  });

  const linkIsActive = computed(
    () =>
      hasRouterLink.value &&
      linkActiveIndex.value !== -1 &&
      includesParams(proxy.$route.params, resolvedLink.value.params)
  );

  const linkIsExactActive = computed(
    () =>
      linkIsActive.value &&
      linkActiveIndex.value === proxy.$route.matched.length - 1 &&
      isSameRouteLocationParams(proxy.$route.params, resolvedLink.value.params)
  );

  const linkClass = computed(() =>
    hasRouterLink.value
      ? linkIsExactActive.value
        ? ` ${props.exactActiveClass} ${props.activeClass}`
        : props.exact
          ? ''
          : linkIsActive.value
            ? ` ${props.activeClass}`
            : ''
      : ''
  );

  function getLink(to) {
    try {
      return proxy.$router.resolve(to)
    } catch {}

    return null
  }

  /**
   * @returns Promise<RouterError | false | undefined>
   */
  function navigateToRouterLink(
    e,
    { returnRouterError, to = props.to, replace = props.replace } = {}
  ) {
    if (props.disable) {
      // ensure native navigation is prevented in all cases,
      // like when useDisableForRouterLinkProps === false (QRouteTab)
      e.preventDefault();
      return Promise.resolve(false)
    }

    if (
      // don't redirect with control keys;
      // should match RouterLink from Vue Router
      e.metaKey ||
      e.altKey ||
      e.ctrlKey ||
      e.shiftKey ||
      // don't redirect on right click
      (e.button !== void 0 && e.button !== 0) ||
      // don't redirect if it should open in a new window
      props.target === '_blank'
    ) {
      return Promise.resolve(false)
    }

    // hinder the native navigation
    e.preventDefault();

    // then() can also return a "soft" router error (Vue Router behavior)
    const promise = proxy.$router[replace ? 'replace' : 'push'](to);

    return returnRouterError
      ? promise
      : // else catching hard errors and also "soft" ones - then(err => ...)
        promise.then(() => {}).catch(() => {})
  }

  // warning! ensure that the component using it has 'click' included in its 'emits' definition prop
  function navigateOnClick(e) {
    if (hasRouterLink.value) {
      const go = opts => navigateToRouterLink(e, opts);

      emit('click', e, go);
      if (!e.defaultPrevented) go();
    } else {
      emit('click', e);
    }
  }

  return {
    hasRouterLink,
    hasHrefLink,
    hasLink,

    linkTag,
    resolvedLink,
    linkIsActive,
    linkIsExactActive,
    linkClass,
    linkAttrs,

    getLink,
    navigateToRouterLink,
    navigateOnClick
  }
}

const useSpinnerProps = {
  size: {
    type: [String, Number],
    default: '1em'
  },
  color: String
};

function useSpinner(props) {
  return {
    cSize: computed(() =>
      props.size in useSizeDefaults
        ? `${useSizeDefaults[props.size]}px`
        : props.size
    ),

    classes: computed(
      () => 'q-spinner' + (props.color ? ` text-${props.color}` : '')
    )
  }
}

const QSpinner = createComponent({
  name: 'QSpinner',

  props: {
    ...useSpinnerProps,

    thickness: {
      type: Number,
      default: 5
    }
  },

  setup(props) {
    const { cSize, classes } = useSpinner(props);

    return () =>
      h(
        'svg',
        {
          class: classes.value + ' q-spinner-mat',
          width: cSize.value,
          height: cSize.value,
          viewBox: '25 25 50 50'
        },
        [
          h('circle', {
            class: 'path',
            cx: '50',
            cy: '50',
            r: '20',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': props.thickness,
            'stroke-miterlimit': '10'
          })
        ]
      )
  }
});

function noopSsrDirectiveTransform() {
  return {}
}

const Ripple = createDirective(
  { name: 'ripple', getSSRProps: noopSsrDirectiveTransform }
    
);

const btnPadding = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
};

const defaultSizes = {
  xs: 8,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24
};

const formTypes = ['button', 'submit', 'reset'];
const mediaTypeRE = /[^\s]\/[^\s]/;

const btnDesignOptions = ['flat', 'outline', 'push', 'unelevated'];

function getBtnDesign(props, defaultValue) {
  if (props.flat) return 'flat'
  if (props.outline) return 'outline'
  if (props.push) return 'push'
  if (props.unelevated) return 'unelevated'
  return defaultValue
}

const nonRoundBtnProps = {
  ...useSizeProps,
  ...useRouterLinkNonMatchingProps,

  type: {
    type: String,
    default: 'button'
  },

  label: [Number, String],
  icon: String,
  iconRight: String,

  ...btnDesignOptions.reduce((acc, val) => (acc[val] = Boolean) && acc, {}),

  square: Boolean,
  rounded: Boolean,
  glossy: Boolean,

  size: String,
  fab: Boolean,
  fabMini: Boolean,
  padding: String,

  color: String,
  textColor: String,
  noCaps: Boolean,
  noWrap: Boolean,
  dense: Boolean,

  tabindex: [Number, String],

  ripple: {
    type: [Boolean, Object],
    default: true
  },

  align: {
    ...useAlignProps.align,
    default: 'center'
  },
  stack: Boolean,
  stretch: Boolean,
  loading: {
    type: Boolean,
    default: null
  },
  disable: Boolean
};

const useBtnProps = {
  ...nonRoundBtnProps,
  round: Boolean
};

function useBtn(props) {
  const sizeStyle = useSize(props, defaultSizes);
  const alignClass = useAlign(props);
  const { hasRouterLink, hasLink, linkTag, linkAttrs, navigateOnClick } =
    useRouterLink({
      fallbackTag: 'button'
    });

  const style = computed(() => {
    const obj = props.fab || props.fabMini ? {} : sizeStyle.value;

    return props.padding !== void 0
      ? {
          ...obj,
          padding: props.padding
            .split(/\s+/)
            .map(v => (v in btnPadding ? btnPadding[v] + 'px' : v))
            .join(' '),
          minWidth: '0',
          minHeight: '0'
        }
      : obj
  });

  const isRounded = computed(() => props.rounded || props.fab || props.fabMini);

  const isActionable = computed(() => !props.disable && !props.loading);

  const tabIndex = computed(() =>
    isActionable.value ? props.tabindex || 0 : -1
  );

  const design = computed(() => getBtnDesign(props, 'standard'));

  const attributes = computed(() => {
    const acc = { tabindex: tabIndex.value };

    if (hasLink.value) {
      Object.assign(acc, linkAttrs.value);
    } else if (formTypes.includes(props.type)) {
      acc.type = props.type;
    }

    if (linkTag.value === 'a') {
      if (props.disable) {
        acc['aria-disabled'] = 'true';
      } else if (acc.href === void 0) {
        acc.role = 'button';
      }

      if (!hasRouterLink.value && mediaTypeRE.test(props.type)) {
        acc.type = props.type;
      }
    } else if (props.disable) {
      acc.disabled = '';
      acc['aria-disabled'] = 'true';
    }

    if (props.loading && props.percentage !== void 0) {
      Object.assign(acc, {
        role: 'progressbar',
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-valuenow': props.percentage
      });
    }

    return acc
  });

  const classes = computed(() => {
    let colors;

    if (props.color !== void 0) {
      colors =
        props.flat || props.outline
          ? `text-${props.textColor || props.color}`
          : `bg-${props.color} text-${props.textColor || 'white'}`;
    } else if (props.textColor) {
      colors = `text-${props.textColor}`;
    }

    const shape = props.round
      ? 'round'
      : `rectangle${isRounded.value ? ' q-btn--rounded' : props.square ? ' q-btn--square' : ''}`;

    return (
      `q-btn--${design.value} q-btn--${shape}` +
      (colors !== void 0 ? ' ' + colors : '') +
      (isActionable.value
        ? ' q-btn--actionable q-focusable q-hoverable'
        : props.disable
          ? ' disabled'
          : '') +
      (props.fab ? ' q-btn--fab' : props.fabMini ? ' q-btn--fab-mini' : '') +
      (props.noCaps ? ' q-btn--no-uppercase' : '') +
      (props.dense ? ' q-btn--dense' : '') +
      (props.stretch ? ' no-border-radius self-stretch' : '') +
      (props.glossy ? ' glossy' : '') +
      (props.square ? ' q-btn--square' : '')
    )
  });

  const innerClasses = computed(
    () =>
      alignClass.value +
      (props.stack ? ' column' : ' row') +
      (props.noWrap ? ' no-wrap text-no-wrap' : '') +
      (props.loading ? ' q-btn__content--hidden' : '')
  );

  return {
    classes,
    style,
    innerClasses,
    attributes,
    hasLink,
    linkTag,
    navigateOnClick,
    isActionable
  }
}

const { passiveCapture } = listenOpts;

let touchTarget = null,
  keyboardTarget = null,
  mouseTarget = null;

function onLoadingEvt(evt) {
  stopAndPrevent(evt);
  evt.qSkipRipple = true;
}

const QBtn = createComponent({
  name: 'QBtn',

  props: {
    ...useBtnProps,

    percentage: Number,
    darkPercentage: Boolean,

    onTouchstart: [Function, Array]
  },

  emits: ['click', 'keydown', 'mousedown', 'keyup'],

  setup(props, { slots, emit }) {
    const { proxy } = getCurrentInstance();

    const {
      classes,
      style,
      innerClasses,
      attributes,
      hasLink,
      linkTag,
      navigateOnClick,
      isActionable
    } = useBtn(props);

    const rootRef = ref(null);
    const blurTargetRef = ref(null);

    let localTouchTargetEl = null,
      avoidMouseRipple,
      mouseTimer = null,
      clickCleanup = null;

    const hasLabel = computed(
      () => props.label !== void 0 && props.label !== null && props.label !== ''
    );

    const ripple = computed(() =>
      props.disable || props.ripple === false
        ? false
        : {
            keyCodes: hasLink.value ? [13, 32] : [13],
            ...(props.ripple === true ? {} : props.ripple)
          }
    );

    const rippleProps = computed(() => ({ center: props.round }));

    const percentageStyle = computed(() => {
      const val = Math.max(0, Math.min(100, props.percentage));
      return val > 0
        ? {
            transition: 'transform 0.6s',
            transform: `translateX(${val - 100}%)`
          }
        : {}
    });

    const onEvents = computed(() => {
      if (props.loading) {
        return {
          onMousedown: onLoadingEvt,
          onTouchstart: onLoadingEvt,
          onClick: onLoadingEvt,
          onKeydown: onLoadingEvt,
          onKeyup: onLoadingEvt
        }
      }

      if (isActionable.value) {
        const acc = {
          onClick,
          onKeydown,
          onMousedown
        };

        if (proxy.$q.platform.has.touch) {
          const suffix = props.onTouchstart !== void 0 ? '' : 'Passive';

          acc[`onTouchstart${suffix}`] = onTouchstart;
        }

        return acc
      }

      return {
        // needed; especially for disabled <a> tags
        onClick: stopAndPrevent
      }
    });

    const nodeProps = computed(() => ({
      ref: rootRef,
      class: 'q-btn q-btn-item non-selectable no-outline ' + classes.value,
      style: style.value,
      ...attributes.value,
      ...onEvents.value
    }));

    function onClick(e) {
      // is it already destroyed?
      if (rootRef.value === null) return

      if (e !== void 0) {
        if (e.defaultPrevented) return

        const el = document.activeElement;
        // focus button if it came from ENTER on form
        // prevent the new submit (already done)
        if (
          props.type === 'submit' &&
          el !== document.body &&
          !rootRef.value.contains(el) &&
          // required for iOS and desktop Safari
          !el.contains(rootRef.value)
        ) {
          if (!e.qAvoidFocus) rootRef.value.focus();

          const onClickCleanup = () => {
            clickCleanup = null;
            document.removeEventListener('keydown', stopAndPrevent, true);
            document.removeEventListener(
              'keyup',
              onClickCleanup,
              passiveCapture
            );
            rootRef.value?.removeEventListener(
              'blur',
              onClickCleanup,
              passiveCapture
            );
          };

          clickCleanup = onClickCleanup;
          document.addEventListener('keydown', stopAndPrevent, true);
          document.addEventListener('keyup', onClickCleanup, passiveCapture);
          rootRef.value.addEventListener('blur', onClickCleanup, passiveCapture);
        }
      }

      navigateOnClick(e);
    }

    function onKeydown(e) {
      // is it already destroyed?
      if (rootRef.value === null) return

      emit('keydown', e);

      if (isKeyCode(e, [13, 32]) && keyboardTarget !== rootRef.value) {
        if (keyboardTarget !== null) cleanup();

        if (!e.defaultPrevented) {
          // focus external button if the focus helper was focused before
          if (!e.qAvoidFocus) rootRef.value.focus();

          keyboardTarget = rootRef.value;
          rootRef.value.classList.add('q-btn--active');
          document.addEventListener('keyup', onPressEnd, true);
          rootRef.value.addEventListener('blur', onPressEnd, passiveCapture);
        }

        stopAndPrevent(e);
      }
    }

    function onTouchstart(e) {
      // is it already destroyed?
      if (rootRef.value === null) return

      emit('touchstart', e);

      if (e.defaultPrevented) return

      if (touchTarget !== rootRef.value) {
        if (touchTarget !== null) cleanup();
        touchTarget = rootRef.value;

        localTouchTargetEl = e.target;
        localTouchTargetEl.addEventListener(
          'touchcancel',
          onPressEnd,
          passiveCapture
        );
        localTouchTargetEl.addEventListener(
          'touchend',
          onPressEnd,
          passiveCapture
        );
      }

      // avoid duplicated mousedown event
      // triggering another early ripple
      avoidMouseRipple = true;
      if (mouseTimer !== null) clearTimeout(mouseTimer);
      mouseTimer = setTimeout(() => {
        mouseTimer = null;
        avoidMouseRipple = false;
      }, 200);
    }

    function onMousedown(e) {
      // is it already destroyed?
      if (rootRef.value === null) return

      e.qSkipRipple = avoidMouseRipple === true;
      emit('mousedown', e);

      if (!e.defaultPrevented && mouseTarget !== rootRef.value) {
        if (mouseTarget !== null) cleanup();
        mouseTarget = rootRef.value;
        rootRef.value.classList.add('q-btn--active');
        document.addEventListener('mouseup', onPressEnd, passiveCapture);
      }
    }

    function onPressEnd(e) {
      // is it already destroyed?
      if (rootRef.value === null) return

      // needed for IE (because it emits blur when focusing button from focus helper)
      if (e?.type === 'blur' && document.activeElement === rootRef.value) return

      if (e?.type === 'keyup') {
        if (keyboardTarget === rootRef.value && isKeyCode(e, [13, 32])) {
          // for click trigger
          const evt = new MouseEvent('click', e);
          evt.qKeyEvent = true;
          if (e.defaultPrevented) prevent(evt);
          if (e.cancelBubble) stop(evt);
          rootRef.value.dispatchEvent(evt);

          stopAndPrevent(e);

          // for ripple
          e.qKeyEvent = true;
        }

        emit('keyup', e);
      }

      cleanup();
    }

    function cleanup(destroying) {
      clickCleanup?.();

      const blurTarget = blurTargetRef.value;

      if (
        !destroying &&
        (touchTarget === rootRef.value || mouseTarget === rootRef.value) &&
        blurTarget !== null &&
        blurTarget !== document.activeElement
      ) {
        blurTarget.setAttribute('tabindex', -1);
        blurTarget.focus({ preventScroll: true });
      }

      if (touchTarget === rootRef.value) {
        if (localTouchTargetEl !== null) {
          localTouchTargetEl.removeEventListener(
            'touchcancel',
            onPressEnd,
            passiveCapture
          );
          localTouchTargetEl.removeEventListener(
            'touchend',
            onPressEnd,
            passiveCapture
          );
        }
        touchTarget = localTouchTargetEl = null;
      }

      if (mouseTarget === rootRef.value) {
        document.removeEventListener('mouseup', onPressEnd, passiveCapture);
        mouseTarget = null;
      }

      if (keyboardTarget === rootRef.value) {
        document.removeEventListener('keyup', onPressEnd, true);
        rootRef.value?.removeEventListener('blur', onPressEnd, passiveCapture);
        keyboardTarget = null;
      }

      rootRef.value?.classList.remove('q-btn--active');
    }

    onBeforeUnmount(() => {
      cleanup(true);
    });

    // expose public methods
    Object.assign(proxy, {
      click: e => {
        if (isActionable.value) onClick(e);
      }
    });

    return () => {
      let inner = [];

      if (props.icon !== void 0) {
        inner.push(
          h(QIcon, {
            name: props.icon,
            left: !props.stack && hasLabel.value,
            role: 'img'
          })
        );
      }

      if (hasLabel.value) {
        inner.push(h('span', { class: 'block' }, [props.label]));
      }

      inner = hMergeSlot(slots.default, inner);

      if (props.iconRight !== void 0 && !props.round) {
        inner.push(
          h(QIcon, {
            name: props.iconRight,
            right: !props.stack && hasLabel.value,
            role: 'img'
          })
        );
      }

      const child = [
        h('span', {
          class: 'q-focus-helper',
          ref: blurTargetRef
        })
      ];

      if (props.loading && props.percentage !== void 0) {
        child.push(
          h(
            'span',
            {
              class:
                'q-btn__progress absolute-full overflow-hidden' +
                (props.darkPercentage ? ' q-btn__progress--dark' : '')
            },
            [
              h('span', {
                class: 'q-btn__progress-indicator fit block',
                style: percentageStyle.value
              })
            ]
          )
        );
      }

      child.push(
        h(
          'span',
          {
            class:
              'q-btn__content text-center col items-center q-anchor--skip ' +
              innerClasses.value
          },
          inner
        )
      );

      if (props.loading !== null) {
        child.push(
          h(
            Transition,
            {
              name: 'q-transition--fade'
            },
            () =>
              props.loading
                ? [
                    h(
                      'span',
                      {
                        key: 'loading',
                        class: 'absolute-full flex flex-center'
                      },
                      slots.loading !== void 0 ? slots.loading() : [h(QSpinner)]
                    )
                  ]
                : null
          )
        );
      }

      return withDirectives(h(linkTag.value, nodeProps.value, child), [
        [Ripple, ripple.value, void 0, rippleProps.value]
      ])
    }
  }
});

export { QBtn as Q, useSize as a, vmIsDestroyed as b, QIcon as c, QSpinner as d, isKeyCode as i, shouldIgnoreKey as s, useSizeProps as u, vmHasRouter as v };
//# sourceMappingURL=QBtn.mjs.map
