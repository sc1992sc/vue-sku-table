# vue-sku-table

基于 vue2.6.14 版本和 element-ui 开发的 sku 表格组件

## 使用方式

`import vueSkuTable from "vue-sku-table";`

`Vue.use(vueSkuTable);`

```javascript
<vue-sku-table v-model="skus" :specs="specs" :skuProperties="skuProperties"/>
```

## props 说明

- v-model： 绑定 sku 数据

  - type：Array
  - required：true,

- specs： 规格参数,用于生成表格

  - type：Array
  - required：true,

example:

>

```javascript
[
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
    id: "memory",
    values: [
      { name: "64G", id: "64" },
      { name: "128G", id: "128" },
      { name: "256G", id: "256" },
    ],
  },
];
```

- skuProperties： sku 属性数组,用于自定义 sku 属性列表

  - type:Array

每个自定义 sku 属性有以下属性可使用

```javascript
{
    id:'keyword',
    name:'关键词', // 用来显示
    readOnly:false, //可选，默认false,为true的状态下，可以做sku的批量填充
    pattern:reg, //可选，正则表达式，可以用来控制input输入框的值
    defaultValue：string | function,
    // 可选，用于初始化表格时填充属性值，当为函数时第一个参数是一个对象{rowIndex,columns},rowIndex是行的索引，columns是该行的列信息
    format:function // 可以对属性值做操作，参数是属性值
}
```

- filterable： 是否开启 sku 过滤，默认开启，关闭后只显示规格名称
  - type:boolean
