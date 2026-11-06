import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.css'

const app = createApp(App)

app.config.errorHandler = (error, _instance, info) => {
  console.error(`Questline renderer error (${info}):`, error)
}

app.mount('#app')
