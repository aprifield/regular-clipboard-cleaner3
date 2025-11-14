<script setup lang="ts">
import { HistoryEvent } from '@/types/history-event';
import type { HistoryItem } from '@/types/history-item';
import type { Settings } from '@/types/settings';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import ClipboardHistoryText from '@/components/ClipboardHistoryText.vue';

interface TableHistoryItem extends HistoryItem {
  index: number;
  row: number;
}

interface CopyEventParams {
  eventName: string;
  text: string;
  historyEvent: HistoryEvent;
}

const props = defineProps<{
  historyItems: HistoryItem[];
  settings: Settings;
}>();

const emit = defineEmits<{
  (e: 'clipboard-escape-keydown'): void; // FIXME rename
  (e: 'clipboard-delete-click', value: string): void; // FIXME rename
}>();

const search = ref('');
const isTextFieldFocused = ref(false);
const selectedIndex = ref(-1);
const searchTimeoutId = ref(-1);
const findTargetTimeoutId = ref(-1);
const historyItemHeight = ref(32);
const historyContainerHeight = ref(300);
const keyboardEvents = ref<KeyboardEvent[]>([]);
const copyEventParams = ref<CopyEventParams>();
const textField = ref<{ $el: HTMLDivElement } | null>(null);
const historyList = ref<{ $el: HTMLDivElement } | null>(null);

const maxVisibleItemCount = computed(() => {
  return Math.floor(historyContainerHeight.value / historyItemHeight.value);
});

const tableHistoryItems = computed<TableHistoryItem[]>(() => {
  return props.historyItems.map((item, index) => {
    return { ...item, index, row: index + 1 };
  });
});

const currentHistoryItems = computed<TableHistoryItem[]>(() => {
  if (search.value) {
    const wordRegExps = search.value
      .split(' ')
      .filter((word) => word)
      .map((word) => word.replace(/[.*+?^=!:${}()|[\]/\\]/g, '\\$&'))
      .map((word) => new RegExp(word, 'i'));
    if (wordRegExps.length) {
      return tableHistoryItems.value.filter((item) =>
        wordRegExps.every((re) => re.test(item.text))
      );
    } else {
      return tableHistoryItems.value;
    }
  } else {
    return tableHistoryItems.value;
  }
});

const tooltipHistoryEvent = computed<HistoryEvent>(() => {
  return createHistoryEvent();
});

const initStatus = () => {
  search.value = '';
  selectedIndex.value = -1;
  keyboardEvents.value = [];
  copyEventParams.value = undefined;
};

const createHistoryEvent = (): HistoryEvent => {
  const event = keyboardEvents.value[keyboardEvents.value.length - 1];
  if (event) {
    return {
      altKey: event.altKey,
      code: event.code,
      ctrlKey: event.ctrlKey,
      key: event.key,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      events: keyboardEvents.value.map((e) => ({
        altKey: e.altKey,
        code: e.code,
        ctrlKey: e.ctrlKey,
        key: e.key,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
      })),
    };
  } else {
    return {
      altKey: false,
      code: undefined,
      ctrlKey: false,
      key: undefined,
      metaKey: false,
      shiftKey: false,
      events: [],
    };
  }
};
const focusInTextField = () => {
  if (!isTextFieldFocused.value) {
    (textField.value!.$el.querySelector('input') as HTMLInputElement).focus();
  }
};

const focusOutTextField = () => {
  if (isTextFieldFocused.value) {
    (textField.value!.$el.querySelector('input') as HTMLInputElement).blur();
  }
};

const tryEmitCopyEvent = (params: CopyEventParams) => {
  if (keyboardEvents.value.length) {
    copyEventParams.value = params;
  } else {
    emitCopyEvent(params);
  }
};

const emitCopyEvent = (params: CopyEventParams) => {
  console.log('CopyEventParams', params);
  // FIXME impl
  // this.$emit(
  //   params.eventName,
  //   params.text,
  //   params.historyEvent
  // );
  initStatus();
};

const adjustScrollPositionAndFindTargetRow = async (targetIndex: number) => {
  const offset =
    historyItemHeight.value * (maxVisibleItemCount.value + 1) -
    historyContainerHeight.value;

  const visibleScrollRange = [
    targetIndex < maxVisibleItemCount.value
      ? 0
      : (targetIndex - maxVisibleItemCount.value) * historyItemHeight.value +
        offset,
    targetIndex * historyItemHeight.value,
  ];

  const scrollTop = historyList.value!.$el.scrollTop;

  if (scrollTop < visibleScrollRange[0]) {
    historyList.value!.$el.scrollTop = visibleScrollRange[0];
  } else if (scrollTop > visibleScrollRange[1]) {
    historyList.value!.$el.scrollTop = visibleScrollRange[1];
  }

  return new Promise((resolve: (targetRow: Element | null) => void) => {
    let retryCount = 0;
    findTargetTimeoutId.value = window.setInterval(() => {
      const targetRow = document.querySelector(`#clipboard-row-${targetIndex}`);
      if (targetRow || 10 < retryCount) {
        resolve(targetRow);
        window.clearInterval(findTargetTimeoutId.value);
        setTimeout(() => {
          findTargetTimeoutId.value = -1;
        });
        return;
      }

      retryCount++;
      console.log('[ClipboardHistory] find target row failed.', retryCount);
    });
  });
};

const onSearchInput = (str: string) => {
  window.clearTimeout(searchTimeoutId.value);
  searchTimeoutId.value = window.setTimeout(() => {
    search.value = str;
    selectedIndex.value = -1;
  }, 300);
};

const onListItemClick = (text: string) => {
  tryEmitCopyEvent({
    eventName: 'clipboard-list-item-click',
    text,
    historyEvent: createHistoryEvent(),
  });
};

const onDeleteClick = (text: string) => {
  emit('clipboard-delete-click', text);
  selectedIndex.value = -1;
};

const onWindowKeyDown = async (event: KeyboardEvent) => {
  if (event.isComposing) {
    return;
  }

  if (event.code === 'Escape') {
    event.preventDefault();
    emit('clipboard-escape-keydown');
    initStatus();
  } else if (event.code === 'Enter') {
    event.preventDefault();
    if (currentHistoryItems.value[selectedIndex.value]) {
      tryEmitCopyEvent({
        eventName: 'clipboard-enter-keydown',
        text: currentHistoryItems.value[selectedIndex.value].text,
        historyEvent: createHistoryEvent(),
      });
    }
  } else if (event.code === 'KeyF' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    focusInTextField();
    selectedIndex.value = -1;
  } else if (
    event.code === 'Home' ||
    event.code === 'End' ||
    event.code === 'PageUp' ||
    event.code === 'PageDown' ||
    event.code === 'ArrowUp' ||
    event.code === 'ArrowDown' ||
    event.code === 'Tab'
  ) {
    if (
      (event.code === 'Home' || event.code === 'End') &&
      isTextFieldFocused.value
    ) {
      return;
    }

    event.preventDefault();
    if (findTargetTimeoutId.value !== -1) {
      return;
    }

    let targetSelectedIndex = -1;
    if (event.code === 'Home' || event.code === 'End') {
      targetSelectedIndex =
        event.code === 'Home' ? 0 : currentHistoryItems.value.length - 1;
    } else if (event.code === 'PageUp' || event.code === 'PageDown') {
      targetSelectedIndex =
        (selectedIndex.value === -1 ? 0 : selectedIndex.value) +
        (event.code === 'PageUp'
          ? -maxVisibleItemCount.value
          : maxVisibleItemCount.value);
      if (!currentHistoryItems.value[targetSelectedIndex]) {
        targetSelectedIndex =
          event.code === 'PageUp' ? 0 : currentHistoryItems.value.length - 1;
      }
    } else {
      targetSelectedIndex =
        event.code === 'ArrowUp' || (event.code === 'Tab' && event.shiftKey)
          ? selectedIndex.value - 1
          : selectedIndex.value + 1;
      if (selectedIndex.value === -1 || targetSelectedIndex === -1) {
        focusInTextField();
        selectedIndex.value = -1;
      }
    }
    if (currentHistoryItems.value[targetSelectedIndex]) {
      const targetSelectedRow = await adjustScrollPositionAndFindTargetRow(
        targetSelectedIndex
      );
      if (targetSelectedRow) {
        selectedIndex.value = targetSelectedIndex;
      } else {
        selectedIndex.value = -1;
      }
    }
  } else {
    if (!keyboardEvents.value.some((e) => e.code == event.code)) {
      keyboardEvents.value.push(event);
    }
  }
};

const onWindowKeyUp = (event: KeyboardEvent) => {
  keyboardEvents.value = keyboardEvents.value.filter(
    (e) => e.code !== event.code
  );
  if (!keyboardEvents.value.length && copyEventParams.value) {
    emitCopyEvent(copyEventParams.value);
  }
};

const onWindowResize = () => {
  const historyContainer = historyList.value!.$el.closest('.v-card-text');
  historyContainerHeight.value = historyContainer
    ? historyContainer.clientHeight
    : 300;
};

const onWindowBlur = () => {
  keyboardEvents.value = [];
};

watch(
  () => props.historyItems,
  (newHistoryItems: HistoryItem[], oldHistoryItems: HistoryItem[]) => {
    if (oldHistoryItems.length <= newHistoryItems.length) {
      historyList.value!.$el.classList.add('scroll-behavior-smooth');
      historyList.value!.$el.scrollTop = 0;
      historyList.value!.$el.classList.remove('scroll-behavior-smooth');
    }
  }
);

watch(selectedIndex, () => {
  if (selectedIndex.value !== -1) {
    focusOutTextField();
  }
});

onMounted(() => {
  console.log('historyList', historyList.value);
  window.addEventListener('keydown', onWindowKeyDown);
  window.addEventListener('keyup', onWindowKeyUp);
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('blur', onWindowBlur);
  onWindowResize();
});

onUnmounted(() => {
  window.removeEventListener('keydown', onWindowKeyDown);
  window.removeEventListener('keyup', onWindowKeyUp);
  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener('blur', onWindowBlur);
});
</script>

<template>
  <v-container fluid class="clipboard-history pa-0">
    <v-card flat>
      <v-card-title>
        <v-text-field
          ref="textField"
          append-icon="mdi-magnify"
          dense
          hide-details
          label="Search"
          single-line
          :value="search"
          @input="onSearchInput"
          @focus="isTextFieldFocused = true"
          @blur="isTextFieldFocused = false"
        ></v-text-field>
      </v-card-title>
      <v-card-text class="pa-0">
        <v-virtual-scroll
          ref="historyList"
          bench="1"
          :items="currentHistoryItems"
          :height="historyContainerHeight"
          :item-height="historyItemHeight"
        >
          <template v-slot:default="{ item, index }">
            <!--
              Don't use mouseenter or mouseover.
              Scrolling with the arrow keys returns the focus to the line where the cursor was placed.
              The same problem occurs when closing the screen by clicking on a line.
            -->
            <v-list-item
              :key="`list-item-${index}`"
              :id="`clipboard-row-${index}`"
              class="v-list-item--link primary--text"
              :class="{ 'v-list-item--active': index === selectedIndex }"
              dense
              @click="onListItemClick(item.text)"
            >
              <template v-slot:prepend>
                <div class="history-row" @mousemove="selectedIndex = index">
                  <span
                    class="text-right secondary--text"
                    :style="{ 'min-width': '16px' }"
                  >
                    {{ item.row }}
                  </span>
                </div>
              </template>
              <v-list-item-title
                class="history-text"
                @mousemove="selectedIndex = index"
              >
                <ClipboardHistoryText
                  :text="item.text"
                  :time="item.time"
                  :tooltip="index === selectedIndex"
                  :tooltipLineCount="Math.floor((maxVisibleItemCount * 2) / 3)"
                  :historyEvent="tooltipHistoryEvent"
                  :settings="settings"
                />
              </v-list-item-title>
              <template v-slot:append>
                <div
                  class="history-action"
                  title="Delete"
                  @mousemove="selectedIndex = index"
                >
                  <v-btn
                    icon
                    x-small
                    @click.stop="onDeleteClick(item.text)"
                    @mousedown.stop
                  >
                    <v-icon>mdi-trash-can-outline</v-icon>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
            <v-divider
              v-if="index !== currentHistoryItems.length - 1"
              :key="`divider-${index}`"
            />
          </template>
        </v-virtual-scroll>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped lang="scss">
.clipboard-history {
  .v-card-title {
    padding-top: 8px;
    padding-bottom: 8px;
  }
  .v-card-text {
    height: calc(100vh - 46px);
  }
  .v-list-item {
    min-height: 32px;
    .history-text {
      padding-top: 4px;
      padding-bottom: 4px;
    }
    .history-row {
      margin-top: 5px !important;
      margin-bottom: 3px !important;
      margin-right: 8px !important;
    }
    .history-action {
      display: none;
      margin-top: 5px !important;
      margin-bottom: 3px !important;
    }
    &:hover {
      .history-action {
        display: inline-flex;
      }
    }
  }
  .scroll-behavior-smooth {
    scroll-behavior: smooth;
  }
}
</style>
