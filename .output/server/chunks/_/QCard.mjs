import { computed, getCurrentInstance, h } from 'vue';
import { c as createComponent } from '../virtual/entry.mjs';
import { a as hSlot } from './render.mjs';

const useDarkProps = {
  dark: {
    type: Boolean,
    default: null
  }
};

function useDark(props, $q) {
  // return isDark
  return computed(() => (props.dark === null ? $q.dark.isActive : props.dark))
}

const QCard = createComponent({
  name: 'QCard',

  props: {
    ...useDarkProps,

    tag: {
      type: String,
      default: 'div'
    },

    square: Boolean,
    flat: Boolean,
    bordered: Boolean
  },

  setup(props, { slots }) {
    const {
      proxy: { $q }
    } = getCurrentInstance();
    const isDark = useDark(props, $q);

    const classes = computed(
      () =>
        'q-card' +
        (isDark.value ? ' q-card--dark q-dark' : '') +
        (props.bordered ? ' q-card--bordered' : '') +
        (props.square ? ' q-card--square no-border-radius' : '') +
        (props.flat ? ' q-card--flat no-shadow' : '')
    );

    return () => h(props.tag, { class: classes.value }, hSlot(slots.default))
  }
});

export { QCard as Q, useDark as a, useDarkProps as u };
//# sourceMappingURL=QCard.mjs.map
