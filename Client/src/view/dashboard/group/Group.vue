<template>
  <div>
    <a-menu class="menu" v-model:selectedKeys="currentType" mode="horizontal" :items="menuItems" />
    <router-view></router-view>
  </div>
</template>

<script setup>
const headerStyle = {
  textAlign: 'center',
  color: '#fff',
  height: 64,
  paddingInline: 50,
  lineHeight: '64px',
  backgroundColor: 'var(--bg-color)',
};

import { ref, reactive, inject, onMounted, computed, watch, h } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  HomeOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  SettingOutlined
} from '@ant-design/icons-vue';


const notify = inject("notify")

const router = useRouter()
const route = useRoute()
const axios = inject("axios")
const server_url = inject("server_url")

let group_id = 0
const currentType = ref(['group-chat']);
const menuItems = ref([
  {
    key: 'group-manage',
    label: '群管理',
    title: '群管理',
  }, {
    key: 'group-chat',
    label: '群聊天',
    title: '群聊天',
  }
])

watch(currentType, val => {
  router.push({
    name: val[0],
    query: {
      group_id
    }
  })
})

onMounted(async () => {
  group_id = route.query.group_id
  router.push({
    name: 'group-chat',
    query: {
      group_id
    }
  })
})

</script>

<style lang="scss" scoped>
.menu {
  background-color: aqua;
}
</style>