<template>
	<div class="form-container">
	  <a-form
		  :layout="'horizontal'"
		  :model="inputForm"
		  name="login"
		  ref="formRef"
		  :rules="rules"
		  v-bind="layout"
		  class="form"
		  @finish="onFinish"
		  @finishFailed="onFinishFailed"
	  >
		<div class="title">
		  <HomeOutlined @click="router.push('/')" :style="{fontSize: '25px', color: 'var(--text-color)', cursor: 'pointer'}" />
		  用户注册
		</div>
		<a-form-item
			hasFeedback
			label="用户名"
			name="username"
		>
		  <a-input v-model:value="inputForm.username">
			<template #prefix>
			  <UserOutlined class="site-form-item-icon" />
			</template>
		  </a-input>
		</a-form-item>
		<a-form-item
			hasFeedback
			label="密码"
			name="password"
		>
		  <a-input-password v-model:value="inputForm.password">
			<template #prefix>
			  <LockOutlined class="site-form-item-icon" />
			</template>
		  </a-input-password>
		</a-form-item>
  
		<a-form-item
			hasFeedback
			label="重复"
			name="repeat"
		>
		  <a-input-password v-model:value="inputForm.repeat">
			<template #prefix>
			  <LockOutlined class="site-form-item-icon" />
			</template>
		  </a-input-password>
		</a-form-item>
  
		<a-form-item>
		  <a-button :disabled="disabled"  type="primary" html-type="submit" class="form-button">
			注册
		  </a-button>
		  <a-button style="margin-left: 30px" @click="login" class="form-button">
			登录
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
  
  const router = useRouter()
  const route = useRoute()
  const axios = inject("axios")
  const notify = inject("notify")
  
  const inputForm = reactive({
	username: '',
	password: '',
	repeat  : ''
  });
  
  const disabled = computed(() => {
	return !(inputForm.username && inputForm.password);
  });
  
  const formRef = ref(null)
  
  const rules = {
	username: [
	  {
		required: true,
		validator: async (_rule, value) => {
		  if (value === '') {
			return Promise.reject('请输入用户名');
		  } else {
			if (!/^[a-zA-Z]/.test(value)) {
			  return Promise.reject('只能以字母开头')
			}
			if (value.length < 3) {
			  return Promise.reject('长度不能少于2位')
			}
			if (value.length > 8) {
			  return Promise.reject('长度不能多于8位')
			}
			const regex = /^[a-zA-Z][a-zA-Z0-9]{1,7}$/
			if (regex.test(value)) {
			  return Promise.resolve();
			}
			return Promise.reject("只能由字母和数字组成")
		  }
		},
		trigger: 'change',
	  }
	],
	password: [
	  {
		required: true,
		validator: async (_rule, value) => {
		  if (value === '') {
			return Promise.reject('请输入密码')
		  } else {
			if (value.length < 8) {
			  return Promise.reject('密码长度不能少于8位')
			}
			const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|\W).*$/
			if (regex.test(value)) {
			  return Promise.resolve();
			}
			return Promise.reject("包含大写字母、小写字母、数字和特殊字符中的至少三种")
		  }
		},
		trigger: 'change'
	  }
	],
	repeat: [
	  {
		required: true,
		validator: async (_rule, value) => {
		  if (value === '') {
			return Promise.reject('请再输一遍密码')
		  } else {
			if (value !== inputForm.password) {
			  return Promise.reject('两次密码不一致')
			}
			return Promise.resolve();
		  }
		},
		trigger: 'change'
	  }
	]
  }
  
  const layout = {
	labelCol: {
	  span: 6,
	},
	wrapperCol: {
	  span: 28,
	},
  };
  
  const login = () => {
	router.push({
	  name: "login"
	});
  };
  
  const onFinish = async () => {
	await register()
  }
  
  const onFinishFailed = async () => {
	notify("请检查输入.")
  }
  
  const register = async () => {
	try {
		let res = await axios.post("user/signup", {
		  username: inputForm.username,
		  password: inputForm.password
		});
  
		if (res.status === 200 &&res.data.status === "success") {
		  notify("注册成功")
		  login()
		} else {
		  notify(res.data.message)
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
	  background: url("@/assets/img/bg4_1.png") no-repeat;
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