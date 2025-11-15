import { Rank } from '../value-object/rank';

export function getGroupRankingTie(rank: Rank[]): Rank[][] {
  const groups: Rank[][] = [];
  let currentGroup: Rank[] = [];
  for (let i = 0; i < rank.length; i++) {
    const current = rank[i];
    if (i > 0 && current.totalScore === rank[i - 1].totalScore) {
      currentGroup.push(current);
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [current];
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }
  return groups.filter((g) => g.length > 1);
}
