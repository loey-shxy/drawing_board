import { createApp } from 'vue'
import "@excalidraw/excalidraw/index.css";
import './style.scss'
import App from './App.vue'

import { createRoot } from 'react-dom/client'
import { setVeauryOptions } from 'veaury'
setVeauryOptions({
  react: {
    createRoot
  }
})

createApp(App).mount('#app')
