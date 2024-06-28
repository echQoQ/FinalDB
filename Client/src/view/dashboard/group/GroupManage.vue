<template>
	<div>
		<a-layout>
			<a-layout-content :style="{minHeight: '80vh'}">
				<router-view></router-view>
			</a-layout-content>
			<a-layout-sider style="background-color: var(--bg-color);">
				<div>
					<a-space>
						<a-avatar :size="50" :src="groupInfo.group_avatar" class="header-item" />
						<div color="blue" class="header-item">{{groupInfo.group_name}}</div>
					</a-space>
					<a-tag style="margin: 20px;">{{ groupInfo.description }}</a-tag>
				</div>
				<a-menu
					id="mmmm"
					v-model:openKeys="openKeys"
					v-model:selectedKeys="selectedKeys"
					mode="inline"
					:items="items"
					@click="handleClick"
				></a-menu>
			</a-layout-sider>
		</a-layout>
	</div>
</template>

<script setup>
	import { ref,reactive, inject, onMounted, computed, watch, h } from "vue";
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


	const selectedKeys = ref(['group-members']);
	const openKeys = ref(['groups']);
	const groupInfo = reactive({
		group_id: -1,
		group_name: '',
		group_avatar: '',
		description: ''
	})

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
		getItem('群组成员', 'group-members'),
		getItem('入群申请', 'join-request'),	
		getItem('群公告管理', 'group-announcements'),
		getItem('群信息', 'group-update'),
	]);


	let group_id = 0

	onMounted(async () => {
		group_id = route.query.group_id
		await loadGroupDetails()
		router.push({
			name: selectedKeys.value[0],
			query: {
				group_id
			}
		})
	})

	const handleClick = e => {
		console.log('click', e.key);
		router.push({
			name: e.key,
			query: {
				group_id
			}
		})
	};

	const loadGroupDetails = async () => {
		try {
			let res = await axios.post("group/details", {
				group_id:group_id
			})
			if (res.data.status == 'success') {
			if (res.data.data.role == -1) {
				notify("你不是该群组的成员")
				router.push({
				name: 'group-mine'
				})
				return
			}
			sessionStorage.setItem('group_id', group_id)
			sessionStorage.setItem('role', res.data.data.role)
			groupInfo.group_id = group_id
			groupInfo.group_name = res.data.data.group.group_name
			groupInfo.group_avatar = server_url + res.data.data.group.group_avatar
			groupInfo.description = res.data.data.group.description
			console.log('已重新加载',groupInfo)
			}
		} catch (err) {
			if (err.response) {
			notify("Error: " + (err.response.data.message), 'error');
			} else {
			notify("Error: " + err.message, 'error');
			}
		}
	}

</script>

<style>
#mmmm {
	background-color: var(--bg-color);
}
</style>