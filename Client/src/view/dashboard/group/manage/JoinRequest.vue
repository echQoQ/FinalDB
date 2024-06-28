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
				<a-list-item class="list-item">
					<template v-if="currentType[0] == 'sub1'" #actions>
						<button @click="handleRequest(item)">处理</button>
					</template>
					<a-skeleton :title="false" :loading="initLoading" active>
					<a-list-item-meta
					>
						<template #title>
						 {{ '申请人: ' + item.username }}
						</template>
						<template #description>
							<span  v-if="currentType[0] == 'sub2'">
								{{ item.status==1?'已同意':'已拒绝' }}
							</span>
						</template>
					</a-list-item-meta>
					<div v-if="currentType[0] == 'sub2'">
						{{ '处理人：'+item.handler }}
					</div>
					</a-skeleton>
				</a-list-item>
				</template>
			</a-list>
		</div>
		<a-pagination @change="changePage" v-model:current="pageInfo.currentPage" v-model:total="pageInfo.total" v-model:pageSize="pageInfo.pageSize" show-less-items />
	
		<a-modal v-model:open="open" title="处理申请" @ok="handleOk">
			<a-form>
				<a-form-item label="处理结果">
					<a-radio-group v-model:value="applyResult">
						<a-radio-button value="agree">同意</a-radio-button>
						<a-radio-button value="reject">拒绝</a-radio-button>
					</a-radio-group>
				</a-form-item>
			</a-form>
		</a-modal>
	</div>
	
</template>

<script setup>
	import { ref,reactive, inject, onMounted, computed, watch, h } from "vue";
	import { useRoute, useRouter } from "vue-router";
	

	const notify = inject("notify")

	const router = useRouter()
	const route = useRoute()
	const axios = inject("axios")
	const server_url = inject("server_url")


	const applyResult = ref('agree')
	const open = ref(false)
	const currentType = ref(['sub1']);
	const list = ref([])
	const data = ref([])
	const initLoading = ref(true)
	const pageInfo = reactive({
		currentPage: 1,
		pageSize: 5,
		total: 0
	})
	const menuItems = ref([
		{
			key: 'sub1',
			label: '未处理的',
			title: '未处理的',
		},
		{
			key: 'sub2',
			label: '已处理的',
			title: '已处理的',
		}])
	
	watch(currentType, val => {
		if (val[0] == 'sub1')
			data.value = all_requests.pendingRequests
		else if (val[0] == 'sub2') 
			data.value = all_requests.handledRequests
		pageInfo.currentPage = 1
		pageInfo.pageSize = 5
		pageInfo.total = data.value.length
		changePage()
	})

	const changePage = () => {
		list.value = data.value.slice((pageInfo.currentPage-1)*pageInfo.pageSize,pageInfo.currentPage*pageInfo.pageSize)
	}

	let group_id = 0

	let all_requests = []

	onMounted( async () => {
		group_id = route.query.group_id
		await loadJoinRequests()
	})

	const loadJoinRequests = async () => {
		initLoading.value = true
		try {
			let res = await axios.post("group/join_request/list", {
				group_id
			})

			if (res.data.status == 'success') {
				all_requests = res.data.data
				data.value = all_requests.pendingRequests
				changePage()
				//console.log(all_requests)
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

	let cur_item = {}

	const handleRequest = async item => {
		open.value = true
		cur_item = item
	}

	const handleOk = async () => {
		let status = 1
		if (applyResult.value == 'reject')
			status = 2
		try {
			let res = await axios.post("group/join_request/handle", {
				request_id: cur_item.request_id,
				status
			})

			if (res.data.status == 'success') {
				console.log(res.data)
			}
			
		} catch(err) {
			if (err.response) {
				notify("Error: " + (err.response.data.message), 'error');
			} else {
				notify("Error: " + err.message, 'error');
			}
		}
		open.value = false
		await loadJoinRequests()
	}

</script>

<style lang="scss" scoped>
	.list-item {
		margin: 5px;
	}
</style>