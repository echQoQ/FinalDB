<template>
	<div class="form-container">
	  <a-form
		  v-bind="layout"
		  :model="inputForm"
		  name="login"
		  ref="formRef"
		  class="form"
		  @submit="login"
	  >
		<div class="title">
		  <HomeOutlined @click="router.push('/')" :style="{fontSize: '25px', color: 'var(--text-color)', cursor: 'pointer'}" />
		  用户登录
		</div>
		<a-form-item
			label="用户名"
			name="username"
			:rules="[{ required: true, message: '请输入用户名!' }]"
		>
		  <a-input v-model:value="inputForm.username" class="form-input">
			<template #prefix>
			  <UserOutlined class="site-form-item-icon" />
			</template>
		  </a-input>
		</a-form-item>
  
		<a-form-item
			label="密码"
			name="password"
			:rules="[{ required: true, message: '请输入密码!' }]"
		>
		  <a-input-password v-model:value="inputForm.password" class="form-input">
			<template #prefix>
			  <LockOutlined class="site-form-item-icon" />
			</template>
		  </a-input-password>
		</a-form-item>
  
		<a-form-item
		  id="bottom-item"
		  style="margin: 0 auto auto 0;width: 100%"
		>
		  <a-button :disabled="disabled" type="primary" html-type="submit" class="login-form-button">
			登录
		  </a-button>
		  <a-button @click="register" style="margin-left: 30px">
			注册
		  </a-button>
		</a-form-item>
	  </a-form>
	</div>
  </template>
  
  <script setup>
  import { ref,reactive, inject, onMounted, computed } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import {
	UserOutlined,
	LockOutlined,
	HomeOutlined
  } from '@ant-design/icons-vue';
  
  const notify = inject("notify")
  
  const router = useRouter()
  const route = useRoute()
  const axios = inject("axios")
  
  
  const inputForm = reactive({
	username: '',
	password: ''
  });
  
  const layout = {
	labelCol: {
	  span: 6,
	},
	wrapperCol: {
	  span: 28,
	},
  };
  
  const disabled = computed(() => {
	return !(inputForm.username && inputForm.password);
  });
  
  const formRef = ref(null)
  
  const login = async () => {
	  try {
		let res = await axios.post("user/login", {
			username: inputForm.username,
			password: inputForm.password
		});
		if (res.status == 200 && res.data.status === "success") {
			notify("Hello, " + res.data.data.username + "!")
			formRef.value.resetFields();
			sessionStorage.setItem("username", res.data.data.username)
			sessionStorage.setItem("token", res.data.data.token)
		}
	  } catch(err) {
		if (err.response) {
			notify("Error: " + (err.response.data.message || "Invalid username or password"), 'error');
		} else {
			notify("Error: " + err.message, 'error');
		}
	  }
  };
  
  const register = () => {
	router.push({
	  name: "signup"
	});
  }
  
  </script>
  
  <style lang="scss" scoped>
  .form-container {
	width: 100vw;
	height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 19;
	padding-top: 50px;
	.form {
	  width: 330px;
	  height: 514px;
	  display: flex;
	  flex-direction: column;
	  padding: 30px 40px 40px 40px;
	  text-align: center;
	  position: relative;
	  background: url("../assets/img/bg4_1.png") no-repeat;
	  border-radius: 18px;
	  overflow: hidden;
	  button {
		font: normal 15px/1 "TitleFont", Helvetica, sans-serif;
		color: var(--text-color);
	  }
	  .title {
		border: none;
		font: normal 20px/1 "TitleFont", Helvetica, sans-serif;
		color: var(--text-color);
		text-align: center;
		margin: 10px auto 30px auto;
	  }
	}
  }
  </style>