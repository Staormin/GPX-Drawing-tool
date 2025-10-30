<template>
  <v-dialog
    :max-width="maxWidth"
    :model-value="isOpen"
    @click:outside="$emit('close')"
    @keydown.enter="handleEnter"
    @keydown.esc="$emit('close')"
  >
    <v-card>
      <v-card-title>{{ title }}</v-card-title>

      <v-card-text>
        <slot />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="$emit('close')">{{ cancelText }}</v-btn>
        <v-btn color="primary" @click="$emit('submit')">{{ submitText }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    title: string;
    maxWidth?: string;
    cancelText?: string;
    submitText?: string;
    submitOnEnter?: boolean;
  }>(),
  {
    maxWidth: '600px',
    cancelText: 'Cancel',
    submitText: 'Submit',
    submitOnEnter: false,
  }
);

const emit = defineEmits<{
  close: [];
  submit: [];
}>();

function handleEnter() {
  if (props.submitOnEnter) {
    emit('submit');
  }
}
</script>
