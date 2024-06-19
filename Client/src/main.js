import { createApp, provide } from 'vue'
import '@/assets/css/style.css'

import { router } from "@/common/router"
import axios from "axios"
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import 'vfonts/Lato.css'
import App from './App.vue'
import { notification } from 'ant-design-vue';


const app = createApp(App)

app.use(router)
app.use(Antd)


axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL

axios.interceptors.request.use((config) => {
    config.headers.token = sessionStorage.getItem("token")
    return config
})

app.provide('axios', axios)

app.provide('server_url', import.meta.env.VITE_SERVER_URL)

const notify = (msg) => {
    notification.open({
        message: msg,
        duration: 1,
    });
};

app.provide('notify', notify)


app.mount('#app')