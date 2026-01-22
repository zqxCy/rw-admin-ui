/**
 * 工具函数集合：列映射、分页归一化、参数生成、数据补齐
 * 类型提示：通过 JSDoc 提供函数参数与返回值类型信息
 */

/**
 * 根据点号路径从对象中获取嵌套值
 * @param {Object} obj 源对象
 * @param {string} path 点号路径，如 'a.b.c'
 * @returns {*|undefined} 取到的值或 undefined
 */
export function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  const keys = String(path).split('.');
  let result = obj;
  for (const key of keys) {
    if (result == null) return undefined;
    result = result[key];
  }
  return result;
}

/**
 * 为数据源补齐稳定的 key 字段
 * @param {Array<Object>} list 原始数据源
 * @param {boolean} [autoCreate=true] 是否自动生成 key
 * @param {string|Function} rowKey 主键字段名或函数
 * @returns {Array<Object>} 处理后的数组
 */
export function ensureKeys(list, autoCreate = true, rowKey) {
  if (!Array.isArray(list)) return [];
  const hasKey = list.every((r) => r && (r.key !== undefined));
  if (hasKey || (!autoCreate && !rowKey)) return list;
  return list.map((r, idx) => ({ key: r.key != null ? r.key : (r.id != null ? r.id : idx + 1), ...r }));
}

/**
 * 归一化分页配置，提供默认值与安全检查
 * @param {Object} p 原始分页配置
 * @returns {Object} 规范化后的分页参数对象
 */
export function normalizePagination(p) {
  const src = p || {};
  /** 每页条数 */
  const pageSize = typeof src.pageSize === 'number' ? src.pageSize : 10;
  /** 当前页码 */
  const currentPage = typeof src.currentPage === 'number' ? src.currentPage : 1;
  return {
    /** 总条数 */
    total: typeof src.total === 'number' ? src.total : 0,
    /** 总页数（可选） */
    pageCount: typeof src.pageCount === 'number' ? src.pageCount : null,
    /** 每页条数 */
    pageSize,
    /** 当前页码 */
    currentPage,
    /** 分页器按钮数量 */
    pagerCount: typeof src.pagerCount === 'number' ? src.pagerCount : 5,
    /** 分页布局 */
    layout: src.layout || 'total, sizes, prev, pager, next, jumper',
    /** 可选的每页条数 */
    pageSizes: Array.isArray(src.pageSizes) ? src.pageSizes : [10, 20, 30, 40, 50, 100],
    /** 背景样式开关 */
    background: !!src.background,
    /** 单页隐藏分页器 */
    hideOnSinglePage: !!src.hideOnSinglePage,
    /** 小尺寸分页器 */
    small: !!src.small
  };
}

/**
 * 生成最终请求参数（分页 + 搜索 + 钩子）
 * @param {Object} options 选项
 * @param {Object} options.pagination 分页信息（含 currentPage/pageSize）
 * @param {Object} options.fetchSetting 字段映射（pageField/sizeField）
 * @param {Object} options.searchInfo 搜索条件
 * @param {Function} [options.beforeFetch] 请求前处理钩子
 * @param {Function} [options.handleSearchInfoFn] 搜索条件处理钩子
 * @returns {Object} 最终请求参数
 */
export function createFetchParams({ pagination, fetchSetting, searchInfo, beforeFetch, handleSearchInfoFn }) {
  const fs = fetchSetting || {};
  // 支持点号路径：取最后一段作为请求字段名（如 'page.perPage' -> 'perPage'）
  const pageFieldPath = fs.pageField || 'page';
  const sizeFieldPath = fs.sizeField || 'pageSize';
  const pageFieldKey = String(pageFieldPath).split('.').pop();
  const sizeFieldKey = String(sizeFieldPath).split('.').pop();
  // 组装分页参数（按映射字段名）
  let params = { [pageFieldKey]: pagination.currentPage, [sizeFieldKey]: pagination.pageSize };
  // 合并搜索条件（先处理 handleSearchInfoFn）
  const si = searchInfo || {};
  /** 处理后的搜索条件 */
  const handledSI = typeof handleSearchInfoFn === 'function' ? handleSearchInfoFn(si) : si;
  /** 请求前处理 */
  params = Object.assign({}, handledSI, params);
  // 请求前钩子处理 beforeFetch
  return typeof beforeFetch === 'function' ? beforeFetch(params) : params;
}

/**
 * 将列配置转换为渲染列（含前置特殊列）
 * @param {Object} options 选项
 * @param {Array<Object>} options.columns 列配置数组
 * @param {boolean} options.ellipsis 全局溢出省略
 * @param {boolean} options.showIndexColumn 是否显示索引列
 * @param {string} options.indexColumnTitle 索引列标题
 * @param {Object} options.indexColumnProps 索引列属性
 * @param {Object|boolean} options.rowSelection 选择列配置（对象可含 selectable/reserveSelection 等）或开关
 * @returns {Array<Object>} 渲染列数组
 */
export function mapColumns({ columns, ellipsis, showIndexColumn, indexColumnTitle, indexColumnProps, rowSelection }) {
  // console.log('mapColumns indexColumnProps:', indexColumnProps);
  const baseCols = (columns || []).map((c, i) => ({
    key: c.key != null ? c.key : (c.dataIndex != null ? c.dataIndex : (c.prop != null ? c.prop : (c.field != null ? c.field : `col_${i}`))),
    title: c.title,
    label: c.label,
    // 将 field 作为 dataIndex/prop 的后备，以兼容新版配置
    prop: c.prop != null ? c.prop : (c.dataIndex != null ? c.dataIndex : c.field),
    dataIndex: c.dataIndex != null ? c.dataIndex : (c.prop != null ? c.prop : c.field),
    // 同时保留 field 字段，便于 bodyCell 判断使用 column.field
    field: c.field,
    width: c.width,
    minWidth: c.minWidth,
    /** 对齐方式/表头对齐 */
    align: c.align,
    headerAlign: c.headerAlign,
    /** 固定列（left/right） */
    fixed: c.fixed,
    /** 是否可排序 */
    sortable: c.sortable,
    /** 排序轮询顺序 */
    sortOrders: c.sortOrders,
    /** 列类型（default/selection/index 等） */
    type: c.type,
    /** 具名插槽名称 */
    slot: c.slot,
    /** 溢出省略（优先列级；否则使用全局 ellipsis） */
    showOverflowTooltip: c.showOverflowTooltip != null ? c.showOverflowTooltip : !!ellipsis,
    children: Array.isArray(c.children) ? c.children : undefined,
    /** 是否自动合并相同值的行 */
    autoSpan: c.autoSpan
  }));
  // 前置特殊列（索引、选择）
  const special = [];
  if (showIndexColumn) {
    console.log("indexColumnTitle::: ",indexColumnTitle)
    special.push({
      key: '__index__',
      type: 'default', // 改为默认列以支持宽度自适应（type=index 时宽度固定）
      title: indexColumnTitle !== undefined ? indexColumnTitle : '序号',
      dataIndex: '',
      align: (indexColumnProps && indexColumnProps.align) || 'center',
      width: (indexColumnProps && indexColumnProps.width !== undefined) ? indexColumnProps.width : undefined,
      minWidth: (indexColumnProps && indexColumnProps.minWidth !== undefined) ? indexColumnProps.minWidth : '45px',
      index: (indexColumnProps && indexColumnProps.index) || undefined
    });
  }
  if (rowSelection) {
    const selectionCol = { key: '__selection__', type: 'selection', align: 'center', title: '', dataIndex: '' };
    if (typeof rowSelection === 'object') {
      Object.assign(selectionCol, rowSelection);
    }
    special.push(selectionCol);
  }
  return special.concat(baseCols);
}
