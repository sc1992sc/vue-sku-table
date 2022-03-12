import Main from "./vue-sku-table";

Main.install = (Vue) => {
  Vue.component(Main.name, Main);
};

export default Main;
