<template>
  <v-select
    class="mb-4"
    clearable
    density="compact"
    item-title="label"
    item-value="value"
    :items="items"
    :label="label"
    :model-value="modelValue"
    :placeholder="placeholder"
    variant="outlined"
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
  modelValue: string | null;
  items: Array<{ label: string; value: string }>;
  label: string;
  placeholder?: string;
}>();

defineEmits<{
  'update:modelValue': [value: string | null];
}>();
</script>
