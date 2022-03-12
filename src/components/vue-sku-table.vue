<template>
  <div class="sku-table">
    <table border class="sku-table-body">
      <tr class="sku-table-header">
        <th
          v-for="(item, colIndex) in specs"
          :key="colIndex"
          class="sku-table-header-cell"
        >
          <el-select
            v-if="filterable"
            v-model="headerFilterParams[item.name]"
            :placeholder="item.name"
            clearable
            @change="
              (value) => {
                onSltChange(value, item.name);
              }
            "
          >
            <el-option label="全部" value=""></el-option>
            <el-option
              v-for="(child, index2) in item.values"
              :key="index2"
              :label="child.name"
              :value="child.name"
            ></el-option>
          </el-select>
          <span v-else class="spec-name">
            {{ item.name }}
          </span>
        </th>
        <th
          v-for="(item, colIndex) in skuProperties"
          :key="colIndex + specs.length + 1"
          class="sku-table-header-cell"
        >
          <span v-if="item.readOnly">{{ item.name }}</span>
          <el-input
            v-else
            v-model="skuPropertiesValue[item.id]"
            @input="
              (value) => {
                checkValue(value, item);
              }
            "
            @keyup.native.enter="
              () => {
                onBulkEdit(item.id);
              }
            "
            :placeholder="item.name"
          />
        </th>
      </tr>
      <tr v-for="(row, rowIndex) in renderTableRows" :key="row.id">
        <td
          class="sku-table-body-cell"
          v-for="(child, colIndex) in row.columns"
          :class="[
            child.shouldSetRowSpan ? '' : 'hide',
            rowIndex === rowLastCanSpan[colIndex] ? 'col-last-rowspan' : '',
            colIndex < specs.length - 1 ? 'row-span-style' : '',
          ]"
          :rowspan="child.shouldSetRowSpan ? assignRule[colIndex] : ''"
          :key="colIndex"
        >
          <span>{{ child.showValue }}</span>
        </td>
        <td
          v-for="(child, colIndex) in skuProperties"
          :key="colIndex + skuProperties.length + 1"
          class="sku-table-body-cell"
        >
          <el-input
            v-model="row[child.id]"
            @input="
              (value) => {
                checkValue(value, child, row);
              }
            "
            class="no-border-input"
          />
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import { v4 as uuidv4 } from "uuid";
export default {
  name: "vueSkuTable",
  props: {
    value: {
      type: Array,
      default: () => {
        return [];
      },
    },
    specs: {
      //规格配置
      type: Array,
      default: () => {
        return [];
      },
    },
    skuProperties: {
      //自定义sku属性
      type: Array,
      default: () => {
        return [];
      },
    },
    filterable: {
      //是否开启sku搜索
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      headerFilterParams: {},
      skuPropertiesValue: {},
      originTableRows: [],
      renderTableRows: [],
    };
  },
  mounted() {
    this.render();
  },
  computed: {
    hasFilter() {
      return (
        Object.values(this.headerFilterParams).filter((t) => !!t).length > 0
      );
    },
    renderSpecs() {
      //最终渲染出来的规格数量数组，比如3*3*3，如果有过滤条件则被认为是1如3*3*1
      return this.specs
        .map((t) => t.values.length)
        .map((t, index) => {
          return this.hasFilter
            ? this.headerFilterParams[this.specs[index].name]
              ? 1
              : t
            : t;
        });
    },
    skuTotal() {
      // 渲染的sku总数
      return this.renderSpecs.reduce(
        (result, item) => result * item,
        this.renderSpecs.length ? 1 : 0
      );
    },
    assignRule() {
      //合并单元格规则数组，[6,2,1]表示第一例按6行合并，第二列按2行合并
      return this.renderSpecs.reduce((result, item, index) => {
        let preValue = result[index - 1];
        if (preValue) {
          result.push(preValue / item);
        } else {
          result.push(this.skuTotal / item);
        }
        return result;
      }, []);
    },
    rowLastCanSpan() {
      let indexArr = Array.from(new Array(this.skuTotal).keys()); //生成行的索引数组
      //每列可以合并的最后一行的行索引数组，为了设置样式
      return this.assignRule.map((t, index, array) => {
        return index === array.length - 1
          ? null
          : indexArr.filter((row) => row % t === 0).pop();
      });
    },
  },
  watch: {
    specs() {
      this.render();
    },
    headerFilterParams: {
      handler() {
        if (this.hasFilter) {
          let renderTableRows = this.originTableRows.filter((t) => {
            return t.columns.reduce((res, item) => {
              let filterValue = this.headerFilterParams[item.columnName];
              return filterValue ? res && item.showValue === filterValue : res;
            }, true);
          });
          this._resetRowSpan(renderTableRows);
          this.renderTableRows = renderTableRows;
        } else {
          this._resetRowSpan(this.originTableRows);
          this.renderTableRows = this.originTableRows;
        }
      },
      deep: true,
    },
  },
  methods: {
    render() {
      this.originTableRows = this.createTable();
      this.renderTableRows = this.originTableRows;
    },
    _resetRowSpan(table) {
      table.forEach((row, rowIndex) => {
        row.columns.forEach((column, columnIndex) => {
          column.shouldSetRowSpan = this.shouldSetRowSpan(
            rowIndex,
            columnIndex
          );
        });
      });
    },
    createTable() {
      let tableData = [];
      let details = this.value;
      for (let i = 0; i < this.skuTotal; i++) {
        let columns = this.specs.map((t, j) => {
          let { name, id } = this.getShowValue(i, j);
          return {
            shouldSetRowSpan: this.shouldSetRowSpan(i, j),
            showValue: name,
            valueId: id,
            columnName: t.name,
            columnId: t.id,
          };
        });
        //获取当前组合
        let pattern = columns
          .map((t) => t.valueId)
          .sort()
          .toString();
        //从详情中找回同一个组合的sku数据
        let rowDetails =
          details.find(
            (t) => [...t.skuCombinationIds].sort().toString() === pattern
          ) || details[i];
        tableData.push({
          id: uuidv4(),
          ...this.createSkuPropertyFields(columns, i, rowDetails),
          columns,
        });
      }
      return tableData;
    },
    createSkuPropertyFields(columns, rowIndex, row) {
      return this.skuProperties.reduce((res, item) => {
        if (row) {
          res[item.id] = row[item.id] || "";
        } else {
          if (item.defaultValue) {
            // 设置默认值，可以为string或function，fuction时会传入行的索引和列的信息
            if (typeof item.defaultValue === "string") {
              res[item.id] = item.defaultValue;
            } else if (typeof item.defaultValue === "function") {
              res[item.id] = item.defaultValue({ rowIndex, columns });
            }
          } else {
            res[item.id] = "";
          }
        }
        return res;
      }, {});
    },
    shouldSetRowSpan(rowIndex, colIndex) {
      return rowIndex % this.assignRule[colIndex] === 0;
    },
    getShowValue(rowIndex, colIndex) {
      let values = this.specs[colIndex].values;
      let index;
      if (colIndex === this.specs.length - 1) {
        index = rowIndex % values.length;
      } else {
        let step = this.assignRule[colIndex];
        index = Math.floor(rowIndex / step);
        if (index >= values.length) {
          index = index % values.length;
        }
      }
      return values[index];
    },
    onSltChange(value, name) {
      if (!value) {
        this.headerFilterParams[name] = null;
      }
    },
    onBulkEdit(id) {
      let value = this.skuPropertiesValue[id];
      this.renderTableRows.forEach((item) => {
        item[id] = value;
      });
      this.skuPropertiesValue[id] = "";
      this.getData();
    },
    checkValue(value, columnInfo, row) {
      let { id, pattern } = columnInfo;
      if (pattern) {
        (row || this.skuPropertiesValue)[id] = value.replace(pattern, "");
      }
      this.getData();
    },
    getData() {
      let data = this.originTableRows.map((t) => {
        let columnObj = this.skuProperties.reduce((res, item) => {
          res[item.id] = item.format ? item.format(t[item.id]) : t[item.id];
          return res;
        }, {});
        return {
          skuCombinationIds: t.columns.map((t) => t.valueId),
          ...columnObj,
        };
      });
      this.$emit("input", data);
    },
  },
};
</script>

<style scoped>
.sku-table {
  overflow: auto;
  position: relative;
  background-color: #f9f9f9;
  border: 1px solid #c6d1db;
  border-top: none;
}
.sku-table-header {
  background: #f5f7fa;
  overflow-x: hidden;
  position: relative;
}
.sku-table-header-cell {
  color: #333;
  font-weight: 400;
  height: 42px;
  margin-left: 1px;
  position: relative;
  font-size: 12px;
  border-top: 1px solid #c6d1db;
  text-overflow: ellipsis;
  word-break: break-all;
  padding: 6px;
}
.sku-table-header-cell + .sku-table-header-cell {
  border-left: none;
}
.sku-table-header-cell:first-child {
  border-left: none;
}
.sku-table-header-cell:last-child {
  border-right: none;
}
.sku-table-header-cell .spec-name {
  font-size: 14px;
  display: inline-block;
  min-width: 80px;
}

.sku-table-body {
  border-spacing: 0;
  border: 1px;
  border-color: #c6d1db;
  width: 100%;
}
.sku-table-body tr:first-of-type td {
  border-top: none !important;
}
.sku-table-body tr:last-of-type td {
  border-bottom: none !important;
}
.sku-table-body tr + tr .sku-table-body-cell {
  border-top: none;
}
.sku-table-body td:first-of-type {
  border-left-color: transparent;
}
.sku-table-body td:last-of-type {
  border-right: none;
}
.sku-table-body-cell {
  color: #323b44;
  font-size: 12px;
  text-overflow: ellipsis;
  word-break: break-all;
  text-align: left;
  background: #fff;
  vertical-align: middle;
  height: 32px;
  padding: 0 6px;
}
.sku-table-body-cell.hide {
  display: none;
}
.sku-table-body-cell.row-span-style {
  text-align: center;
}
.sku-table-body-cell + .sku-table-body-cell {
  border-left-color: transparent !important;
}
.sku-table-body-cell .el-input__inner {
  border: none !important;
  background-color: transparent;
}
.col-last-rowspan {
  border-bottom: none !important;
}
</style>
<style>
.no-border-input .el-input__inner {
  border-color: transparent;
}
</style>
