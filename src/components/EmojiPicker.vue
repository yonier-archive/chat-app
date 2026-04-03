<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  select: [emoji: string]
}>();

const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘',
  '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪',
  '😝', '🤑', '🤗', '🤭', '🫢', '🫣', '🤫', '🤔',
  '👍', '👎', '👏', '🙌', '👋', '🤚', '✋', '🖐',
  '💪', '🙏', '✌️', '🤞', '🤟', '🤘', '👌', '🤌',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '💯', '💢', '💥', '💫', '💦', '💨', '🔥', '✨'
];

const isOpen = ref(false);

const togglePicker = () => {
  isOpen.value = !isOpen.value;
};

const selectEmoji = (emoji: string) => {
  emit('select', emoji);
  isOpen.value = false;
};
</script>

<template>
  <div class="emoji-picker-container">
    <button @click="togglePicker" class="emoji-trigger" type="button">
      😀
    </button>
    <div v-if="isOpen" class="emoji-picker">
      <div class="emoji-grid">
        <button
          v-for="emoji in emojis"
          :key="emoji"
          @click="selectEmoji(emoji)"
          class="emoji-button"
          type="button"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.emoji-picker-container {
  position: relative;
}

.emoji-trigger {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: transform 0.2s;
}

.emoji-trigger:hover {
  transform: scale(1.1);
}

.emoji-picker {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 0.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 0.75rem;
  z-index: 1000;
  max-width: 280px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
}

.emoji-button {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.emoji-button:hover {
  background-color: #f1f5f9;
}
</style>
