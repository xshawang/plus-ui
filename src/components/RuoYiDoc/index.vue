<template>
</template>

<script setup lang="ts">
const url = ref('https://plus-doc.dromara.org/');

function goto() {
  window.open(url.value);
}
</script>
