<template>
  <div class="el-basic-table">
    <div v-if="useSearchForm" class="el-basic-table__form">
      <el-basic-form
        v-bind="formConfig || {}"
        :table-action="tableActionContext"
        @submit="onFormSubmit"
        @register="onFormRegister"
      />
    </div>
    <!-- v-if="title || titleHelpMessage" -->
    <div class="el-basic-table__header">
      <div class="el-basic-table__title">{{ title }}</div>
      <div v-if="titleHelpMessage" class="el-basic-table__help">{{ titleHelpMessage }}</div>
      <div class="el-basic-table__toolbar">
        <slot name="toolbar"></slot>
      </div>
    </div>
    <el-table
      ref="tableRef"
      v-loading="internalLoading"
      :data="internalData"
      :stripe="striped"
      :border="bordered"
      :max-height="maxHeight"
      :size="size"
      :row-key="rowKey"
      :tree-props="treeProps"
      :highlight-current-row="highlightCurrentRow"
      :empty-text="emptyText"
      :show-summary="showSummary"
      :summary-method="summaryMethod"
      :span-method="handleSpanMethod"
      @selection-change="onSelectionChange"
      @row-click="onRowClick"
    >
      <el-basic-table-column
        v-for="(col, idx) in normalizedColumns"
        :key="col.key || col.prop || idx"
        :column="col"
        :ellipsis="ellipsis"
      />
      <!-- <template v-if="$slots.append" slot="append">
        <slot name="append"></slot>
      </template>
      <template v-if="$slots.empty" slot="empty">
        <slot name="empty"></slot>
      </template> -->
    </el-table>
    <div v-if="showPagination" class="el-basic-table__pagination">
      <el-pagination
        v-bind="internalPagination"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>
<script>
// 依赖组件：基础表格、分页、搜索表单与列渲染子组件
// 文件职能：封装基础表格行为（列配置、分页、远程加载、选择行、搜索联动），暴露完整方法集供外部按需控制
// 说明：该文件聚合 UI 与对外 API，核心行为拆分到 mixins 保持清晰职责
import ElTable from 'rowinself-ui/packages/table';
import ElPagination from 'rowinself-ui/packages/pagination';
import ElBasicForm from 'rowinself-ui/packages/basic-form';
import ElBasicTableColumn from './basic-table-column.vue';
import actions from './actions';
import { mapColumns } from './utils';
import fetchMixin from './mixins/fetch';
import paginationMixin from './mixins/pagination';
import formMixin from './mixins/form';
import actionsContextMixin from './mixins/actions-context';
import watchersMixin from './mixins/watchers';

export default {
  name: 'ElBasicTable',
  components: { ElTable, ElPagination, ElBasicForm, ElBasicTableColumn },
  mixins: [fetchMixin, paginationMixin, formMixin, actionsContextMixin, watchersMixin],
  provide() {
    return {
      // 提供一个函数来获取最新的 $scopedSlots，保证响应性
      getBasicTableSlots: () => this.$scopedSlots
    };
  },
  props: {
    // 标题与提示
    /**
     * 表格标题
     * @type {String}
     */
    title: String,
    /**
     * 标题右侧提示文案
     * @type {String}
     */
    titleHelpMessage: String,
    // 列配置与数据
    /**
     * 列配置数组，映射到每个列的属性
     * @type {Array<Object>}
     */
    columns: { type: Array, default: () => [] },
    /**
     * 本地数据源（与 api 互斥时以 api 为准）
     * @type {Array<Object>}
     */
    dataSource: { type: Array, default: () => [] },
    // 远程加载
    /**
     * 远程数据请求函数 (params) => Promise<{items,total}> | Array
     * @type {Function}
     */
    api: Function,
    // 外观与行为
    /** 是否显示斑马纹 */
    striped: Boolean,
    /** 是否显示边框 */
    bordered: Boolean,
    /** 表格尺寸 (medium/small/mini) */
    size: String,
    /** 行主键，可为字段名或函数 */
    rowKey: [String, Function],
    /** 空数据文案 */
    emptyText: String,
    /** 高亮当前行 */
    highlightCurrentRow: Boolean,
    /** 是否显示合计 */
    showSummary: Boolean,
    /** 合计计算方法 */
    summaryMethod: Function,
    /** 合并单元格方法 */
    spanMethod: Function,
    /** 分页配置对象，或 false 不显示 */
    pagination: Object,
    /** 表格 loading 状态 */
    loading: Boolean,
    /** 文本溢出省略（全局） */
    ellipsis: { type: Boolean, default: true },
    /** 自动为数据补充 key */
    autoCreateKey: { type: Boolean, default: true },
    /** 点击行是否切换勾选 */
    clickToRowSelect: { type: Boolean, default: false },
    /** 翻页是否清空勾选 */
    clearSelectOnPageChange: { type: Boolean, default: false },
    // 搜索表单
    /** 是否启用搜索表单 */
    useSearchForm: { type: Boolean, default: false },
    /** 搜索表单配置（透传给 ElBasicForm） */
    formConfig: Object,
    // 树形表格
    /** 树形表格子项字段名与是否有子项标志 */
    treeProps: {
      type: Object,
      default: () => ({
        /** 子项字段名 */
        children: 'children',
        /** 是否有子项标志 */
        hasChildren: 'hasChildren'
      })
    },
    // 请求钩子与映射
    /** 请求前对参数处理 */
    beforeFetch: Function,
    /** 请求后对返回值处理 */
    afterFetch: Function,
    /** 搜索条件处理钩子 */
    handleSearchInfoFn: Function,
    /** 字段映射：pageField/sizeField/listField/totalField */
    fetchSetting: {
      type: Object,
      default: () => ({
        /** 列表字段名 */
        listField: 'list',
        /** 总数字段名（支持点号路径如 page.totalRowNum） */
        totalField: 'page.totalRowNum',
        /** 当前页码字段名 */
        pageField: 'page.perPage',
        /** 每页条数字段名 */
        sizeField: 'page.pageNum'
      })
    },
    /** 是否在挂载后立即请求 */
    immediate: { type: Boolean, default: true },
    /** 外部传入的搜索条件（受控） */
    searchInfo: Object,
    // 特殊列控制
    /** 是否显示索引列 */
    showIndexColumn: { type: Boolean, default: true },
    /** 索引列标题 */
    indexColumnTitle: { type: String, default: '序号' },
    /** 索引列属性（宽度/对齐/index 回调） */
    indexColumnProps: { type: Object, default: () => ({}) },
    // 尺寸与滚动
    /** 最大高度，超出滚动 */
    maxHeight: Number,
    /**
     * 选择列配置（true/对象）
     * - Boolean: 是否开启
     * - Object: {
     *     selectable: Function(row, index), // 控制行是否可勾选
     *     reserveSelection: Boolean, // 翻页保留勾选（需配合 rowKey）
     *     width: String|Number, // 列宽
     *     fixed: String|Boolean, // 固定列
     *     ... // 其他支持的 el-table-column 属性
     *   }
     */
    rowSelection: [Boolean, Object]
  },
  data() {
    return {
      // 内部数据状态
      /** 当前渲染的数据源（应用了 ensureKeys） */
      internalData: this.dataSource || [],
      /** 当前 loading 状态 */
      internalLoading: !!this.loading,
      /** 当前列配置（内部副本） */
      internalColumns: this.columns || [],
      /** 当前分页配置（内部副本） */
      internalPagination: this.normalizePagination(this.pagination),
      /** 最后一次请求错误 */
      lastFetchError: null,
      /** 当前选中的行（表格事件同步） */
      selectedRows: [],
      /** 当前选中行的主键集合 */
      selectedRowKeys: [],
      /** 原始接口返回对象（最近一次） */
      rawResult: null,
      /** 是否显示分页（受控） */
      showPaginationFlag: this.pagination !== false,
      /** 表单动作对象（@register 注入） */
      formActions: null,
      /** 内部搜索条件，避免直接修改 prop */
      internalSearchInfo: this.searchInfo || {}
    };
  },
  computed: {
    /**
     * 组装最终用于渲染的列配置（前置特殊列 + 常规列）
     * @returns {Array<Object>} 渲染列数组
     */
    normalizedColumns() {
      // console.log('BasicTable indexColumnProps:', this.indexColumnProps);
      return mapColumns({
        columns: this.internalColumns,
        ellipsis: this.ellipsis,
        showIndexColumn: this.showIndexColumn,
        indexColumnTitle: this.indexColumnTitle,
        indexColumnProps: this.indexColumnProps,
        rowSelection: this.rowSelection
      });
    }
    // showPagination/tableActionContext 已拆分至 mixins，保持本组件只关注数据与渲染
  },

  mounted() {
    this.$emit('register', this.tableActionContext);
    if (this.immediate && typeof this.api === 'function') this.reload();
  },

  methods: {
    ...actions,
    /**
     * 处理单元格合并
     */
    handleSpanMethod({ row, column, rowIndex, columnIndex }) {
      // 获取当前列的配置信息
      const prop = column.property;
      const colConfig = prop ? this.normalizedColumns.find(c => c.prop === prop || c.field === prop) : null;

      // 补充 column.field 字段，兼容用户在 spanMethod 中使用 column.field
      if (colConfig && colConfig.field && !column.field) {
        column.field = colConfig.field;
      }

      // 优先使用传入的 spanMethod
      if (typeof this.spanMethod === 'function') {
        return this.spanMethod({ row, column, rowIndex, columnIndex });
      }
      
      // 自动合并逻辑：检查列配置是否有 autoSpan
      if (colConfig && colConfig.autoSpan) {
          // 修复：若开启排序，需使用 table 内部排序后的数据（tableData）进行比较，否则合并行会错乱
          const tableData = this.$refs.tableRef ? this.$refs.tableRef.tableData : null;
          const data = tableData || this.internalData;
          // 使用 getByPath 获取值，以支持嵌套字段
          const getValue = (r, p) => {
            if (!r || !p) return undefined;
            // 简单属性直接获取，避免 getByPath 性能开销（如果 prop 不含点号）
            if (p.indexOf('.') === -1) return r[p];
            // 简单实现 getByPath，避免引入 utils 依赖（或者假设 prop 即为 key）
            // 这里我们假设 data 中 key 与 prop 一致，或者使用 row[prop]
            // Element UI 的 row[column.property] 通常能取到值
            return r[p];
          };

          const currentValue = row[prop];
          const prevRow = data[rowIndex - 1];

          // 如果上一行值相同，则合并（当前隐藏）
          if (prevRow && prevRow[prop] === currentValue) {
            return { rowspan: 0, colspan: 0 };
          }

          // 否则计算向下合并行数
          let rowspan = 1;
          for (let i = rowIndex + 1; i < data.length; i++) {
            if (data[i][prop] === currentValue) {
              rowspan++;
            } else {
              break;
            }
          }
          return { rowspan, colspan: 1 };
        }
    },
    /**
     * 运行时设置表格属性（列/数据/loading/分页/选中/索引列/标题/搜索条件等）
     * @param {Object} nextProps 需更新的属性集合
     */
    setProps(nextProps) {
      const propsToUpdate = nextProps || {};
      if ('columns' in propsToUpdate) this.internalColumns = Array.isArray(propsToUpdate.columns) ? propsToUpdate.columns : [];
      if ('dataSource' in propsToUpdate) this.internalData = Array.isArray(propsToUpdate.dataSource) ? propsToUpdate.dataSource : [];
      if ('loading' in propsToUpdate) this.internalLoading = !!propsToUpdate.loading;
      if ('pagination' in propsToUpdate) this.internalPagination = this.normalizePagination(propsToUpdate.pagination);
      if ('rowSelection' in propsToUpdate) this.$emit('update:rowSelection', propsToUpdate.rowSelection);
      if ('showIndexColumn' in propsToUpdate) this.$emit('update:showIndexColumn', !!propsToUpdate.showIndexColumn);
      if ('searchInfo' in propsToUpdate) { this.internalSearchInfo = propsToUpdate.searchInfo || {}; this.$emit('update:searchInfo', propsToUpdate.searchInfo); }
      if ('title' in propsToUpdate) this.$emit('update:title', propsToUpdate.title);
      if ('indexColumnProps' in propsToUpdate) this.$emit('update:indexColumnProps', propsToUpdate.indexColumnProps);
      if ('indexColumnTitle' in propsToUpdate) this.$emit('update:indexColumnTitle', propsToUpdate.indexColumnTitle);
    },
    setLoading(loading) { this.internalLoading = !!loading; },
    setColumns(nextColumns) { this.internalColumns = Array.isArray(nextColumns) ? nextColumns : []; },
    setDataSource(nextDataSource) { this.internalData = Array.isArray(nextDataSource) ? this.ensureKeys(nextDataSource) : []; },
    /** 获取当前数据源副本 */
    getDataSource() { return this.internalData.slice(); },
    /** 获取原始接口返回 */
    getRawDataSource() { return this.rawResult; },
    /** 获取当前列配置副本 */
    getColumns() { return (this.internalColumns || []).slice(); },
    /** 设置数据源（别名） */
    setTableData(values) { this.setDataSource(values); },
    /** 合并设置分页信息 */
    setPagination(info) { this.internalPagination = { ...this.internalPagination, ...(info || {}) }; }
  }
};
</script>
