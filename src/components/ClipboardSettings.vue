<script setup lang="ts">
import type { Settings } from '@/types/settings';
import { computed } from 'vue';
import { loadDictionary, translate } from '@/util/i18n';
import defaultPreprocessing from '@/util/preprocessing';
import rules from '@/util/rules';

const props = defineProps<{
  locale: string;
  platform: string;
  settings: Settings;
}>();

const emit = defineEmits<{
  (e: 'clipboard-settings-change', value: Settings): void; // FIXME rename
}>();

const __ = computed(() => {
  loadDictionary(props.locale);
  return translate;
});

const shortcut = computed(() => {
  return props.settings.shortcut || {};
});

const keys = computed(() => {
  const letters: string[] = [''];
  for (let i = 0; i < 26; i++) {
    letters.push(String.fromCharCode(65 + i));
  }
  return letters;
});

function onClipboardSettingsChange(setting: Settings) {
  console.log('emit-value', { ...props.settings, ...setting }); // FIXME
  console.log(
    'emit-value',
    JSON.parse(JSON.stringify({ ...props.settings, ...setting })) // FIXME
  );
  emit(
    'clipboard-settings-change',
    JSON.parse(JSON.stringify({ ...props.settings, ...setting }))
  );
}
</script>

<template>
  <v-container>
    <v-card flat>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col>
              <v-switch
                hide-details
                :label="__('settings.startAtLogin')"
                :model-value="settings.startAtLogin"
                @update:model-value="
                  onClipboardSettingsChange({ startAtLogin: !!$event })
                "
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-switch
                hide-details
                :input-value="settings.maintained"
                :label="__('settings.maintained')"
                @update:model-value="
                  onClipboardSettingsChange({ maintained: !!$event })
                "
              />
            </v-col>
          </v-row>
        </v-container>
        <v-divider class="my-2" />
        <v-container>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                hide-details
                :label="__('settings.clearInterval')"
                :max="rules.clearInterval.max"
                :min="rules.clearInterval.min"
                :model-value="rules.clearInterval.value(settings.clearInterval)"
                :rules="[rules.clearInterval.rule]"
                :suffix="__('settings.seconds')"
                type="number"
                @change="onClipboardSettingsChange({ clearInterval: +$event })"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                hide-details
                :label="__('settings.monitorInterval')"
                :max="rules.monitorInterval.max"
                :min="rules.monitorInterval.min"
                :model-value="
                  rules.monitorInterval.value(settings.monitorInterval)
                "
                :rules="[rules.monitorInterval.rule]"
                :suffix="__('settings.seconds')"
                type="number"
                @change="
                  onClipboardSettingsChange({ monitorInterval: +$event })
                "
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                hide-details
                :label="__('settings.maxHistoryCount')"
                :max="rules.maxHistoryCount.max"
                :min="rules.maxHistoryCount.min"
                :model-value="
                  rules.maxHistoryCount.value(settings.maxHistoryCount)
                "
                :rules="[rules.maxHistoryCount.rule]"
                type="number"
                @change="
                  onClipboardSettingsChange({ maxHistoryCount: +$event })
                "
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                hide-details
                :label="__('settings.maxTextLength')"
                :max="rules.maxTextLength.max"
                :min="rules.maxTextLength.min"
                :model-value="rules.maxTextLength.value(settings.maxTextLength)"
                :rules="[rules.maxTextLength.rule]"
                type="number"
                @change="onClipboardSettingsChange({ maxTextLength: +$event })"
              />
            </v-col>
          </v-row>
        </v-container>
        <v-divider class="my-2" />
        <v-container>
          <v-row>
            <v-col>{{ __('settings.shortcutComment') }}</v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="3">
              <v-checkbox
                hide-details
                :input-value="shortcut.commandOrControl"
                label="Command Or Control"
                @change="
                  onClipboardSettingsChange({
                    shortcut: { ...shortcut, commandOrControl: $event },
                  })
                "
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-checkbox
                hide-details
                :input-value="shortcut.alt"
                label="Alt"
                @change="
                  onClipboardSettingsChange({
                    shortcut: { ...shortcut, alt: $event },
                  })
                "
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-checkbox
                hide-details
                :input-value="shortcut.shift"
                label="Shift"
                @change="
                  onClipboardSettingsChange({
                    shortcut: { ...shortcut, shift: $event },
                  })
                "
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-select
                dense
                hide-details
                :items="keys"
                :value="shortcut.key"
                @change="
                  onClipboardSettingsChange({
                    shortcut: { ...shortcut, key: $event },
                  })
                "
              />
            </v-col>
          </v-row>
        </v-container>
        <v-divider class="my-2" />
        <v-container>
          <v-row>
            <v-col>
              <v-expansion-panels flat>
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    {{ __('settings.preprocessing') }}
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-textarea
                      auto-grow
                      hide-details
                      outlined
                      :placeholder="defaultPreprocessing"
                      :value="settings.preprocessing || defaultPreprocessing"
                      @change="
                        onClipboardSettingsChange({ preprocessing: $event })
                      "
                    />
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-switch
                hide-details
                :input-value="settings.closeAfterCopy"
                :label="__('settings.closeAfterCopy')"
                @update:model-value="
                  onClipboardSettingsChange({ closeAfterCopy: !!$event })
                "
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="6">
              <v-switch
                :disabled="platform === 'darwin'"
                hide-details
                :input-value="settings.pasteAfterCopy"
                :label="__('settings.pasteAfterCopy')"
                @update:model-value="
                  onClipboardSettingsChange({ pasteAfterCopy: !!$event })
                "
              />
              <span v-if="platform === 'darwin'" class="text-caption">
                ({{ __('settings.pasteAfterCopyComment') }})
              </span>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                hide-details
                :label="__('settings.pasteAfterCopyTimeout')"
                :max="rules.pasteAfterCopyTimeout.max"
                :min="rules.pasteAfterCopyTimeout.min"
                :rules="[rules.pasteAfterCopyTimeout.rule]"
                :suffix="__('settings.milliseconds')"
                type="number"
                :value="
                  rules.pasteAfterCopyTimeout.value(
                    settings.pasteAfterCopyTimeout
                  )
                "
                @change="
                  onClipboardSettingsChange({ pasteAfterCopyTimeout: +$event })
                "
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                hide-details
                :label="__('settings.commandAfterCopy')"
                :value="settings.commandAfterCopy"
                @change="
                  onClipboardSettingsChange({ commandAfterCopy: $event })
                "
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                hide-details
                :label="__('settings.commandAfterCopyTimeout')"
                :max="rules.commandAfterCopyTimeout.max"
                :min="rules.commandAfterCopyTimeout.min"
                :rules="[rules.commandAfterCopyTimeout.rule]"
                :suffix="__('settings.milliseconds')"
                type="number"
                :value="
                  rules.commandAfterCopyTimeout.value(
                    settings.commandAfterCopyTimeout
                  )
                "
                @change="
                  onClipboardSettingsChange({
                    commandAfterCopyTimeout: +$event,
                  })
                "
              />
            </v-col>
          </v-row>
        </v-container>
        <v-divider class="my-2" />
        <v-container>
          <v-row>
            <v-col>
              <v-switch
                hide-details
                :input-value="settings.showNearCursor"
                :label="__('settings.showNearCursor')"
                @change="onClipboardSettingsChange({ showNearCursor: $event })"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-switch
                hide-details
                :input-value="settings.showFrame"
                :label="__('settings.showFrame')"
                @update:model-value="
                  onClipboardSettingsChange({ showFrame: !!$event })
                "
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-switch
                v-if="platform === 'darwin'"
                hide-details
                :input-value="settings.showDockIcon"
                :label="__('settings.showDockIcon')"
                @update:model-value="
                  onClipboardSettingsChange({ showDockIcon: !!$event })
                "
              />
              <v-switch
                v-else
                hide-details
                :input-value="settings.showTaskbarIcon"
                :label="__('settings.showTaskbarIcon')"
                @update:model-value="
                  onClipboardSettingsChange({ showTaskbarIcon: !!$event })
                "
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-switch
                hide-details
                :input-value="settings.darkTheme"
                :label="__('settings.darkTheme')"
                @update:model-value="
                  onClipboardSettingsChange({ darkTheme: !!$event })
                "
              />
            </v-col>
          </v-row>
        </v-container>
        <v-divider class="my-2" />
        <v-container>
          <v-row>
            <v-col>
              <v-expansion-panels flat>
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    {{ __('settings.blockList') }}
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-combobox
                      hide-details
                      label="Block list"
                      :model-value="settings.blockList || []"
                      multiple
                      outlined
                      placeholder="123456, password, qwerty"
                      @update:model-value="
                        onClipboardSettingsChange({
                          blockList: $event,
                        })
                      "
                    >
                      <template #selection="{ item, index }">
                        <v-chip
                          closable
                          label
                          size="small"
                          :text="item.title"
                          variant="flat"
                          @click:close="
                            onClipboardSettingsChange({
                              blockList: (settings.blockList || []).filter(
                                (__, idx) => idx !== index
                              ),
                            })
                          "
                        />
                      </template>
                    </v-combobox>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped lang="scss">
.container {
  max-width: 900px;
}
.v-input--selection-controls {
  margin-top: 0;
}
.v-textarea {
  :deep(textarea) {
    font-family: Consolas, monospace;
  }
}
.v-expansion-panel-header {
  padding: 0;
}
.v-expansion-panel-content {
  :deep(.v-expansion-panel-content__wrap) {
    padding: 0;
  }
}
.theme--light.v-expansion-panels .v-expansion-panel {
  color: rgba(0, 0, 0, 0.6);
}
.theme--dark.v-expansion-panels .v-expansion-panel {
  color: rgba(255, 255, 255, 0.7);
}
</style>
