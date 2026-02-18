// backend/src/services/rulesService.ts
import { prisma } from '../config/database';

export interface RuleData {
  id: string;
  text: string;
  order: number;
  isActive: boolean;
}

export interface AcceptanceData {
  accepted: boolean;
  acceptedDate?: string;
}

export class RulesService {
  /**
   * Получить все активные правила
   */
  static async getRules(): Promise<RuleData[]> {
    const rules = await prisma.rule.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    return rules.map(rule => ({
      id: rule.id,
      text: rule.text,
      order: rule.order,
      isActive: rule.isActive
    }));
  }

  /**
   * Проверить, принял ли пользователь правила
   */
  static async checkAcceptance(userId: string): Promise<{ accepted: boolean }> {
    const acceptance = await prisma.ruleAcceptance.findUnique({
      where: { userId }
    });

    return {
      accepted: !!acceptance
    };
  }

  /**
   * Отметить, что пользователь принял правила
   */
  static async acceptRules(userId: string): Promise<{ acceptedDate: string }> {
    const acceptance = await prisma.ruleAcceptance.upsert({
      where: { userId },
      update: {
        acceptedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        userId,
        acceptedAt: new Date()
      }
    });

    return {
      acceptedDate: acceptance.acceptedAt.toISOString()
    };
  }

  /**
   * Сбросить принятие правил (для тестирования)
   */
  static async resetAcceptance(userId: string): Promise<{ success: boolean }> {
    await prisma.ruleAcceptance.delete({
      where: { userId }
    }).catch(() => {
      // Игнорируем ошибку, если записи не было
    });

    return { success: true };
  }

  /**
   * Получить полные данные для модалки (правила + статус принятия)
   */
  static async getRulesWithAcceptance(userId: string): Promise<{
    rules: RuleData[];
    accepted: boolean;
    acceptedDate?: string;
  }> {
    const [rules, acceptance] = await Promise.all([
      this.getRules(),
      prisma.ruleAcceptance.findUnique({
        where: { userId }
      })
    ]);

    return {
      rules,
      accepted: !!acceptance,
      acceptedDate: acceptance?.acceptedAt.toISOString()
    };
  }
}