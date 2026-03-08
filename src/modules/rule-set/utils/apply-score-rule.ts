import { Rule } from 'src/modules/rule/rule.schema';
import { Strategy } from 'src/modules/rule/enum/strategy';
import { evaluate } from './safe-expression-eval';

export function applyScoreRule(
  rule: Rule,
  value: any,
  answersMap?: Map<string, any>,
): number {
  if (rule.strategy === Strategy.ComputedInverseProportional) {
    return applyComputedInverseProportional(rule, answersMap);
  }

  if (value === undefined || value === null) return 0;

  if (rule.strategy === Strategy.PerOption) {
    return applyPerOption(rule, value);
  }

  if (rule.strategy === Strategy.NumericRange) {
    return applyNumericRange(rule, value);
  }

  if (rule.strategy === Strategy.InverseProportional) {
    return applyInverseProportional(rule, value);
  }

  return 0;
}

function applyPerOption(rule: Rule, value: any): number {
  const points = rule.config?.points;
  if (!points) return 0;

  const strValue = String(value);
  return (points[strValue] as number) ?? 0;
}

function applyInverseProportional(rule: Rule, value: any): number {
  const referenceValue = rule.config?.referenceValue as number;
  const maxScore = rule.config?.maxScore as number;
  if (referenceValue == null || maxScore == null) return 0;

  const numValue = Number(value);
  if (isNaN(numValue)) return 0;
  if (numValue <= 0) return maxScore;

  return maxScore * Math.min(1, referenceValue / numValue);
}

function applyNumericRange(rule: Rule, value: any): number {
  const ranges = rule.config?.ranges as Array<{
    min?: number | null;
    max?: number | null;
    points: number;
  }>;
  if (!ranges) return 0;

  const numValue = Number(value);
  if (isNaN(numValue)) return 0;

  for (const range of ranges) {
    const min = range.min ?? Number.NEGATIVE_INFINITY;
    const max = range.max ?? Number.POSITIVE_INFINITY;

    if (numValue >= min && numValue <= max) {
      return range.points;
    }
  }

  return 0;
}

function applyComputedInverseProportional(
  rule: Rule,
  answersMap?: Map<string, any>,
): number {
  if (!answersMap) return 0;
  const questionIds = rule.config?.questionIds as string[];
  const expression = rule.config?.expression as string;
  const referenceValue = rule.config?.referenceValue as number;
  const maxScore = rule.config?.maxScore as number;
  if (!questionIds || !expression || referenceValue == null || maxScore == null)
    return 0;

  const variables: Record<string, number> = {};
  for (let i = 0; i < questionIds.length; i++) {
    const raw = answersMap.get(questionIds[i]);
    const num = Number(raw);
    if (raw === undefined || raw === null || isNaN(num)) return 0;
    variables[`Q${i}`] = num;
  }

  try {
    const result = evaluate(expression, variables);
    if (!isFinite(result) || isNaN(result)) return 0;
    if (result <= 0) return maxScore;
    return maxScore * Math.min(1, referenceValue / result);
  } catch {
    return 0;
  }
}
