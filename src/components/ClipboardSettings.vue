<script setup lang="ts">
import type { Settings } from '@/types/settings';
import { loadDictionary, translate } from '@/util/i18n';
import { computed } from 'vue';
import rules from '@/util/rules';
import defaultPreprocessing from '@/util/preprocessing';

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

const onClipboardSettingsChange = (setting: Settings) => {
  console.log('emit-value', { ...props.settings, ...setting }); // FIXME
  console.log(
    'emit-value',
    JSON.parse(JSON.stringify({ ...props.settings, ...setting })) // FIXME
  );
  emit(
    'clipboard-settings-change',
    JSON.parse(JSON.stringify({ ...props.settings, ...setting }))
  );
};
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
              >
              </v-switch>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-switch
                hide-details
                :label="__('settings.maintained')"
                :input-value="settings.maintained"
                @update:model-value="
                  onClipboardSettingsChange({ maintained: !!$event })
                "
              >
              </v-switch>
            </v-col>
          </v-row>
        </v-container>
        <v-divider class="my-2"></v-divider>
        <v-container>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                hide-details
                :label="__('settings.clearInterval')"
                :min="rules.clearInterval.min"
                :max="rules.clearInterval.max"
                :rules="[rules.clearInterval.rule]"
                :suffix="__('settings.seconds')"
                type="number"
                :model-value="rules.clearInterval.value(settings.clearInterval)"
                @change="onClipboardSettingsChange({ clearInterval: +$event })"
              >
              </v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                hide-details
                :label="__('settings.monitorInterval')"
                :min="rules.monitorInterval.min"
                :max="rules.monitorInterval.max"
                :rules="[rules.monitorInterval.rule]"
                :suffix="__('settings.seconds')"
                type="number"
                :model-value="
                  rules.monitorInterval.value(settings.monitorInterval)
                "
                @change="
                  onClipboardSettingsChange({ monitorInterval: +$event })
                "
              >
              </v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                hide-details
                :label="__('settings.maxHistoryCount')"
                :min="rules.maxHistoryCount.min"
                :max="rules.maxHistoryCount.max"
                :rules="[rules.maxHistoryCount.rule]"
                type="number"
                :model-value="
                  rules.maxHistoryCount.value(settings.maxHistoryCount)
                "
                @change="
                  onClipboardSettingsChange({ maxHistoryCount: +$event })
                "
              >
              </v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                hide-details
                :label="__('settings.maxTextLength')"
                :min="rules.maxTextLength.min"
                :max="rules.maxTextLength.max"
                :rules="[rules.maxTextLength.rule]"
                type="number"
                :model-value="rules.maxTextLength.value(settings.maxTextLength)"
                @change="onClipboardSettingsChange({ maxTextLength: +$event })"
              >
              </v-text-field>
            </v-col>
          </v-row>
        </v-container>
        <v-divider class="my-2"></v-divider>
        <v-container>
          <v-row>
            <v-col>{{ __('settings.shortcutComment') }}</v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="3">
              <v-checkbox
                hide-details
                label="Command Or Control"
                :input-value="shortcut.commandOrControl"
                @change="
                  onClipboardSettingsChange({
                    shortcut: { ...shortcut, commandOrControl: $event },
                  })
                "
              >
              </v-checkbox>
            </v-col>
            <v-col cols="12" sm="3">
              <v-checkbox
                hide-details
                label="Alt"
                :input-value="shortcut.alt"
                @change="
                  onClipboardSettingsChange({
                    shortcut: { ...shortcut, alt: $event },
                  })
                "
              >
              </v-checkbox>
            </v-col>
            <v-col cols="12" sm="3">
              <v-checkbox
                hide-details
                label="Shift"
                :input-value="shortcut.shift"
                @change="
                  onClipboardSettingsChange({
                    shortcut: { ...shortcut, shift: $event },
                  })
                "
              >
              </v-checkbox>
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
              ></v-select>
            </v-col>
          </v-row>
        </v-container>
        <v-divider class="my-2"></v-divider>
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
                    >
                    </v-textarea>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-switch
                hide-details
                :label="__('settings.closeAfterCopy')"
                :input-value="settings.closeAfterCopy"
                @update:model-value="
                  onClipboardSettingsChange({ closeAfterCopy: !!$event })
                "
              >
              </v-switch>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="6">
              <v-switch
                :disabled="platform === 'darwin'"
                hide-details
                :label="__('settings.pasteAfterCopy')"
                :input-value="settings.pasteAfterCopy"
                @update:model-value="
                  onClipboardSettingsChange({ pasteAfterCopy: !!$event })
                "
              >
              </v-switch>
              <span v-if="platform === 'darwin'" class="text-caption">
                ({{ __('settings.pasteAfterCopyComment') }})
              </span>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                hide-details
                :label="__('settings.pasteAfterCopyTimeout')"
                :min="rules.pasteAfterCopyTimeout.min"
                :max="rules.pasteAfterCopyTimeout.max"
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
              >
              </v-text-field>
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
              >
              </v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                hide-details
                :label="__('settings.commandAfterCopyTimeout')"
                :min="rules.commandAfterCopyTimeout.min"
                :max="rules.commandAfterCopyTimeout.max"
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
              >
              </v-text-field>
            </v-col>
          </v-row>
        </v-container>
        <v-divider class="my-2"></v-divider>
        <v-container>
          <v-row>
            <v-col>
              <v-switch
                hide-details
                :label="__('settings.showNearCursor')"
                :input-value="settings.showNearCursor"
                @change="onClipboardSettingsChange({ showNearCursor: $event })"
              >
              </v-switch>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-switch
                hide-details
                :label="__('settings.showFrame')"
                :input-value="settings.showFrame"
                @update:model-value="
                  onClipboardSettingsChange({ showFrame: !!$event })
                "
              >
              </v-switch>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-switch
                v-if="platform === 'darwin'"
                hide-details
                :label="__('settings.showDockIcon')"
                :input-value="settings.showDockIcon"
                @update:model-value="
                  onClipboardSettingsChange({ showDockIcon: !!$event })
                "
              >
              </v-switch>
              <v-switch
                v-else
                hide-details
                :label="__('settings.showTaskbarIcon')"
                :input-value="settings.showTaskbarIcon"
                @update:model-value="
                  onClipboardSettingsChange({ showTaskbarIcon: !!$event })
                "
              >
              </v-switch>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-switch
                hide-details
                :label="__('settings.darkTheme')"
                :input-value="settings.darkTheme"
                @update:model-value="
                  onClipboardSettingsChange({ darkTheme: !!$event })
                "
              >
              </v-switch>
            </v-col>
          </v-row>
        </v-container>
        <v-divider class="my-2"></v-divider>
        <v-container>
          <v-row>
            <v-col>
              <v-expansion-panels flat>
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    {{ __('settings.blockList') }}
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <!-- <v-combobox
                      :value="settings.blockList || []"
                      :append-icon="null"
                      hide-details
                      label="Block list"
                      placeholder="123456, password, qwerty"
                      multiple
                      outlined
                      @input="
                        onClipboardSettingsChange({
                          blockList: $event.filter((s) => s),
                        })
                      "
                    >
                      <template
                        v-slot:selection="{ attrs, item, parent, selected }"
                      >
                        <v-chip
                          v-bind="attrs"
                          color="secondary"
                          :input-value="selected"
                          label
                          small
                        >
                          <span class="pr-2">
                            {{ item }}
                          </span>
                          <v-icon small @click="parent.selectItem(item)">
                            $delete
                          </v-icon>
                        </v-chip>
                      </template>
                    </v-combobox> -->
                    <v-combobox
                      :model-value="settings.blockList || []"
                      hide-details
                      label="Block list"
                      placeholder="123456, password, qwerty"
                      multiple
                      outlined
                    >
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
  ::v-deep textarea {
    font-family: Consolas, monospace;
  }
}
.v-expansion-panel-header {
  padding: 0;
}
.v-expansion-panel-content {
  ::v-deep .v-expansion-panel-content__wrap {
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
