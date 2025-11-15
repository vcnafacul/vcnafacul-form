import { Types } from 'mongoose';
import { Submission } from 'src/modules/submission/submission.schema';
import { RuleSet } from '../rule-set.schema';
import { Rank } from '../value-object/rank';
import { UserByPoint } from '../value-object/user-by-point';
import { convertUserPointToRank } from './convert-user-point-to-rank';
import { applyScoreRule } from './apply-score-rule';

export function getRankingByPoint(
  subs: Map<string, Submission>,
  ruleSet: RuleSet,
  users: string[],
): Rank[] {
  const ranking: UserByPoint[] = [];
  for (const user of users) {
    const sub = subs.get(user);
    if (!sub) {
      ranking.push({ userId: user, totalScore: 0 });
      continue;
    }

    const answersByQ = new Map<string, any>(
      sub.answers.map((a: { questionId: Types.ObjectId; value: any }) => [
        a.questionId.toString(),
        a.value,
      ]),
    );
    let total = 0;
    for (const rule of ruleSet.scoringRules) {
      const qId = String(rule.question._id);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const value: any = answersByQ.get(qId);
      total += applyScoreRule(rule, value);
    }
    ranking.push({ userId: user, totalScore: total });
  }
  return convertUserPointToRank(ranking);
}
