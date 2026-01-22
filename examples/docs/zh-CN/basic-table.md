## BasicTable 表格

用于展示多条结构类似的数据，封装了列配置、分页、远程加载与搜索表单联动。

### 基础示例

:::demo 传入 `columns` 渲染，并使用方法集进行分页、刷新、选择与数据更新（含远程加载模拟）。
```html
<template>
   <el-basic-table
      title=""
      v-bind="tableConfig"
      @register="onRegister"
    >
    <template #bodyCell="{ column, record }">
      <template v-if="column.field === 'role'">
        {{ record.role.name || '-' }}
      </template>
      <template v-if="column.field === 'status'">
        <el-tag size="mini" :type="record.status == 1 ? 'success' : 'danger'">
          {{ record.status == 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>
      <template v-if="column.field === 'loginTime'">
        <el-image :preview-src-list="['https://gips3.baidu.com/it/u=4283915297,3700662292&fm=3028&app=3028&f=JPEG&fmt=auto?w=1440&h=2560']" src="https://gips3.baidu.com/it/u=4283915297,3700662292&fm=3028&app=3028&f=JPEG&fmt=auto?w=1440&h=2560" alt="用户头像" style="width: 100px; height: 20px" />
      </template>
      <template v-if="column.field === 'action'">
        <TableAction :actions="getActionList(record)" />
      </template>
    </template>
  </el-basic-table>
</template>
<script>
export default {
  data() {
    return {
      tableProps: null,
      tableConfig:{
        /** 搜索表单配置：与 BasicTable 联动 */
        useSearchForm: true,
        formConfig: {
          labelWidth: 120,
          showActionButtonGroup: true, // 显示“查询/清空”按钮
          submitButtonText: '查询',
          resetButtonText: '清空',
          baseColProps: { span: 8 ,xl: 8,lg: 8,md: 12,sm: 12,xs: 12},
          actionColOptions: { span: 24 ,xl: 24,lg: 24,md: 12,sm: 12,xs: 12,align: 'right' },
          submitButtonOptions: { type: 'primary', size: 'mini', icon: 'el-icon-search' },
          resetButtonOptions: { type: 'warning', size: 'mini', icon: 'el-icon-clear' },
          actionButton: [
            {
              type: 'success',
              size: 'mini',
              icon: 'el-icon-plus',
              text: '添加',
              click: this.addModelFun
            }
          ],

          // 搜索项：管理员名称 + 角色筛选
          schemas: [
            {
              field: 'time',
              component: 'DateRangePicker',
              label: '交易时间',
              componentProps: {
                type: 'date',
                rangeSeparator: '至',
                startPlaceholder: '开始日期',
                endPlaceholder: '结束日期',      
                format: 'yyyy-MM-dd',
                valueFormat: 'yyyy-MM-dd'
              }
            },
            {
              field: 'name',
              component: 'Input',
              label: '管理员名称',
              componentProps: { placeholder: '请输入管理员名称' }
            },
            {
              field: 'administrator',
              component: 'ApiSelect',
              label: '角色名称',
              componentProps: ({ schema, tableAction, formActionType, formModel }) => {
                return {
                  placeholder: '请选择',
                  api: this.manageRbacAddUser,
                  params: {},
                  resultField: 'data.data',
                  labelField: 'name',
                  valueField: 'id',
                  afterFetch: (res) => {
                    // 处理角色选项
                    formModel.administrator = res[0].id
                    schema.disabled = res.length === 1
                    tableAction.reload()
                  },
                  change: (val) => {
                    console.log('val::: ', val)
                  }
                }
              }
            }
          ]
        },
        /** 列配置：对应后端返回的字段 */
        // columns: [
        //   { title: 'id', field: 'id', align: 'center', width: 50 },
        //   { title: '用户名', field: 'username', align: 'center',autoSpan: true, minWidth: 120 },
        //   { title: '所属角色', field: 'role', align: 'center', minWidth: 150 },
        //   { title: '状态', field: 'status', align: 'center', width: 140 },
        //   { title: '最后一次登录时间', field: 'loginTime', align: 'center', minWidth: 180 },
        //   { title: '登录ip', field: 'loginIp', align: 'center', minWidth: 240 },
        //   { title: '操作', field: 'action', align: 'center', width: 100, fixed: 'right',
        //     resizable: false }
        // ],
        api: this.fetchList,
        immediate: false,
        /* 渲染前数据处理 */
        afterFetch: (res) => {
          if (res && res.columns) {
            res.columns.push({ title: '操作', field: 'action', align: 'center', width: 100, fixed: 'right',
            resizable: false })
            this.tableProps.setColumns(res.columns)
          };        
          return res
        },
        /** 基本表格属性：模板通过 v-bind="basicProps" 绑定 */
        striped: true,
        bordered: true,
        maxHeight: 370,
        pagination: { pageSize: 10,background: true },
        showIndexColumn: true,
        indexColumnTitle:'',
        indexColumnProps: { width: 60,minWidth: '40px' },
        rowSelection: {
          selectable: (row, index) => {
            return row.status == 1;
          }
        },
        clickToRowSelect: true,
        // fetchSetting: {
        //   listField: 'data.result',
        //   totalField: 'data.count',
        //   pageField: 'data.page',
        //   sizeField: 'data.limit'
        // }
      }
    };
  },
  methods: {
    /**
     * 获取操作按钮列表
     * @param {Object} record 行数据
     * @returns {Array} 操作按钮配置数组
     */
    getActionList(record) {
      return [
        {
          // label: '',
          icon: 'el-icon-edit-outline',
          color: 'primary',
          onClick: () => {
            this.writeModelFun(record)
          }
        },
        {
          // label: '',
          icon: 'el-icon-s-tools',
          color: 'success',
          onClick: () => {
            this.writeModelFun(record)
          }
        },
        {
          // label: '',
          icon: 'el-icon-delete',
          color: 'danger',
          popConfirm: {
            title: '确定要删除这条记录吗？',
            type: 'warning',
            okText: '确定',
            cancelText: '取消'
          },
          onClick: () => {
            this.handleDelete(record)
          }
        }
      ]
    },
    onRegister(props) { this.tableProps = props; },
    manageRbacAddUser(params) {
      return this.$http.post('/roleOptions', {})
    },
    fetchList(params) {
      return this.$http.post('/userList', { params })
    },
    writeModelFun(row) {
      this.$message({ message: '打开控制台查看数据', type: 'success' });
      console.log('点击::: ', row)
    },
    addModelFun(){
      this.$message({ message: '添加数据', type: 'success' });
    },
    handleDelete(row) {
      this.$message({ message: '删除数据', type: 'success' });
    }
  }
};
</script>
```
:::

### 实现合并行或列

:::demo 传入 `columns` 渲染，并使用方法集进行分页、刷新、选择与数据更新（含远程加载模拟）。
```html
<template>
   <el-basic-table
      title=""
      v-bind="tableConfig"
      @register="onRegister"
    >
    <template #bodyCell="{ column, record }">
      <template v-if="column.field === 'role'">
        {{ record.role.name || '-' }}
      </template>
      <template v-if="column.field === 'status'">
        <el-tag size="mini" :type="record.status == 1 ? 'success' : 'danger'">
          {{ record.status == 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>
      <template v-if="column.field === 'action'">
        <TableAction :actions="getActionList(record)" />
      </template>
    </template>
  </el-basic-table>
</template>
<script>
export default {
  data() {
    return {
      tableProps: null,
      tableConfig:{
        /** 搜索表单配置：与 BasicTable 联动 */
        useSearchForm: true,
        formConfig: {
          labelWidth: 120,
          showActionButtonGroup: true, // 显示“查询/清空”按钮
          submitButtonText: '查询',
          resetButtonText: '清空',
          baseColProps: { span: 8 ,xl: 8,lg: 8,md: 12,sm: 12,xs: 12},
          actionColOptions: { span: 24 ,xl: 24,lg: 24,md: 12,sm: 12,xs: 12,align: 'right' },
          submitButtonOptions: { type: 'primary', size: 'mini', icon: 'el-icon-search' },
          resetButtonOptions: { type: 'warning', size: 'mini', icon: 'el-icon-clear' },
          actionButton: [
            {
              type: 'success',
              size: 'mini',
              icon: 'el-icon-plus',
              text: '添加',
              click: this.addModelFun
            }
          ],

          // 搜索项：管理员名称 + 角色筛选
          schemas: [
            {
              field: 'time',
              component: 'DateRangePicker',
              label: '交易时间',
              componentProps: {
                type: 'date',
                rangeSeparator: '至',
                startPlaceholder: '开始日期',
                endPlaceholder: '结束日期',      
                format: 'yyyy-MM-dd',
                valueFormat: 'yyyy-MM-dd'
              }
            },
            {
              field: 'name',
              component: 'Input',
              label: '管理员名称',
              componentProps: { placeholder: '请输入管理员名称' }
            },
            {
              field: 'administrator',
              component: 'ApiSelect',
              label: '角色名称',
              componentProps: ({ schema, tableAction, formActionType, formModel }) => {
                return {
                  placeholder: '请选择',
                  api: this.manageRbacAddUser,
                  params: {},
                  resultField: 'data.data',
                  labelField: 'name',
                  valueField: 'id',
                  afterFetch: (res) => {
                    // 处理角色选项
                    formModel.administrator = res[0].id
                    schema.disabled = res.length === 1
                    tableAction.reload()
                  },
                  change: (val) => {
                    console.log('val::: ', val)
                  }
                }
              }
            }
          ]
        },
        /** 列配置：对应后端返回的字段 */
        columns: [
          { title: 'id', field: 'id', align: 'center', width: 50 ,autoSpan: true},
          { title: '用户名', field: 'username', align: 'center', minWidth: 120 ,autoSpan: true},
          { title: '所属角色', field: 'role', align: 'center', minWidth: 150 },
          { title: '状态', field: 'status', align: 'center', width: 140, autoSpan: true },
          { title: '最后一次登录时间', field: 'loginTime', align: 'center', minWidth: 180, sortable: true, sortOrders: ['descending', 'ascending', null] },
          { title: '登录ip', field: 'loginIp', align: 'center', minWidth: 240 },
          { title: '操作', field: 'action', align: 'center', width: 100, fixed: 'right',
            resizable: false }
        ],
        api: this.fetchList,
        immediate: false,
        /* 渲染前数据处理 */
        afterFetch: (res) => res,
        /** 基本表格属性：模板通过 v-bind="basicProps" 绑定 */
        striped: true,
        bordered: true,
        maxHeight: 370,
        pagination: { pageSize: 10,background: true },
        showIndexColumn: true,
        // 配置 rowSelection 为对象，使用 selectable 控制勾选状态
        rowSelection: {
          selectable: (row) => {
            // 仅状态为 1 (启用) 的行可勾选
            return row.status == 1;
          }
        },
        clickToRowSelect: true,
      }
    };
  },
  methods: {
    /**
     * 获取操作按钮列表
     * @param {Object} record 行数据
     * @returns {Array} 操作按钮配置数组
     */
    getActionList(record) {
      return [
        {
          // label: '',
          icon: 'el-icon-edit-outline',
          color: 'primary',
          onClick: () => {
            this.writeModelFun(record)
          }
        },
        {
          // label: '',
          icon: 'el-icon-s-tools',
          color: 'success',
          onClick: () => {
            this.writeModelFun(record)
          }
        },
        {
          // label: '',
          icon: 'el-icon-delete',
          color: 'danger',
          popConfirm: {
            title: '确定要删除这条记录吗？',
            type: 'warning',
            okText: '确定',
            cancelText: '取消'
          },
          onClick: () => {
            this.handleDelete(record)
          }
        }
      ]
    },
    onRegister(props) { this.tableProps = props; },
    manageRbacAddUser(params) {
      return this.$http.post('/roleOptions', {})
    },
    fetchList(params) {
      return this.$http.post('/userList', { params })
    },
    writeModelFun(row) {
      this.$message({ message: '打开控制台查看数据', type: 'success' });
      console.log('点击::: ', row)
    },
    addModelFun(){
      this.$message({ message: '添加数据', type: 'success' });
    },
    handleDelete(row) {
      this.$message({ message: '删除数据', type: 'success' });
    }
  }
};
</script>
```
:::



### Methods示例

:::demo 结合接口加载树形数据，展示基础方法使用（刷新、展开/折叠、选中、局部更新/插入/删除、分页显示控制等）。
```html
<template>
  <div>
    <el-basic-table
      v-bind="tableConfig"
      @register="onRegister"
      @selection-change="onSelectionChange"
    >
    <template #toolbar>
     <el-button size="mini" type="primary" @click="tableProps.reload()">刷新</el-button>
      <el-button size="mini" type="success" @click="insertOne">插入一行</el-button>
      <el-button size="mini" type="warning" @click="updateFirst">更新首行</el-button>
      <el-button size="mini" type="danger" @click="deleteFirst">删除首行</el-button>
      <el-button size="mini" @click="toggleLoading">{{ isLoading ? '取消loading' : '设为loading' }}</el-button>
      <el-button size="mini" @click="toggleExpandAll">{{ isExpandAll ? '折叠全部' : '展开全部' }}</el-button>
      <el-button size="mini" @click="togglePagination">切换分页显示</el-button>
      <el-button size="mini" @click="redoHeight">重新计算高度</el-button>
    </template>
    <template #bodyCell="{ column, record }">
      <template v-if="column.field === 'role'">
        {{ record.role.name || '-' }}
      </template>
      <template v-if="column.field === 'status'">
        <el-tag size="mini" :type="record.status == 1 ? 'success' : 'danger'">
          {{ record.status == 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>
      <template v-if="column.field === 'action'">
        <TableAction :actions="getActionList(record)" />
      </template>
    </template>
    </el-basic-table>
    <div style="margin-top: 8px; font-size: 12px; color: #606266;">
      已选 keys：{{ selectedKeys.join(', ') || '-' }}
    </div>
  </div>
 </template>
<script>
export default {
  data() {
    return {
      tableProps: null,
      selectedKeys: [],
      isLoading: false,
      isExpandAll: false,
      tableConfig: {
        // title: '树形 + 多级表头（接口加载）',
        rowKey: 'id',
        useSearchForm: true,
        formConfig: {
          labelWidth: 100,
          showActionButtonGroup: true,
          submitButtonText: '查询',
          resetButtonText: '清空',
          baseColProps: { span: 8 },
          actionColOptions: { span: 8, align: 'right' },
          submitButtonOptions: { type: 'primary', size: 'mini' },
          resetButtonOptions: { type: 'warning', size: 'mini' },
          schemas: [
            { field: 'keyword', component: 'Input', label: '关键字', componentProps: { placeholder: '输入关键字' } },
            { field: 'region', component: 'Select', label: '区域', componentProps: { placeholder: '选择区域', options: [
              { label: '华东', value: 'east' },
              { label: '华北', value: 'north' },
              { label: '华南', value: 'south' }
            ] } }
          ]
        },
        columns: [
          {
            title: '基础信息',
            headerAlign: 'center',
            children: [
              { title: 'ID', field: 'id', align: 'center', width: 80 },
              { title: '名称', field: 'name', align: 'center', minWidth: 140 }
            ]
          },
          {
            title: '配送信息',
            headerAlign: 'center',
            children: [
              { title: '省份', field: 'province', width: 80 },
              { title: '市区', field: 'city', width: 120 },
              { title: '地址', field: 'address', width: 240 }
            ]
          },
          { title: '邮编', field: 'zip', align: 'center', width: 120 },
           { title: '操作', field: 'action', align: 'center', width: 160, fixed: 'right',
            resizable: false }
        ],
        api: this.fetchTree,
        immediate: true,
        fetchSetting: {
          listField: 'list',
          totalField: 'page.totalRowNum',
          pageField: 'page.perPage',
          sizeField: 'page.pageNum'
        },
        treeProps: {
          /** 子项字段名 */
          children: 'children',
          /** 是否有子项标志 */
          hasChildren: 'hasChildren'
        },
        striped: true,
        bordered: true,
        maxHeight: 380,
        pagination: { pageSize: 10, background: true },
        showIndexColumn: true,
        rowSelection: true
      }
    }
  },
  methods: {
     getActionList(record) {
      return [
        {
          label: '编辑',
          color: 'primary',
          onClick: () => {
            this.writeModelFun(record)
          }
        },
        {
          label: '设置',
          color: 'success',
          onClick: () => {
            this.writeModelFun(record)
          }
        },
        {
          label: '删除',
          color: 'danger',
          popConfirm: {
            title: '确定要删除这条记录吗？',
            type: 'warning',
            okText: '确定',
            cancelText: '取消'
          },
          onClick: () => {
            this.handleDelete(record)
          }
        }
      ]
    },
    writeModelFun(row) {
      console.log('修改数据::: ', row)
    },
    addModelFun(){
      this.$message({ message: '添加数据', type: 'success' });
    },
    handleDelete(row) {
      this.$message({ message: '删除数据', type: 'success' });
    },
    onRegister(props) { 
      this.tableProps = props 
    },
    onSelectionChange({ keys }) {
      this.selectedKeys = keys || []
    },
    togglePagination() { 
      this.tableProps.setShowPagination(!this.tableProps.getShowPagination())
    },
    redoHeight() { 
      this.tableProps.redoHeight() 
    },
    toggleLoading() {
      if (!this.tableProps) return;
      this.tableProps.setLoading(!this.isLoading);
      this.isLoading = !this.isLoading;
    },
    toggleExpandAll() {
      if (!this.tableProps) return;
      if (this.isExpandAll) {
        this.tableProps.collapseAll();
      } else {
        this.tableProps.expandAll();
      }
      this.isExpandAll = !this.isExpandAll;
    },
    insertOne() {
      const row = { id: Date.now(), name: '新节点', province: '上海', city: '浦东新区', address: '世纪大道 1 号', zip: 200000 };
      this.tableProps.insertTableDataRecord(row, 0);
    },
    updateFirst() {
      const data = this.tableProps.getDataSource()
      if (data && data.length) {
        this.tableProps.updateTableDataRecord(data[0].id, { name: '已更新' })
      }
    },
    deleteFirst() {
      const data = this.tableProps.getDataSource()
      if (data && data.length) {
        this.tableProps.deleteTableDataRecord(data[0].id)
      }
    },
    fetchTree(params) {
      return this.$http.post('/tableTreeList', { params })
    }
  }
}
</script>
```
:::


### 常用 Props 速览

### Methods

| 方法 | 类型 | 说明 |
| --- | --- | --- |
| `setProps` | `(props: Partial<BasicTableProps>) => void` | 设置表格参数 |
| `reload` | `(opt?: any) => void` | 刷新表格（携带分页与搜索参数） |
| `redoHeight` | `() => void` | 重新计算表格高度 |
| `setLoading` | `(loading: boolean) => void` | 设置表格 loading 状态 |
| `getDataSource` | `<T = Recordable>() => T[]` | 获取当前数据源副本 |
| `getRawDataSource` | `<T = Recordable>() => T` | 获取最近一次接口原始返回值 |
| `getColumns` | `() => BasicColumn[]` | 获取当前列配置 |
| `setColumns` | `(columns: BasicColumn[] | string[]) => void` | 设置表头列配置 |
| `setTableData` | `<T = Recordable>(values: T[]) => void` | 设置表格数据（别名：setDataSource） |
| `setPagination` | `(info: Partial<PaginationProps>) => void` | 合并设置分页信息 |
| `deleteSelectRowByKey` | `(key: string | number) => void` | 根据唯一 key 取消选中行 |
| `getSelectRowKeys` | `() => Array<string | number>` | 获取选中行的 keys |
| `getSelectRows` | `<T = Recordable>() => T[]` | 获取选中行数据 |
| `clearSelectedRowKeys` | `() => void` | 清空所有选中行 |
| `setSelectedRowKeys` | `(rowKeys: Array<string | number>) => void` | 手动设置选中行 keys |
| `getPaginationRef` | `() => PaginationProps | boolean` | 获取当前分页信息 |
| `getShowPagination` | `() => boolean` | 获取是否显示分页 |
| `setShowPagination` | `(show: boolean) => Promise<void>` | 设置是否显示分页 |
| `getRowSelection` | `() => boolean | object` | 获取选择列配置 |
| `updateTableData` | `(index: number, key: string, value: any) => void` | 按索引更新某行字段值 |
| `updateTableDataRecord` | `(rowKey: string | number, record: Recordable) => Recordable | void` | 按唯一 `rowKey` 局部更新行数据 |
| `deleteTableDataRecord` | `(rowKey: string | number | string[] | number[]) => void` | 按唯一 `rowKey` 动态删除行数据 |
| `insertTableDataRecord` | `(record: Recordable, index?: number) => Recordable | void` | 按 `index` 指定插入位置，默认追加 |
| `getForm` | `() => FormActionType | null` | 获取搜索表单对象（启用 `useSearchForm` 时有效） |
| `expandAll` | `() => void` | 展开全部树形行 |
| `collapseAll` | `() => void` | 折叠全部树形行 |
| `clearSelection` | `() => void` | 清空表格勾选（元素原生方法封装） |

## Props

::: tip 温馨提醒
 以下为 BasicTable 真实支持的 props；更多基础行为参考 [table](./table.md)

:::

| 属性 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| title | `string` | - | - | 表格标题 |
| titleHelpMessage | `string` | - | - | 标题右侧提示文案 |
| columns | `BasicColumn[]` | - | - | [表格列配置](#basiccolumn) |
| dataSource | `any[]` | - | - | 本地数据源（与 `api` 互斥时以 `api` 为准） |
| api | `(...arg: any) => Promise<any> | any[]` | - | - | 远程加载函数（支持返回数组或 Promise） |
| striped | `boolean` | `false` | - | 斑马纹 |
| bordered | `boolean` | `false` | - | 表格边框 |
| size | `string` | - | `medium | small | mini` | 表格尺寸 |
| rowKey | `string | Function` | - | - | 行主键字段名或函数 |
| emptyText | `string` | - | - | 空数据文案 |
| highlightCurrentRow | `boolean` | `false` | - | 高亮当前行 |
| showSummary | `boolean` | `false` | - | 是否显示合计行 |
| summaryMethod | `Function` | - | - | 合计行计算方法 |
| ellipsis | `boolean` | `true` | - | 文本溢出省略（全局） |
| autoCreateKey | `boolean` | `true` | - | 自动生成稳定的 `key` |
| clickToRowSelect | `boolean` | `false` | - | 点击行是否切换勾选（需开启 `rowSelection`） |
| clearSelectOnPageChange | `boolean` | `false` | - | 翻页是否清空选中行 |
| treeProps | `object` | `{ children: 'children', hasChildren: 'hasChildren' }` | - | 树形表格字段映射 |
| useSearchForm | `boolean` | `false` | - | 启用搜索表单 |
| formConfig | `any` | - | - | 表单配置（透传） |
| fetchSetting | `FetchSetting` | [见下方说明](#fetchsetting) | - | 接口字段映射，支持点号路径 |
| beforeFetch | `(T)=>T` | - | - | 请求之前对参数进行处理 |
| afterFetch | `(T)=>T` | - | - | 请求之后对返回值进行处理 |
| handleSearchInfoFn | `(T)=>T` | - | - | 请求之前处理搜索条件参数 |
| immediate | `boolean` | `true` | - | 组件挂载后是否立即请求接口 |
| showIndexColumn | `boolean` | `true` | - | 是否显示序号列 |
| indexColumnProps | `object` | - | - | 序号列配置 |
| rowSelection | `boolean | object` | - | - | 选择列配置 |
| pagination | `object | false` | [见下方默认值](#pagination) | - | 分页信息配置，为 `false` 不显示分页 |
| loading | `boolean` | `false` | - | 表格 loading 状态 |
| maxHeight | `number` | - | - | 表格最大高度，超出显示滚动条 |


### BasicColumn

支持以下常用列配置，兼容 `field/prop/dataIndex/key` 多种字段写法，并支持分组列（`children`）。

| 属性 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| title/label | `string` | `''` | - | 列标题 |
| field/prop/dataIndex/key | `string` | `''` | - | 数据字段（多种别名兼容） |
| width/minWidth | `number` | - | - | 列宽/最小宽度 |
| align/headerAlign | `string` | - | `left | center | right` | 单元格/表头对齐 |
| fixed | `string | boolean` | - | `left | right | true` | 固定列（`left`/`right`） |
| sortable | `boolean` | `false` | `true | false` | 是否可排序（原生行为） |
| type | `string` | `default` | `default | selection | index` | 列类型 |
| slot | `string` | - | - | 具名单元格插槽名（如 `action`） |
| showOverflowTooltip | `boolean` | `true` | `true | false` | 是否显示溢出省略（全局 `ellipsis` 为默认） |
| children | `BasicColumn[]` | - | - | 分组列（多级表头） |

### FetchSetting

| 属性 | 类型 | 默认值 | 可选值 | 说明 |
| --- | --- | --- | --- | --- |
| pageField | `string` | `'page.perPage'` | - | 请求参数页码字段映射，支持点号路径；入参键取路径最后一段（如 `perPage`） |
| sizeField | `string` | `'page.pageNum'` | - | 请求参数每页数量字段映射，支持点号路径；入参键取路径最后一段（如 `pageNum`） |
| listField | `string` | `'list'` | - | 响应数据列表字段映射，支持点号路径；回退 `items/list/data` |
| totalField | `string` | `'page.totalRowNum'` | - | 响应总数字段映射，支持点号路径；回退 `page.total` |


### Pagination

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| total | `number` | `0` | 总条数（接口返回后自动写入） |
| pageCount | `number | null` | `null` | 总页数（可选，提供时也可用于显示分页） |
| pageSize | `number` | `10` | 每页条数 |
| currentPage | `number` | `1` | 当前页码 |
| pagerCount | `number` | `5` | 分页器按钮数量 |
| layout | `string` | `'total, sizes, prev, pager, next, jumper'` | 分页布局 |
| pageSizes | `number[]` | `[10, 20, 30, 40, 50, 100]` | 可选的每页条数 |
| background | `boolean` | `false` | 开启背景样式 |
| hideOnSinglePage | `boolean` | `false` | 仅单页时隐藏分页器 |
| small | `boolean` | `false` | 小尺寸分页器 |

> 显示条件：仅当 `total` 或 `pageCount` 任一存在时，分页器才会显示；其余字段按上述默认值归一化。

## 事件

| 事件 | 回调参数 | 说明 |
| --- | --- | --- |
| register | `Function(actions)` | 组件注册，返回方法集 |
| fetch-success | `Function({items,total})` | 接口请求成功后触发 |
| fetch-error | `Function(error)` | 接口请求失败后触发 |
| selection-change | `Function({keys, rows})` | 勾选变化触发 |
| row-click | `Function(record, column, event)` | 行点击触发（支持点击切换选中） |
| page-change | `Function(page)` | 页码变化触发 |
| page-size-change | `Function(size)` | 每页数量变化触发 |
| form-submit | `Function(searchInfo)` | 搜索表单提交触发 |


## Slots

| 名称     | 说明 |
| -------- | ---- |
| toolbar  | 表格顶部右侧区域 |
| bodyCell | 通用单元格插槽（作用域：`{ column, record, row, $index }`） |
| append   | 表格底部插槽（暂不支持） |
| empty    | 空状态插槽（暂不支持） |
| tableTitle | 表格顶部左侧区域（暂不支持） |
| expandedRowRender | 展开行区域（暂不支持） |
| headerTop | 表格顶部区域（暂不支持） |

## Form-Slots

当开启 form 表单后。以`form-xxxx`为前缀的 slot 会被视为 form 的 slot

xxxx 为 form 组件的 slot。具体参考[form 组件文档](./form.md#Slots)

e.g

```
form-submitBefore
```

## 内置组件（只能用于表格内部）

### TableAction

支持操作列组件，仅用于表格内部。

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| actions | `Array<ActionItem>` | `[]` | [操作数组（见下方）](#actionitem) |
| size | `string` | `mini` | 按钮尺寸（透传至 `ElLink`） |

#### ActionItem

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| text/label | `string` | `''` | 按钮文案 |
| type/color | `string` | `primary` | 按钮类型（透传至 `ElLink` 的 `type`） |
| icon | `string` | - | 图标名称（透传至 `ElLink` 的 `icon`） |
| onClick | `Function` | - | 点击回调；存在 `popConfirm` 时在确认后触发 |
| popConfirm | `PopConfirm` | - | 确认弹窗配置，使用 `ElPopconfirm` 包裹 [（见下方）](#popconfirm) |

#### PopConfirm

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| title | `string` | `''` | 确认提示文案 |
| type | `string` | `primary` | 确认按钮类型（映射 `confirmButtonType`） |
| cancelType | `string` | `primary` | 取消按钮类型（映射 `cancelButtonType`） |
| okText/confirmText | `string` | `确定` | 确认按钮文本（`okText` 优先生效） |
| cancelText | `string` | `取消` | 取消按钮文本 |
| customClass | `string` | `el-table-popconfirm` | 自定义样式类名 |
