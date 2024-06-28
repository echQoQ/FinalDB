<template>
	<div>
		<div class="list">
			<a-list
				class="data-list"
				:loading="initLoading"
				item-layout="horizontal"
				:data-source="list"
			>
				<template #loadMore>
					<div
						v-if="!initLoading && loading"
						:style="{ textAlign: 'center', marginTop: '12px', height: '32px', lineHeight: '32px' }"
					>
						<a-button @click="onLoadMore">加载更多</a-button>
					</div>
				</template>
				<template #renderItem="{ item }">
					<a-list-item >
						<a-skeleton avatar :title="false" :loading="initLoading" active>
						<a-list-item-meta
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
  
	const props = defineProps({
	  group_id: String
	})
	const list = ref([])
	const data = ref([])

	const pageInfo = reactive({
		currentIndex: 0,
		pageSize: 5,
		total: 0
	})
	let initLoading = ref(true)
	let loading = ref(true)
  
	onMounted(async () => {
	  await loadGroupMembers()
	})
  
	const loadGroupMembers = async () => {
		initLoading.value = true
		try {
			let res = await axios.get("group/member/list?group_id="+props.group_id)

			if (res.data.status == 'success') {
				pageInfo.currentIndex = 0
				pageInfo.total = res.data.data.length
				data.value = res.data.data
				onLoadMore()
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

	const onLoadMore = () => {
		let i = pageInfo.currentIndex
		for (; i < Math.min(pageInfo.currentIndex+pageInfo.pageSize,pageInfo.total); i++) {
			list.value.push(data.value[i])
		}
		pageInfo.currentIndex = i
		if (i == pageInfo.total) {
			loading.value = false
		}
	}
  
  
  </script>
  
  <style>
  
  </style>