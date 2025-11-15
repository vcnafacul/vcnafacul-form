import { Rule } from 'src/modules/rule/rule.schema';

export function applyScoreRule(rule: Rule, value: any): number {
  for (const [key, point] of Object.entries(rule.config.points)) {
    if (key === value) {
      return point as number;
    }
  }
  return 0;
}
