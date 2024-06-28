<template>
	<a-layout style="background-color: var(--bg-color);">
		<a-layout-header class="header">
			<div class="header-left">
				<a-avatar :src="UserInfo.avatar" class="header-item" />
				<span class="header-item">{{UserInfo.username}}</span>
			</div>
			<div class="header-right">
				<HomeOutlined class="header-item" @click="router.push('/')" :style="{fontSize: '20px', color: 'var(--text-color)', cursor: 'pointer'}" />
				<LogoutOutlined @click="logout" :style="{fontSize: '20px', color: 'var(--text-color)', cursor: 'pointer'}" />
			</div>
		</a-layout-header>
		<a-layout>
		<a-layout-sider width="200" style="background-color: var(--shadow-color);">
			<a-menu
				id="dddddd"
				v-model:openKeys="openKeys"
				v-model:selectedKeys="selectedKeys"
				mode="inline"
				:items="items"
				@click="handleClick"
			></a-menu>
		</a-layout-sider>
		<a-layout style="padding: 0 24px 24px;">
			<a-layout-content
				:style="{  padding: '5px', margin: 0, minHeight: '82vh' }"
			>
			<router-view></router-view>
			</a-layout-content>
		</a-layout>
		</a-layout>
		<a-divider style="height: 2px;" />
	</a-layout>
</template>

<script setup>
	import { ref,reactive, inject, onMounted, computed, watch, h } from "vue";
	import { useRoute, useRouter } from "vue-router";
	import { 
		HomeOutlined,
		LogoutOutlined,
		AppstoreOutlined, 
		SettingOutlined,
		UserOutlined
	} from '@ant-design/icons-vue';
	

	const notify = inject("notify")

	const router = useRouter()
	const route = useRoute()
	const axios = inject("axios")
	const server_url = inject("server_url")

	const UserInfo = reactive({
		avatar: '',
		username: '',
	})

	onMounted(async () => {
		if (! sessionStorage.getItem('token')) {
			router.push({
				name: 'login'
			})
		} else {
			UserInfo.username = sessionStorage.getItem('username')
		}
		try {
			let res = await axios.get("/user/avatar");
			if (res.status == 200 && res.data.status === "success") {
				UserInfo.avatar = server_url + res.data.data.avatar
			}
		} catch(err) {
			if (err.response) {
				notify("Error: " + (err.response.data.message), 'error');
			} else {
				notify("Error: " + err.message, 'error');
			}
		}
		router.push({
			name: 'group-mine'
		})
	})

	const selectedKeys = ref(['group-mine']);
	const openKeys = ref(['groups']);

	function getItem(label, key, icon, children, type) {
		return {
			key,
			icon,
			children,
			label,
			type,
		};
	}
	const items = reactive([
		getItem('群聊', 'groups', () => h(AppstoreOutlined), [
			getItem('我的', 'group-mine'),
			getItem('搜索', 'group-search'),
			getItem('创建', 'group-create'),
		]),
		getItem('用户', 'user-info', () => h(UserOutlined)),
	]);
	
	
	const handleClick = e => {
		router.push({
			name: e.key,
		})
	};

	const logout  = () => {
		sessionStorage.clear()
		router.push({
			name: 'home',
		})
	}
</script>
<style lang="scss" scoped>
.header {
	color:aquamarine;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 24px;
	.header-item {
		margin-right: 18px;
	}
}
</style>