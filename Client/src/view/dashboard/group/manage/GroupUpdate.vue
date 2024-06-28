<template>
	<div class="form-container">
	  <a-form
		:label-col = "{style:{width: '150px'}}"
		:wrapper-col = "{span: 14}"
		layout = "horizontal"
		style="max-width: 600px"
	  >
		<a-form-item label="群头像">
			<a-upload
				v-model:file-list="fileList"
				name="avatar"
				list-type="picture-card"
				class="avatar-uploader"
				:show-upload-list="false"
				:action="uploadInfo.action"
				:headers="uploadInfo.header"
				:before-upload="beforeUpload"
				@change="handleChange"
			>
				<a-avatar v-if="groupInfo.group_avatar" :size="100" :src="server_url + groupInfo.group_avatar"/>
			</a-upload>
		</a-form-item>
		<a-form-item label="群名称">
			<a-input v-model:value="groupInfo.group_name" placeholder="请输入群名称" />
		</a-form-item>
		<a-form-item label="群描述">
			<a-textarea v-model:value="groupInfo.description" placeholder="请输入群描述" />
		</a-form-item>
		<a-form-item :wrapper-col="{ offset: 8, span: 16 }">
			<a-space>
				<a-button type="primary" :disabled="disabled" @click="resetInfo">复原</a-button>
				<a-button type="primary" :disabled="disabled" @click="updateGroup">更改</a-button>
			</a-space>
		</a-form-item>
	  </a-form>
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

	const uploadInfo = reactive({
		action: server_url + "/api/image/upload",
		header: {
			token: sessionStorage.getItem("token")
		}
	})

	let disabled = ref(true)
	
	const fileList = ref([]);
	const loading = ref(false);

	const groupInfo = reactive({
		group_id: -1,
		group_name: '',
		group_avatar: '',
		description: '',	
	})

	const rawInfo = reactive({
		group_id: -1,
		group_name: '',
		group_avatar: '',
		description: '',
	})

	let group_id = -1

	onMounted(async () => {
		group_id = sessionStorage.getItem('group_id')
		await loadGroupDetails()
		console.log(groupInfo)
	})

	const loadGroupDetails = async () => {
		try {
			let res = await axios.post("group/details", {
				group_id
			})
			if (res.data.status == 'success') {
				if (res.data.data.role == -1) {
					notify("你不是该群组的成员")
					router.push({
					name: 'group-mine'
					})
					return
				}
				groupInfo.group_id = group_id
				groupInfo.group_name = res.data.data.group.group_name
				groupInfo.group_avatar = res.data.data.group.group_avatar
				groupInfo.description = res.data.data.group.description
				rawInfo.group_id = group_id
				rawInfo.group_name = res.data.data.group.group_name
				rawInfo.group_avatar = res.data.data.group.group_avatar
				rawInfo.description = res.data.data.group.description
			}
		} catch (err) {
			if (err.response) {
				notify("Error: " + (err.response.data.message), 'error');
				} else {
				notify("Error: " + err.message, 'error');
				}
			}
	}

	watch(groupInfo , cur => {
		if (cur.group_id != rawInfo.group_id ||
			cur.description != rawInfo.description ||
			cur.group_name != rawInfo.group_name ||
			cur.group_avatar != rawInfo.group_avatar
		) {
			disabled.value = false
		} else {
			disabled.value = true
		}
	})

	const resetInfo = () => {
		groupInfo.group_id = rawInfo.group_id
		groupInfo.group_name = rawInfo.group_name
		groupInfo.group_avatar = rawInfo.group_avatar
		groupInfo.description = rawInfo.description
	}

	const handleChange = info => {
		if (info.file.status === 'uploading') {
			loading.value = true;
			return;
		}
		if (info.file.status === 'done') {

			groupInfo.group_avatar = info.file.response.data.image;
			loading.value = false;
		}
		if (info.file.status === 'error') {
			loading.value = false;
			notify('upload error');
		}
	};

	const beforeUpload = file => {
		const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
		if (!isJpgOrPng) {
			notify('You can only upload JPG file!');
		}
		const isLt2M = file.size / 1024 / 1024 < 5;
		if (!isLt2M) {
			notify('Image must smaller than 5MB!');
		}
		return isJpgOrPng && isLt2M;
	};

	const updateGroup = async () => {
		try {
			let res = await axios.post("group/update", {
				group_id: groupInfo.group_id,
				description: groupInfo.description,
				group_avatar: groupInfo.group_avatar,
				group_name: groupInfo.group_name
			})
			if (res.data.status == 'success') {
				notify("修改成功！")
				router.push({
					name: "group-manage"
				})
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

<style lang="scss" scoped>

.avatar-uploader > .ant-upload {
  width: 128px;
  height: 128px;
}
.ant-upload-select-picture-card i {
  font-size: 32px;
  color: #999;
}

.ant-upload-select-picture-card .ant-upload-text {
  margin-top: 8px;
  color: #666;
}
</style>