<template>
  <div class="role-content">
    <el-tooltip
      class="item"
      effect="dark"
      content="可选对话模板，与输入框并非绑定的查询关系"
      placement="top"
    >
      <el-select v-model="value" clearable placeholder="可选GPT模板" @change="changeSelect" @clear="clearSelect">
        <el-option
          v-for="item in roleList"
          :key="item.act"
          :label="item.act"
          :value="item.prompt">
        </el-option>
      </el-select>
    </el-tooltip>
  </div>
</template>

<script>
import { roles } from '@/utils/roleList'

export default {
  name: 'Role',
  data () {
    return {
      roleList: roles,
      value: ''
    }
  },
  methods: {
    changeSelect () {
      // 向父组件传递数据
      this.$emit('selectChange', this.value)
    },
    clearSelect () {
      this.value = ''
    }
  }
}
</script>

<style lang="less" scoped>
.el-select,
/deep/ .el-input,
/deep/ .el-input__inner {
  height: 100%;
}
</style>
