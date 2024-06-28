<template>
	<div>
		<a-menu v-model:selectedKeys="currentType" mode="horizontal" :items="menuItems" />
		<div class="list">
			<a-list
				class="data-list"
				:loading="initLoading"
				item-layout="horizontal"
				:data-source="list"
			>
				<template #renderItem="{ item }">
				<a-list-item style="cursor: pointer;">
					<template #actions>
							<a-popconfirm v-if="currentType[0] != 'sub1'"
								title="是否确定退出？"
								ok-text="是的"
								cancel-text="取消"
								@confirm="exitGroup(item.group_id)"
							>
								<a-button :disabled="item.sender_id != user_id && role !=0 && role != 1">
									退出该群
								</a-button>
							</a-popconfirm>
							<a-popconfirm v-else
								title="是否确定解散？"
								ok-text="是的"
								cancel-text="取消"
								@confirm="deleteGroup(item.group_id)"
							>
								<a-button :disabled="item.sender_id != user_id && role !=0 && role != 1">
									解散群聊
								</a-button>
							</a-popconfirm>
						</template>
					<a-skeleton avatar :title="false" :loading="initLoading" active>
					<a-list-item-meta
						:description="item.description"
						 @click="router.push({name:'group',query:{group_id:item.group_id}})"
					>
						<template #title>
						 {{ item.group_name }}
						</template>
						<template #avatar>
							<a-avatar :src="server_url + item.group_avatar" />
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


	const currentType = ref(['sub1']);
	const menuItems = ref([
		{
			key: 'sub1',
			label: '我创建的群',
			title: '我创建的群',
		},
		{
			key: 'sub2',
			label: '我管理的群',
			title: '我管理的群',
		}, {
			key: 'sub3',
			label: "我加入的群",
			title: '我加入的群'
		}])
	
	watch(currentType, val => {
		let tp = 0
		if (val[0] == 'sub1')
			tp = 0
		else if (val[0] == 'sub2') 
			tp = 1 
		else 
			tp = 2
		loadData(tp)
		pageInfo.currentPage = 1
		pageInfo.pageSize = 5
		pageInfo.total = data.value.length
		changePage()
	})

	const loadData = (tp) => {
		data.value = []
		totalData.value.forEach(item => {
			if (item.role == tp)
				data.value.push(item)
		})
	}

	const initLoading = ref(true)

	const list = ref([])
	const data = ref([])
	const totalData = ref([])

	const pageInfo = reactive({
		currentPage: 1,
		pageSize: 5,
		total: 0
	})

	const loadMyGroups = async () => {
		initLoading.value = true
		try {
			let res = await axios.get("group/mine")

			if (res.data.status == 'success') {
				pageInfo.currentPage = 1
				pageInfo.total = res.data.data.length
				totalData.value = res.data.data
				loadData(0)
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

	onMounted(async () => {
		await loadMyGroups()
	})

	const changePage = () => {
		list.value = data.value.slice((pageInfo.currentPage-1)*pageInfo.pageSize,pageInfo.currentPage*pageInfo.pageSize)
	}

	const exitGroup = async gid => {
		try {
			let res = await axios.post("group/leave", {
				group_id:gid
			})

			if (res.data.status == 'success') {
				notify("已退出！")
				await loadMyGroups()
			}
			
		} catch(err) {
			if (err.response) {
				notify("Error: " + (err.response.data.message), 'error');
			} else {
				notify("Error: " + err.message, 'error');
			}
		}
	}

	const deleteGroup = async gid => {
		try {
			let res = await axios.post("group/delete", {
				group_id:gid
			})

			if (res.data.status == 'success') {
				notify("已解散！")
				await loadMyGroups()
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