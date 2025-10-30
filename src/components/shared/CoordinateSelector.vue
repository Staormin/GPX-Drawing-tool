<template>
  <v-select
    :model-value="modelValue"
    :items="items"
    :label="label"
    :placeholder="placeholder"
    clearable
    density="compact"
    item-title="label"
    item-value="value"
    variant="outlined"
    class="mb-4"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #no-data>
      <v-list-item>
        <v-list-item-title class="text-caption">No saved coordinates</v-list-item-title>
      </v-list-item>
    </template>
  </v-select>
</template>

<script lang="ts" setup>
defineProps<{
  modelValue: string | null
  items: Array<{ label: string; value: string }>
  label: string
  placeholder?: string
}>()

defineEmits<{
  'update:modelValue': [value: string | null]
}>()
</script>
