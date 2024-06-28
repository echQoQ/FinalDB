<template>
	<div>
		<div class="list">
			<a-list
				class="data-list"
				:loading="initLoading"
				item-layout="horizontal"
				:data-source="list"
			>
				<template #renderItem="{ item }">
				<a-list-item >
					<template #actions>
						<div v-if="role==0">
							<a-button @click="grant(item)" v-if="item.role==2">
								设置为管理员
							</a-button>
							<a-button @click="revoke(item)" v-if="item.role==1">
								取消管理员
							</a-button>
						</div>
						<div v-if="role < item.role">
							<a-popconfirm
								title="确定将其移除？"
								ok-text="是的"
								cancel-text="取消"
								@confirm="removeMembers([item.user_id])"
							>
								<a-button>
									踢出群聊
								</a-button>
							</a-popconfirm>
						</div>
					</template>
					<a-skeleton avatar :title="false" :loading="initLoading" active>
					<a-list-item-meta
						:description="'入群时间：'+item.join_time"
					>
						<template #title>
							<a-tag>{{ item.role == 0 ? '群主' : item.role == 1? '管理员':'普通成员' }}</a-tag>
						 {{ item.username }}
						</template>
						<template #avatar>
						<a-avatar :src="server_url + item.avatar" />
						</template>
					</a-list-item-meta>
					</a-skeleton>
				</a-list-item>
				</template>
			</a-list>
		</div>
		<a-pagination @change="changePage" v-model:current="pageInfo.currentPage" v-model:total="pageInfo.total" v-model:pageSize="pageInfo.pageSize" show-less-items />
	</div>
</template>
  
<script setup>
	import { ref,reactive, inject, onMounted, watch} from "vue";
	import { useRoute, useRouter } from "vue-router";
	import { 
		SearchOutlined 
	} from '@ant-design/icons-vue';

	const notify = inject("notify")

	const router = useRouter()
	const route = useRoute()
	const axios = inject("axios")
	const server_url = inject("server_url")

	const initLoading = ref(true)

	const list = ref([])
	const data = ref([])

	const pageInfo = reactive({
		currentPage: 1,
		pageSize: 5,
		total: 0
	})

	const loadGroupMembers = async () => {
		initLoading.value = true
		try {
			let res = await axios.get("group/member/list?group_id="+group_id)

			if (res.data.status == 'success') {
				pageInfo.currentPage = 1
				pageInfo.total = res.data.data.length
				data.value = res.data.data
				changePage()
			}
			
		} catch(err) {
			if (err.response) {
				notify("Error: " + (err.response.data.message), 'error');
			} else {
				notify("Error: " + err.message, 'error');
			}
		}
		initLoading.value = false
	}

	let group_id = -1
	let role = -1

	onMounted(async () => {
		group_id = sessionStorage.getItem('group_id')
		role = sessionStorage.getItem('role')
		await loadGroupMembers()
	})

	const changePage = () => {
		list.value = data.value.slice((pageInfo.currentPage-1)*pageInfo.pageSize,pageInfo.currentPage*pageInfo.pageSize)
	}

	const removeMembers = async (member_ids) => {
		try {
			let res = await axios.post("group/member/remove", {
				group_id,
				member_ids
			})

			if (res.data.status == 'success') {
				notify("已移除")
			}
			
		} catch(err) {
			if (err.response) {
				notify("Error: " + (err.response.data.message), 'error');
			} else {
				notify("Error: " + err.message, 'error');
			}
		}
		await loadGroupMembers()
	}

	const grant = async item => {
		try {
			let res = await axios.post("group/admin/grant", {
				group_id: group_id,
				user_id:  item.user_id
			})

			if (res.data.status == 'success') {
				notify("已设置为管理员")
				item.role = 1
			}
			
		} catch(err) {
			if (err.response) {
				notify("Error: " + (err.response.data.message), 'error');
			} else {
				notify("Error: " + err.message, 'error');
			}
		}
	}

	const revoke = async item => {
		try {
			let res = await axios.post("group/admin/revoke", {
				group_id: group_id,
				user_id:  item.user_id
			})

			if (res.data.status == 'success') {
				notify("已取消管理员")
				item.role = 2
			}
			
		} catch(err) {
			if (err.response) {
				notify("Error: " + (err.response.data.message), 'error');
			} else {
				notify("Error: " + err.message, 'error');
			}
		}
	}

</script>

<style lang="scss" scoped>
</style>