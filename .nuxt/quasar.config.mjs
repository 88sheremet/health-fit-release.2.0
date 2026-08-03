import lang from "quasar/lang/en-US.js"
import iconSet from "quasar/icon-set/material-icons.js"
import { Notify,Dialog } from "quasar"


export const componentsWithDefaults = {  }

export const appConfigKey = "nuxtQuasar"

export const quasarNuxtConfig = {
  lang,
  iconSet,
  components: {"defaults":{},"autoImport":true},
  plugins: {Notify,Dialog},
  config: {"brand":{"primary":"#4caf50"}}
}