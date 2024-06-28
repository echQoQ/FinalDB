<template>
    <a-layout>
		<a-layout-content :style="{minHeight: '80vh'}">
			<div class="message-container" id="chatContainer">
				<a-list
					:data-source="messageList"
					item-layout="horizontal"
					split="false"
				>
					<template #header>
						<a-button v-if="loading" @click="loadMessages">加载更多</a-button>
					</template>
					<template #renderItem="{ item }">
					<a-list-item style="margin-top: 10px;display: flex;justify-content: flex-start;">
						<template #actions>
						<a-popconfirm
							title="确定将其撤回？"
							ok-text="是的"
							cancel-text="取消"
							@confirm="revokeMessage(item)"
						>
							<a-button :disabled="item.sender_id != user_id && role !=0 && role != 1">
								撤回
							</a-button>
						</a-popconfirm>
						</template>
						<a-list-item-meta
						>
							<template #title>
								<a-tag :color="item.role == 0 ? 'blue' : item.role == 1? 'yellow':'pink'">{{ item.role == 0 ? '群主' : item.role == 1? '管理员':'普通成员' }}</a-tag>
								{{ item.username }}
							</template>
							<template #avatar>
							<a-avatar :src="server_url+item.avatar" />
							</template>
						</a-list-item-meta>
						<div style="width: 100%;display: flex;padding-left: 70px;">
							<div class="content">
							{{ item.message_content }}
						</div>
						</div>
						
					</a-list-item>
					</template>
				</a-list>
			</div>
			<div class="input-container">
				<a-input-search
				v-model:value="inputValue"
				placeholder="请输入"
				size="large"
				@search="sendMessage"
				>
				<template #enterButton>
					<a-button :disabled="inputValue.length == 0">发送</a-button>
				</template>
				</a-input-search>
			</div>
		</a-layout-content>
		<a-layout-sider style="background-color: var(--bg-color);">
			<div>
				<a-space>
					<a-avatar :size="50" :src="groupInfo.group_avatar" class="header-item" />
					<div color="blue" class="header-item">{{groupInfo.group_name}}</div>
				</a-space>
				<a-tag style="margin: 20px;">{{ groupInfo.description }}</a-tag>
			</div>
			<show-announcements :group_id="group_id"></show-announcements>
			<show-members :group_id="group_id"></show-members>
		</a-layout-sider>
	</a-layout>
</template>

<script setup>
	import ShowAnnouncements from "./chat/ShowAnnouncements.vue";
	import ShowMembers from "./chat/ShowMembers.vue"

	import { ref,reactive, inject, computed,onMounted, watch, onBeforeMount, onBeforeUnmount, nextTick } from "vue";
	import { useRoute, useRouter } from "vue-router";
	import io from "socket.io-client";

	const notify = inject("notify")

	const router = useRouter()
	const route = useRoute()
	const axios = inject("axios")
	const server_url = inject("server_url")


	const socket = io(server_url);
	

	socket.on("message recalled", (message_id) => {
		messageList0.value = messageList0.value.filter(item => item.message_id != message_id)
		pageInfo.cur --
	})

	socket.on("received message", (new_message) => {
		messageList0.value = [new_message].concat(messageList0.value)
		pageInfo.cur ++
		nextTick(scrollToBottom())
	})

	let group_id = ref("")
	const groupInfo = reactive({
		group_id: -1,
		group_name: '',
		group_avatar: '',
		description: ''
	})
	const pageInfo = reactive({
		cur: 0,
		pageSize: 7,
		total: 0
	})
	const messageList0 = ref([])
	const inputValue = ref("")
	const initLoading = ref("true")
	const loading = ref("false")
	let token = ""
	let user_id = -1
	let role = 2
	onBeforeMount(async () => {
		user_id = sessionStorage.getItem("user_id")
		role = sessionStorage.getItem("role")
		group_id.value = route.query.group_id
		token = sessionStorage.getItem('token')
		token
		socket.emit("join room", {
			group_id:group_id.value,
			token
		})
		await loadGroupDetails()
		initLoading.value = true
		await loadMessages()
		initLoading.value = false
	})

	onBeforeUnmount(() => {
		socket.emit('leave room', {
			group_id:group_id.value,
			token
		})
	})

	const loadMessages = async () => {
		try {
			let res = await axios.post("group/message/list", {
				group_id:group_id.value,
				start: pageInfo.cur,
				limit: pageInfo.pageSize
			})
			if (res.data.status == 'success') {
				console.log(res.data.data.messages)
				messageList0.value = messageList0.value.concat(res.data.data.messages)
				if (messageList0.value.length >= res.data.data.total) {
					loading.value = false
				}
				pageInfo.cur = messageList0.value.length
				console.log(pageInfo)
			}
		} catch (err) {
			if (err.response) {
			notify("Error: " + (err.response.data.message), 'error');
			} else {
			notify("Error: " + err.message, 'error');
			}
		}
	}

	const messageList = computed(() => {
		return messageList0.value.slice().reverse()
	})

	const sendMessage = async () => {
		if (inputValue.value.length == 0) {
			return
		}
		socket.emit('send message', {
			token,
			group_id: group_id.value,
			message_content: inputValue.value
		})
		inputValue.value = ""
	}

	const revokeMessage = async (item) => {
		if (item.sender_id != user_id && role !=0 && role != 1) {
			return
		}
		socket.emit('recall message', {
			group_id: group_id.value,
			message_id: item.message_id,
			token
		})
	}

	const loadGroupDetails = async () => {
		try {
			let res = await axios.post("group/details", {
				group_id:group_id.value
			})
			if (res.data.status == 'success') {
			if (res.data.data.role == -1) {
				notify("你不是该群组的成员")
				router.push({
				name: 'group-mine'
				})
				return
			}
			sessionStorage.setItem('group_id', group_id.value)
			sessionStorage.setItem('role', res.data.data.role)
			groupInfo.group_id = group_id
			groupInfo.group_name = res.data.data.group.group_name
			groupInfo.group_avatar = server_url + res.data.data.group.group_avatar
			groupInfo.description = res.data.data.group.description
			}
		} catch (err) {
			if (err.response) {
			notify("Error: " + (err.response.data.message), 'error');
			} else {
			notify("Error: " + err.message, 'error');
			}
		}
	}

	const scrollToBottom = () => {
		nextTick(() => {
			let chatContainer = document.querySelector('#chatContainer');
			chatContainer.scrollTop = chatContainer.scrollHeight;
		})
	}

	
</script>

<style lang="scss" scoped>
.message-container {
	width: 100%;
	height: calc(80vh - 20px);
	padding: 10px;
	overflow-x: hidden;
	outline: none;
}
.message-container::-webkit-scrollbar {
	width: 0;
	height: 0;
}
.my-input {
	position: relative;
	bottom: 0;
}

.content {
	max-width: 30vw;
	padding: 5px;
	border-radius: 10px;
	border: 1px solid #ccc;
	box-sizing: border-box;
	word-wrap: break-word;
	word-break: break-all;
}


</style>