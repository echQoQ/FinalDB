<template>
	<div>
		<a-form
			layout="inline"
			@submit="research"
		>
		<a-form-item>
		<a-input v-model:value="keyword" placeholder="请输入关键词">
			<template #prefix><SearchOutlined style="color: rgba(0, 0, 0, 0.25)" /></template>
		</a-input>
		</a-form-item>
		<a-button
			type="primary"
			html-type="submit"
			:disabled="keyword === ''"
		>搜索</a-button>
		</a-form>
		<div class="list">
			<a-list
				class="data-list"
				:loading="initLoading"
				item-layout="horizontal"
				:data-source="list"
			>
				<template #renderItem="{ item }">
				<a-list-item>
					<template #actions>
						<a-popconfirm
							title="确定发送申请？"
							ok-text="是的"
							cancel-text="否"
							@confirm="confirmApply(item.group_id)"
						>
							<a-button v-if="!item.is_member">
								申请加入
							</a-button>
						</a-popconfirm>
						
					</template>
					<a-skeleton avatar :title="false" :loading="initLoading" active>
					<a-list-item-meta
						:description="item.description"
					>
						<template #title>
						 {{ item.group_name }}
						</template>
						<template #avatar>
						<a-avatar :src="server_url + item.group_avatar" />
						</template>
					</a-list-item-meta>
					<div>{{ '群主：'+item.owner_username }}</div>
					</a-skeleton>
				</a-list-item>
				</template>
			</a-list>
		</div>
		<a-pagination @change="changePage" v-model:current="pageInfo.currentPage" v-model:total="pageInfo.total" v-model:pageSize="pageInfo.pageSize" show-less-items />
	</div>
</template>
  
<script setup>
	import { ref,reactive, inject, onMounted, computed, watch, h } from "vue";
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

	const keyword = ref('')
	const list = ref([])

	const pageInfo = reactive({
		currentPage: 1,
		pageSize: 5,
		total: 0
	})

	const search = async () => {
		initLoading.value = true
		try {
			let res = await axios.post("group/list", {
				keyword: keyword.value,
				page: pageInfo.currentPage ? pageInfo.currentPage : 1,
				limit: pageInfo.pageSize
			})

			if (res.data.status == 'success') {
				pageInfo.currentPage = res.data.data.page
				pageInfo.total = res.data.data.total
				list.value = res.data.data.groups
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
		keyword.value = '%'
		await search()
		keyword.value = ''
	})

	const changePage = async () => {
		await search()
	}

	const research = async () => {
		pageInfo.currentPage = 1
		pageInfo.total = 0
		await search()
	}

	const confirmApply = async (group_id) => {
		try {
			let res = await axios.post("group/join_request/send", {
				group_id
			})

			if (res.data.status == 'success') {
				notify("发送申请成功！")
			}
			
		} catch(err) {
			notify("请勿重复申请")
		}
	}

</script>

<style lang="scss" scoped>
</style>