<script setup>

</script>

<template>
  <router-view></router-view>
  <footer>
    <p>&copy; 2024 My Website. All rights reserved.</p>
  </footer>
</template>

<style lang="scss" scoped>
footer {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
}
</style>