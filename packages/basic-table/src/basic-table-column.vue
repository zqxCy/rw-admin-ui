<script>
/* eslint-disable no-console */
/**
 * 组件：ElBasicTableColumn
 * 职责：将业务列配置映射为 ElementUI 的 `el-table-column` 并提供插槽渲染与默认溢出处理
 * 说明：不使用函数式组件 以保证 inject 与组件树的兼容性
 */
// 列渲染子组件：封装 el-table-column 属性映射与默认溢出处理（Hover 展示完整文本）
// 注意：不能使用函数式组件 否则在 npm 包环境中 inject 和组件树查找可能失效
import ElTableColumn from 'rowinself-ui/packages/table-column';
import OverflowCell from './overflow-cell.js';
import { getByPath } from './utils';

export default {
  name: 'ElBasicTableColumn',
  components: { ElTableColumn, OverflowCell },
  inject: {
    /**
     * 从 ElBasicTable 注入获取插槽的函数 用于获取最新的 `$scopedSlots`。
     * 使用函数可避免直接引用导致的响应性问题
     * @returns {() => Object} 返回一个函数 执行后得到插槽对象
     */
    getBasicTableSlots: { default: () => () => ({}) }
  },
  props: {
    /**
     * 列配置对象（来自父组件 normalizedColumns）
     * @type {Object}
     */
    column: { type: Object, required: true },
    /** 全局溢出省略开关（列级未设置时生效） */
    ellipsis: { type: Boolean, default: false }
  },
  computed: {
    /**
     * 列类型
     * @returns {string}
     */
    colType() {
      return this.column.type || 'default';
    },
    /**
     * 列标题
     * @returns {string}
     */
    colLabel() {
      return this.column.title || this.column.label || '';
    },
    /**
     * 列字段（dataIndex/prop/key/field）
     * @returns {string}
     */
    colProp() {
      return this.column.dataIndex || this.column.prop || this.column.key || this.column.field || '';
    },
    /**
     * 插槽名（具名单元格插槽）
     * @returns {string|null}
     */
    slotName() {
      return this.column.slot || null;
    },
    /**
     * 是否显示溢出提示（列级优先 其次使用全局 ellipsis）
     * @returns {boolean}
     */
    showOverflowTooltip() {
      const raw = this.column.showOverflowTooltip;
      return raw != null ? raw : !!this.ellipsis;
    },
    /**
     * 是否使用自定义 Popover 溢出处理（默认列、无插槽、开启溢出提示且存在字段）
     * @returns {boolean}
     */
    usePopoverOverflow() {
      return this.colType === 'default' && !this.slotName && !!this.showOverflowTooltip && !!this.colProp;
    },
    /**
     * 透传给 el-table-column 的属性集合
     * @returns {Object}
     */
    tableColumnProps() {
      return {
        type: this.colType,
        label: this.colLabel,
        prop: this.colProp,
        width: this.column.width,
        minWidth: this.column.minWidth,
        align: this.column.align,
        headerAlign: this.column.headerAlign,
        fixed: this.column.fixed,
        sortable: this.column.sortable || false,
        sortOrders: this.column.sortOrders,
        index: this.column.index,
        selectable: this.column.selectable,
        reserveSelection: this.column.reserveSelection,
        showOverflowTooltip: this.usePopoverOverflow ? false : this.showOverflowTooltip
      };
    },
    /**
     * 是否存在对应的具名插槽（例如：statusCell、roleCell 等）
     * @returns {boolean}
     */
    hasNamedSlot() {
      if (!this.slotName) return false;
      const slots = this.getBasicTableSlots();
      return slots && typeof slots[this.slotName] === 'function';
    },
    /** 是否为手动模拟的索引列 */
    isIndexColumn() {
      return this.column.key === '__index__';
    }
  },
  methods: {
    /**
     * 构造传入插槽的列对象 补充 `field` 别名 兼容示例 `column.field` 写法
     * @returns {Object}
     */
    buildSlotColumn() {
      // 优先使用 dataIndex/prop
      let field = this.colProp || (this.column && this.column.field) || '';
      // 若未提供字段 且存在具名插槽 则尝试根据插槽名推导：去掉尾部 "Cell/cell"
      if (!field && this.slotName) {
        const name = String(this.slotName);
        field = name.replace(/(Cell|cell)$/g, '');
      }
      return { ...(this.column || {}), field };
    },
    /**
     * 渲染具名插槽内容
     * @param {Object} scope ElementUI 提供的作用域对象
     * @returns {VNode|null}
     */
    renderNamedSlot(scope) {
      if (!this.slotName) return null; // 未声明具名插槽时直接返回
      const slots = this.getBasicTableSlots();
      const fn = slots && slots[this.slotName];
      if (!fn) return null; // 未找到对应插槽函数
      try {
        // 传入 record/row 以及补充的 column.field
        return fn({
          row: scope.row,
          record: scope.row,
          column: this.buildSlotColumn(),
          $index: scope.$index
        });
      } catch (err) {
        // 插槽渲染异常仅记录日志 不中断表格渲染
        console.error('[ElBasicTableColumn] renderNamedSlot error:', err);
        return null;
      }
    },
    /**
     * 渲染通用 bodyCell 插槽
     * @param {Object} scope ElementUI 提供的作用域对象
     * @returns {VNode|null}
     */
    renderBodySlot(scope) {
      const slots = this.getBasicTableSlots();
      const fn = slots && slots.bodyCell;
      if (typeof fn !== 'function') return null; // 未提供 bodyCell 插槽
      try {
        return fn({
          row: scope.row,
          record: scope.row,
          column: this.buildSlotColumn(),
          $index: scope.$index
        });
      } catch (err) {
        console.error('[ElBasicTableColumn] renderBodySlot error:', err);
        return null;
      }
    },
    // 判断插槽输出是否为空内容（null/undefined/[]/仅注释或空文本）
    isEmptyRender(vnode) {
      if (vnode == null) return true;
      if (Array.isArray(vnode)) {
        if (!vnode.length) return true;
        return vnode.every((n) => {
          if (!n) return true;
          // Vue2 注释节点：isComment === true；空文本：text === '' 且无 tag
          return (n.isComment === true) || (n.text != null && String(n.text).trim() === '' && !n.tag);
        });
      }
      return (vnode.isComment === true) || (vnode.text != null && String(vnode.text).trim() === '' && !vnode.tag);
    },
    // 默认文本渲染（作为 bodyCell 为空时的回退）
    renderPlainTextCell(scope) {
      const value = scope && scope.row ? getByPath(scope.row, this.colProp) : '';
      const text = value == null ? '' : String(value);
      return this.$createElement('span', text);
    },
    /**
     * 渲染溢出单元格，使用 Popover 展示完整文本
     * @param {Object} scope ElementUI 提供的作用域对象
     * @returns {VNode}
     */
    renderOverflowCell(scope) {
      const value = scope && scope.row ? getByPath(scope.row, this.colProp) : '';
      const text = value == null ? '' : String(value);
      return this.$createElement(OverflowCell, { props: { text } });
    }
  },
  render (h) {
    console.log("::: ",)
    // 分组列：存在 children 时递归渲染子列 并以一个分组列包裹
    const hasChildren = Array.isArray(this.column && this.column.children) && this.column.children.length > 0;
    if (hasChildren) {
      // 递归渲染子列组件 保持 ellipsis 透传
      const childNodes = this.column.children.map((child) =>
        h('ElBasicTableColumn', { props: { column: child, ellipsis: this.ellipsis } })
      );
      // 分组列基本属性（不传递子列专属属性）
      const groupProps = {
        type: 'default',
        label: this.colLabel,
        align: this.column.align,
        headerAlign: this.column.headerAlign,
        fixed: this.column.fixed
      };
      return h(ElTableColumn, { props: groupProps }, childNodes);
    }

    const scopedSlots = {};
    // 非默认列类型（如 selection/index）不自定义单元格渲染 交由 Element 原生处理
    const validTypes = ['selection', 'index', 'expand'];
    // console.log("::: ",this.colType,validTypes.includes(this.colType))
    if (validTypes.includes(this.colType)) {
    // if (this.colType !== 'default') {
      return h(ElTableColumn, { props: this.tableColumnProps, scopedSlots });
    }
    // 优先使用具名插槽 与示例保持一致
    if (this.slotName && this.hasNamedSlot) {
      scopedSlots.default = (scope) => this.renderNamedSlot(scope);
    } else if (this.isIndexColumn) {
      // 索引列手动渲染
      scopedSlots.default = (scope) => {
        const { index } = this.column;
        let val = scope.$index + 1;
        if (typeof index === 'function') {
          val = index(scope.$index);
        }
        return this.$createElement('span', val);
      };
    } else {
      // 未提供具名插槽时 尝试使用通用 bodyCell 插槽 否则回退到溢出渲染
      const slots = this.getBasicTableSlots();
      const hasBodyCell = slots && typeof slots.bodyCell === 'function';
      if (hasBodyCell) {
        scopedSlots.default = (scope) => {
          const vnode = this.renderBodySlot(scope);
          if (this.isEmptyRender(vnode)) {
            return this.usePopoverOverflow ? this.renderOverflowCell(scope) : this.renderPlainTextCell(scope);
          }
          return vnode;
        };
      } else if (this.usePopoverOverflow) {
        scopedSlots.default = (scope) => this.renderOverflowCell(scope);
      } else {
        scopedSlots.default = (scope) => this.renderPlainTextCell(scope);
      }
    }
    // 返回最终的 table-column VNode 透传属性与 scopedSlots
    return h(ElTableColumn, { props: this.tableColumnProps, scopedSlots });
  }
};
</script>
