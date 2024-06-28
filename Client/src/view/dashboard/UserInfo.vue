<template>
	<div class="form-container">
	  <a-form
		:label-col = "{style:{width: '150px'}}"
		:wrapper-col = "{span: 14}"
		layout = "horizontal"
		style="max-width: 600px"
	  >
		<a-form-item label="头像">
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
				<a-avatar v-if="formInfo.avatar" :size="100" :src="server_url + formInfo.avatar"/>
			</a-upload>
		</a-form-item>
		<a-form-item label="昵称">
			<a-input v-model:value="formInfo.username" placeholder="请输入昵称" />
		</a-form-item>
		<a-form-item label="上次登陆时间">
			<a-input disabled v-model:value="formInfo.lastLoginTime" />
		</a-form-item>
		<a-form-item :wrapper-col="{ offset: 8, span: 16 }">
			<a-space>
				<a-button :disabled="disabled" type="primary" @click="resetForm">复原</a-button>
				<a-popconfirm
					title="确定修改个人信息？"
					ok-text="是的"
					cancel-text="取消"
					@confirm="updateUserInfo"
				>
					<a-button :disabled="disabled" type="primary" >修改</a-button>
				</a-popconfirm>
				<a-button type="primary" @click="openModal">更改密码</a-button>
			</a-space>
		</a-form-item>
	  </a-form>
	  <a-modal v-model:open="open" title="更改密码" @ok="updatePasswd">
		<a-form
		:label-col = "{style:{width: '150px'}}"
		:wrapper-col = "{span: 14}"
		layout = "horizontal"
		style="max-width: 600px"
	  >
		<a-form-item label="旧密码">
			<a-input-password v-model:value="old_passwd" class="form-input">
				<template #prefix>
				<LockOutlined class="site-form-item-icon" />
				</template>
			</a-input-password>
		</a-form-item>
		<a-form-item label="新密码">
			<a-input-password v-model:value="new_passwd" class="form-input">
				<template #prefix>
				<LockOutlined class="site-form-item-icon" />
				</template>
			</a-input-password>
		</a-form-item>
	  </a-form>
	  </a-modal>
	</div>
</template>
  
<script setup>
	import { ref,reactive, inject, onMounted, computed, watch, h } from "vue";
	import { useRoute, useRouter } from "vue-router";
	import { 
		HomeOutlined,
		LogoutOutlined,
		AppstoreOutlined, 
		LockOutlined
	} from '@ant-design/icons-vue';
	

	const notify = inject("notify")

	const router = useRouter()
	const route = useRoute()
	const axios = inject("axios")
	const server_url = inject("server_url")

	const disabled = ref(true)
	const open = ref(false)
	const old_passwd = ref("")
	const new_passwd = ref("")

	let formInfo = reactive({
		user_id: -1,
		username: "",
		avatar: "",
		lastLoginTime: ""
	})

	let rawInfo = reactive({
		user_id: -1,
		username: "",
		avatar: "",
	})

	onMounted(async () => {
		await loadUserInfo()
	})

	const openModal = () => {
		open.value = true
	}

	const updatePasswd = async () => {
		try {
			let res = await axios.post("user/update/password", {
				old_password:old_passwd.value,
				new_password:new_passwd.value
			})
			if (res.data.status == 'success') {
				notify("密码修改成功！")
				open.value = false
				old_passwd.value = ""
				new_passwd.value = ""
			}
		} catch(err) {
			if (err.response) {
				notify("Error: " + (err.response.data.message), 'error');
			} else {
				notify("Error: " + err.message, 'error');
			}
	  	}
	}

	const loadUserInfo = async () => {
		try {
			let res = await axios.get("user/info")
			if (res.data.status == 'success') {
				formInfo.avatar = res.data.data.avatar
				formInfo.username = res.data.data.username
				formInfo.user_id = res.data.data.user_id
				formInfo.lastLoginTime = res.data.data.last_login_time
				rawInfo.avatar = res.data.data.avatar
				rawInfo.user_id = res.data.data.user_id
				rawInfo.username = res.data.data.username
			}
		} catch(err) {
			if (err.response) {
				notify("Error: " + (err.response.data.message), 'error');
			} else {
				notify("Error: " + err.message, 'error');
			}
	  	}
	}

	const updateUserInfo = async () => {
		try {
			let res = await axios.post("user/update/info", {
				username:formInfo.username,
				avatar:formInfo.avatar
			})
			if (res.data.status == 'success') {
				notify("修改成功")
				disabled.value = true
				await loadUserInfo()
			}
		} catch(err) {
			if (err.response) {
				notify("Error: " + (err.response.data.message), 'error');
			} else {
				notify("Error: " + err.message, 'error');
			}
		}
	}

	const handleChange = info => {
		if (info.file.status === 'uploading') {
			return;
		}
		if (info.file.status === 'done') {
			formInfo.avatar = info.file.response.data.image;
		}
		if (info.file.status === 'error') {
			notify('upload error');
		}
	};

	watch(formInfo , cur => {
		if (cur.user_id != rawInfo.user_id ||
			cur.username != rawInfo.username ||
			cur.avatar != rawInfo.avatar
		) {
			disabled.value = false
		} else {
			disabled.value = true
		}
	})

	const resetForm = () => {
		formInfo.user_id = rawInfo.user_id
		formInfo.avatar = rawInfo.avatar
		formInfo.username = rawInfo.username
	}

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

	const uploadInfo = reactive({
		action: server_url + "/api/image/upload",
		header: {
			token: sessionStorage.getItem("token")
		}
	})


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