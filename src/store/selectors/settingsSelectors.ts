import type { SettingsStore } from '../useSettingsStore';

export const selectLanguage = (state: SettingsStore) => state.language;
export const selectSetLanguage = (state: SettingsStore) => state.setLanguage;
export const selectSettings = (state: SettingsStore) => state.settings;
export const selectIsDarkMode = (state: SettingsStore) => state.isDarkMode;
