<template>
  <div id="app">
    <!-- <img alt="Vue logo" src="./assets/logo.png" />
    <HelloWorld msg="Welcome to Your Vue.js App" /> -->
    <input type="file" name="" ref="file-container" @change="getFiles" id="" />
  </div>
</template>

<script>
/* eslint-disable */
// import HelloWorld from './components/HelloWorld.vue';
import { readXlsx } from './excelUtil';

export default {
  name: 'App',
  // components: {
  //   HelloWorld,
  // },
  methods: {
    async getFiles() {
      const file = this.$refs['file-container'].files[0];
      const data = await readXlsx(file);
      console.log(data);
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
