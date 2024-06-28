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
        component: () => import("@/view/user/Signup.vue")
    }, {
        path: "/login",
        name: "login",
        component: () => import("@/view/user/Login.vue")
    }, {
        path: "/dashboard",
        name: "dashboard",
        component: () => import("@/view/dashboard/Dashboard.vue"),
        children: [
            {
                path: "/dashboard/user-info",
                name: "user-info",
                component: () => import("@/view/dashboard/UserInfo.vue")
            }, {
                path: "/dashboard/group-create",
                name: "group-create",
                component: () => import("@/view/dashboard/CreateGroup.vue")
            }, {
                path: "/dashboard/group-search",
                name: "group-search",
                component: () => import("@/view/dashboard/GroupSearch.vue")
            }, {
                path: "/dashboard/group-mine",
                name: "group-mine",
                component: () => import("@/view/dashboard/GroupMine.vue")
            }, {
                path: "/dashboard/group",
                name: "group",
                component: () => import("@/view/dashboard/group/Group.vue"),
                children: [
                    {
                        path: "/dashboard/group/manage",
                        name: "group-manage",
                        component: () => import("@/view/dashboard/group/GroupManage.vue"),
                        children: [
                            {
                                path: "/dashboard/group/manage/join-request",
                                name: "join-request",
                                component: () => import("@/view/dashboard/group/manage/JoinRequest.vue"),
                            }, {
                                path: "/dashboard/group/manage/group-members",
                                name: "group-members",
                                component: () => import("@/view/dashboard/group/manage/GroupMembers.vue")
                            }, {
                                path: "/dashboard/group/manage/group-announments",
                                name: "group-announcements",
                                component: () => import("@/view/dashboard/group/manage/GroupAnnouncements.vue")
                            }, {
                                path: "/dashboard/group/manage/group-update",
                                name: "group-update",
                                component: () => import("@/view/dashboard/group/manage/GroupUpdate.vue")
                            }
                        ]
                    }, {
                        path: "/dashboard/group/chat",
                        name: "group-chat",
                        component: () => import("@/view/dashboard/group/GroupChat.vue")
                    }
                ]
            }
        ]
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export { router,routes }