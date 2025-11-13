<script setup lang="ts">
import type { HistoryEvent } from '@/types/history-event';
import type { HistoryItem } from '@/types/history-item';
import type { Settings } from '@/types/settings';
import { ref } from 'vue';
import ClipboardHistory from '@/components/ClipboardHistory.vue';
import ClipboardSettings from '@/components/ClipboardSettings.vue';

const mode = ref('history');
const locale = ref('en');
const platform = ref('win32');
const historyItems = ref<HistoryItem[]>([]);
const settings = ref<Settings>({});

function onClipboardListItemClick(text: string, event: HistoryEvent) {
  // this.ipcBridge.send('web-list-item-click', text, event);
}

function onClipboardDeleteClick(text: string) {
  // this.ipcBridge.send('web-delete-click', text);
}

function onClipboardEnterKeyDown(text: string, event: HistoryEvent) {
  // this.ipcBridge.send('web-enter-keydown', text, event);
}

function onClipboardEscapeKeyDown() {
  // this.ipcBridge.send('web-escape-keydown');
}

function onClipboardSettingsChange(settings: Settings) {
  // this.ipcBridge.send('web-settings-change', settings);
}
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
        :history-items="historyItems"
        :settings="settings"
        @clipboard-delete-click="onClipboardDeleteClick"
        @clipboard-enter-keydown="onClipboardEnterKeyDown"
        @clipboard-escape-keydown="onClipboardEscapeKeyDown"
        @clipboard-list-item-click="onClipboardListItemClick"
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
