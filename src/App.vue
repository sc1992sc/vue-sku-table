<template>
  <div id="app">
    <div v-for="(item, index) in skus" :key="index">
      {{ item }}
    </div>
    <vue-sku-table
      v-model="skus"
      :specs="skuData"
      :skuProperties="columns"
      ref="sku"
    />
  </div>
</template>

<script>
import vueSkuTable from "./components/vue-sku-table.vue";
export default {
  name: "App",
  data() {
    return {
      skuData: [
        {
          name: "颜色",
          id: "color",
          values: [
            { name: "红色", id: "red" },
            { name: "黄色", id: "yellow" },
            { name: "蓝色", id: "blue" },
          ],
        },
        {
          name: "内存",
          values: [
            { name: "64G", id: "64" },
            { name: "128G", id: "128" },
            { name: "256G", id: "256" },
          ],
        },
        // {
        //   name: "支持网络",
        //   values: [
        //     { name: "2G/3G/4G", id: "2G/3G/4G" },
        //     { name: "2G/3G/4G/5G", id: "2G/3G/4G/5G" },
        //   ],
        // },
      ],
      columns: [
        { name: "SKU编码", id: "skuCode" },
        {
          name: "价格",
          id: "price",
          pattern: /[^\d|\\.]|^\..+|(?<=^0)[^\\.]+|(?<!^\d+)\.|(?<=\.\d{2}).*/g,
        },
        { name: "数量", id: "amount", pattern: /\D|(?<=^0).+/g },
        {
          name: "关键词",
          id: "keywords",
          readOnly: true,
          defaultValue: ({ columns }) => {
            return columns.reduce((res, item) => {
              res += `${item.showValue} `;
              return res;
            }, "");
          },
          format: (res) => {
            return res ? res.split(" ").filter((t) => !!t) : res;
          },
        },
      ],
      skus: [],
    };
  },
  components: {
    vueSkuTable,
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
  margin: 0 auto;
  margin-top: 60px;
  width: 80%;
}
</style>
