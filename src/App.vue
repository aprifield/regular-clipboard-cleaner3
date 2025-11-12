<script setup lang="ts">
import ClipboardHistory from './components/ClipboardHistory.vue';
import ClipboardSettings from './components/ClipboardSettings.vue';
</script>

<template>
  <v-app>
    <v-main>
      <ClipboardSettings
        v-if="mode === 'settings'"
        :locale="locale"
        :platform="platform"
        :settings="settings"
        @clipboard-settings-change="onClipboardSettingsChange"
      />
      <ClipboardHistory
        v-else
        :historyItems="historyItems"
        :settings="settings"
        @clipboard-list-item-click="onClipboardListItemClick"
        @clipboard-delete-click="onClipboardDeleteClick"
        @clipboard-enter-keydown="onClipboardEnterKeyDown"
        @clipboard-escape-keydown="onClipboardEscapeKeyDown"
      />
    </v-main>
  </v-app>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
