<template>
	<div>
		<div>
			<a-space>
				<a-button @click="openModal">发布新公告</a-button>
				<a-button @click="deleteAnnounments">删除公告</a-button>
			</a-space>
		</div>
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
					</template>
					<a-skeleton avatar :title="false" :loading="initLoading" active>
					<a-list-item-meta
						:description="'发布时间：'+item.publish_time.slice(0,10)"
					>
						<template #title>
							<a-checkbox v-model:checked="item.checked"><a-tag color="blue">{{ '发布者：'+item.publisher_username }}</a-tag></a-checkbox>
						</template>
					</a-list-item-meta>
					{{ item.announcement_content }}
					</a-skeleton>
				</a-list-item>
				</template>
			</a-list>
		</div>
		<a-pagination @change="loadGroupAnnouncements" v-model:current="pageInfo.currentPage" v-model:total="pageInfo.total" v-model:pageSize="pageInfo.pageSize" show-less-items />
		<a-modal v-model:open="open" title="发布公告" @ok="submitAnnouncement">
			<a-textarea showCount v-model:value="announcement_content" placeholder="请输入公告内容" :rows="7"></a-textarea>
		</a-modal>
	</div>
</template>
  
<script setup>
	import { ref,reactive, inject, onMounted, watch} from "vue";
	import { useRoute, useRouter } from "vue-router";

	const notify = inject("notify")

	const router = useRouter()
	const route = useRoute()
	const axios = inject("axios")
	const server_url = inject("server_url")

	const initLoading = ref(true)

	const list = ref([])
	let open = ref(false)
	let disabled = ref(true)
	let announcement_content = ref("")

	const pageInfo = reactive({
		currentPage: 1,
		pageSize: 5,
		total: 0
	})

	const loadGroupAnnouncements = async () => {
		initLoading.value = true
		try {
			let res = await axios.get("group/announcement/list?group_id="+group_id+"&&page="+pageInfo.currentPage+"&&limit="+pageInfo.pageSize)

			if (res.data.status == 'success') {
				pageInfo.total = res.data.data.pagination.total
				list.value = res.data.data.announcements.map(item => {
					return {
						...item,
						checked: false
					}
				})
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

	const openModal = () => {
		open.value = true
	}

	let group_id = -1
	let role = -1

	onMounted(async () => {
		group_id = sessionStorage.getItem('group_id')
		role = sessionStorage.getItem('role')
		await loadGroupAnnouncements()
	})

	const submitAnnouncement = async () => {
		if (announcement_content.value.length == 0) {
			notify("公告内容不能为空！")
			return
		}
		try {
			let res = await axios.post("group/announcement/create", {
				group_id,
				announcement_content: announcement_content.value
			})

			if (res.data.status == 'success') {
				notify("发布成功！")
				announcement_content.value = ""
				open.value = false
				await loadGroupAnnouncements()
			}
			
		} catch(err) {
			if (err.response) {
				notify("Error: " + (err.response.data.message), 'error');
			} else {
				notify("Error: " + err.message, 'error');
			}
		}
	}

	const deleteAnnounments = async () => {
		let ids = []
		for (let anno of list.value) {
			if (anno.checked) {
				ids.push(anno.announcement_id)
			}
		}
		if (ids.length === 0) {
			notify("未选择任何！")
			return
		}
		initLoading.value = true
		try {
			let res = await axios.post("group/announcements/delete", {
				announcement_ids:ids
			})

			if (res.data.status == 'success') {
				notify("删除成功！")
				await loadGroupAnnouncements()
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

</script>

<style lang="scss" scoped>
</style>