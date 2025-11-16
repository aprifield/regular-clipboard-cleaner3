<script setup lang="ts">
import type { HistoryEvent } from '@/types/history-event';
import type { HistoryItem } from '@/types/history-item';
import type { Settings } from '@/types/settings';
import { onMounted, ref } from 'vue';
import { useTheme } from 'vuetify';
import ClipboardHistory from '@/components/ClipboardHistory.vue';
import ClipboardSettings from '@/components/ClipboardSettings.vue';

const theme = useTheme();
const mode = ref('history');
const locale = ref('en');
const platform = ref('win32');
const historyItems = ref<HistoryItem[]>([]);
const settings = ref<Settings>({});

function onClipboardListItemClick(text: string, event: HistoryEvent) {
  window.ipcBridge.send('web-list-item-click', text, event);
}

function onClipboardDeleteClick(text: string) {
  window.ipcBridge.send('web-delete-click', text);
}

function onClipboardEnterKeyDown(text: string, event: HistoryEvent) {
  window.ipcBridge.send('web-enter-keydown', text, event);
}

function onClipboardEscapeKeyDown() {
  window.ipcBridge.send('web-escape-keydown');
}

function onClipboardSettingsChange(settings: Settings) {
  window.ipcBridge.send('web-settings-change', { settings });
}

onMounted(() => {
  window.ipcBridge.send('web-app-mounted', {
    mode: mode.value,
  });
});

(() => {
  const searchParams = new URL(window.location.href).searchParams;
  mode.value = searchParams.get('mode') || 'history';
  locale.value = searchParams.get('locale') || 'en';
  platform.value = searchParams.get('platform') || 'win32';

  window.ipcBridge.send('web-app-created');
  window.ipcBridge.on('init-history', (event, args) => {
    historyItems.value = args;
  });
  window.ipcBridge.on('init-settings', (event, args) => {
    settings.value = args;
    theme.change(settings.value.darkTheme ? 'dark' : 'light');
    const html = document.querySelector('html') as HTMLHtmlElement;
    if (mode.value === 'history') {
      html.classList.add('overflow-hidden');
    }
    if (platform.value === 'win32') {
      if (settings.value.darkTheme) {
        html.classList.remove('webkit-scrollbar--light');
        html.classList.add('webkit-scrollbar--dark');
      } else {
        html.classList.remove('webkit-scrollbar--dark');
        html.classList.add('webkit-scrollbar--light');
      }
    }
  });
})();
</script>

<template>
  <v-app>
    <v-main>
      <ClipboardSettings
        v-if="mode === 'settings'"
        :locale="locale"
        :platform="platform"
        :settings="settings"
        @change:clipboard-settings="onClipboardSettingsChange"
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

<style lang="scss">
* {
  user-select: none;
}

html {
  overflow: auto;
}

.overflow-hidden {
  overflow: hidden;
}

.webkit-scrollbar {
  &--dark {
    ::-webkit-scrollbar {
      width: 12px;
      height: 10px;
    }
    ::-webkit-scrollbar-track {
      background: rgb(30, 30, 30);
    }
    ::-webkit-scrollbar-thumb {
      background: rgb(66, 66, 66);
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(79, 79, 79);
    }
  }
  &--light {
    ::-webkit-scrollbar {
      width: 12px;
      height: 10px;
    }
    ::-webkit-scrollbar-track {
      background: rgb(241, 241, 241);
    }
    ::-webkit-scrollbar-thumb {
      background: rgb(192, 192, 192);
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(168, 168, 168);
    }
  }
}
</style>
