
<template>
 <div>
    <el-form :model="form">
      <el-form-item label=""></el-form-item>
    </el-form>

    <el-button type="primary"></el-button>
    <el-switch
      v-model="value2"
      active-color="#13ce66"
      inactive-color="#ff4949">
    </el-switch>
 </div>
</template>


<script>
export default {
  this.$alert('提示', 'title', {
    confirmButtonText: 'confirm',
    callback: action => {
      
    }
  });
}
</script>
