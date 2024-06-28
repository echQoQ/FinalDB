<template>
  <div>
    <div style="border-radius: 10px;">
      <div v-for="(item, index) in list" :key="index" >
        <a-card :loading="initLoading" type="inner" style="background-color: var(--light-color);border-radius: 0px;">
          <a-card-meta :title="`公告${index+1}`">
            <template #description>{{item.announcement_content}}</template>
          </a-card-meta>
          <a-tag style="margin-top: 15px;">{{ item.publish_time.slice(0,10)  }}</a-tag>
        </a-card>
      </div>
      <div v-if="list.length == 0">
        <a-empty description="暂无公告">
        </a-empty>
      </div>
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
  let list = ref([])
  let initLoading = ref(true)

  onMounted(async () => {
    console.log(props.group_id)
    await loadGroupAnnouncements()
  })

  const loadGroupAnnouncements = async () => {
		initLoading.value = true
		try {
			let res = await axios.get("group/announcement/list?group_id="+props.group_id+"&&page=1&&limit=3")

			if (res.data.status == 'success') {
				list.value = res.data.data.announcements
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

<style>

</style>