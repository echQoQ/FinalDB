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
				<a-avatar v-if="formInfo.group_avatar" :size="100" :src="server_url + formInfo.group_avatar"/>
			</a-upload>
		</a-form-item>
		<a-form-item label="群名称">
			<a-input v-model:value="formInfo.group_name" placeholder="请输入群名称" />
		</a-form-item>
		<a-form-item label="群描述">
			<a-textarea v-model:value="formInfo.description" placeholder="请输入群描述" />
		</a-form-item>
		<a-form-item :wrapper-col="{ offset: 8, span: 16 }">
			<a-button type="primary" @click="createGroup">创建</a-button>
		</a-form-item>
	  </a-form>
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

	let formInfo = reactive({
		group_name: "",
		description: "",
		group_avatar: "/avatar/groups/default.jpg",
	})

	const uploadInfo = reactive({
		action: server_url + "/api/image/upload",
		header: {
			token: sessionStorage.getItem("token")
		}
	})
	
	const fileList = ref([]);
	const loading = ref(false);

	const handleChange = info => {
		if (info.file.status === 'uploading') {
			loading.value = true;
			return;
		}
		if (info.file.status === 'done') {

			formInfo.group_avatar = info.file.response.data.image;
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
		const isLt2M = file.size / 1024 / 1024 < 2;
		if (!isLt2M) {
			notify('Image must smaller than 2MB!');
		}
		return isJpgOrPng && isLt2M;
	};

	const createGroup = async () => {
		if (formInfo.group_name == "") {
			notify("群名称不能为空")
			return
		}
		if (formInfo.description == "") {
			notify("群描述不能为空")
			return
		}
		if (formInfo.group_avatar == "") {
			notify("群头像不能为空")
			return
		}
		try {
			let res = await axios.post("group/create", {
				group_name: formInfo.group_name,
				description: formInfo.description,
				group_avatar: formInfo.group_avatar
			});
			if (res.data.status === "success") {
				notify("创建成功！")
				formInfo.description = ""
				formInfo.group_avatar = "/avatar/groups/default.jpg"
				formInfo.group_name = ""
			}
			console.log(res)
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