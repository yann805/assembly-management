import { Prisma } from '@prisma/client';

/**
 * Convertit les montants Decimal Prisma en nombres JS.
 */
export function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

export function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

/**
 * Formate un montant en FCFA.
 */
export function formatFcfa(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Vérifie que les montants sont positifs ou nuls.
 */
export function isPositiveAmount(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

/**
 * Calcule le mois et l'année d'une date.
 */
export function getMonthYear(date: Date): { month: number; year: number } {
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}
