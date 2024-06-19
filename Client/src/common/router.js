import { createRouter, createWebHashHistory } from "vue-router"


let routes = [
    {
        path: "/",
        name: "index",
        component: () => import("@/view/Home.vue")
    }, {
        path: "/home",
        name: "home",
        component: () => import("@/view/Home.vue")
    }, {
        path: "/signup",
        name: "signup",
        component: () => import("../view/user/Signup.vue")
    }, {
        path: "/login",
        name: "login",
        component: () => import("../view/user/Login.vue")
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export { router,routes }