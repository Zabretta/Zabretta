// backend/src/services/settingsService.ts
import { prisma } from '../config/database';

export interface SettingsData {
  theme: 'light' | 'dark' | 'auto' | 'brown';
  brightness: number;
  fontSize: number;
  showAnimations: boolean;
}

export interface SettingsWithMetadata extends SettingsData {
  updatedAt: string;
}

export class SettingsService {
  /**
   * Получить настройки пользователя
   */
  static async getSettings(userId: string): Promise<SettingsWithMetadata> {
    // ✅ ПРАВИЛЬНО: prisma.setting (единственное число)
    let settings = await prisma.setting.findUnique({
      where: { userId }
    });

    // Если настроек нет, создаём с значениями по умолчанию
    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          userId,
          theme: 'auto',
          brightness: 100,
          fontSize: 100,
          showAnimations: true
        }
      });
    }

    return {
      theme: settings.theme as SettingsData['theme'],
      brightness: settings.brightness,
      fontSize: settings.fontSize,
      showAnimations: settings.showAnimations,
      updatedAt: settings.updatedAt.toISOString()
    };
  }

  /**
   * Обновить настройки пользователя
   */
  static async updateSettings(userId: string, data: Partial<SettingsData>): Promise<SettingsWithMetadata> {
    // ✅ ПРАВИЛЬНО: prisma.setting
    const settings = await prisma.setting.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        theme: data.theme || 'auto',
        brightness: data.brightness || 100,
        fontSize: data.fontSize || 100,
        showAnimations: data.showAnimations ?? true
      }
    });

    return {
      theme: settings.theme as SettingsData['theme'],
      brightness: settings.brightness,
      fontSize: settings.fontSize,
      showAnimations: settings.showAnimations,
      updatedAt: settings.updatedAt.toISOString()
    };
  }

  /**
   * Синхронизировать настройки (проверка конфликтов)
   */
  static async syncSettings(userId: string, clientSettings: SettingsData): Promise<{
    merged: SettingsWithMetadata;
    conflicts?: string[];
  }> {
    const serverSettings = await this.getSettings(userId);
    const conflicts: string[] = [];

    (Object.keys(clientSettings) as Array<keyof SettingsData>).forEach(key => {
      if (clientSettings[key] !== serverSettings[key]) {
        conflicts.push(key);
      }
    });

    if (conflicts.length > 0) {
      return {
        merged: serverSettings,
        conflicts
      };
    }

    return {
      merged: serverSettings
    };
  }

  /**
   * Сбросить настройки к значениям по умолчанию
   */
  static async resetSettings(userId: string): Promise<SettingsWithMetadata> {
    const defaultSettings = {
      theme: 'auto',
      brightness: 100,
      fontSize: 100,
      showAnimations: true
    };

    // ✅ ПРАВИЛЬНО: prisma.setting
    const settings = await prisma.setting.upsert({
      where: { userId },
      update: defaultSettings,
      create: {
        userId,
        ...defaultSettings
      }
    });

    return {
      theme: settings.theme as SettingsData['theme'],
      brightness: settings.brightness,
      fontSize: settings.fontSize,
      showAnimations: settings.showAnimations,
      updatedAt: settings.updatedAt.toISOString()
    };
  }
}
