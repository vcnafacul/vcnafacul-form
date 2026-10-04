import { Types } from 'mongoose';

/**
 * Nome da cópia: "<nome> (cópia)", com número só se já existir no formulário
 * (tickets-documentacao, card 18). Antes era "<nome>_<timestamp>".
 */
export function nomeDaCopia(nome: string, existentes: string[]): string {
  const usados = new Set(existentes);
  const base = `${nome} (cópia)`;
  if (!usados.has(base)) return base;
  let n = 2;
  while (usados.has(`${nome} (cópia ${n})`)) n++;
  return `${nome} (cópia ${n})`;
}

interface QuestaoCopiavel {
  _id: Types.ObjectId | string;
  text: string;
  helpText?: string;
  answerType: unknown;
  collection: unknown;
  options?: string[];
  active?: boolean;
  conditions?: {
    logic: unknown;
    conditions: { questionId: unknown; operator: unknown; expectedValue: unknown }[];
  } | null;
}

/**
 * As questões da cópia (card 18):
 * - sem `helpText` não vira o texto "undefined" (que aparecia no campo do
 *   estudante);
 * - condições que apontam para questões **da própria seção** passam a
 *   apontar para as cópias; as de outras seções ficam como estão;
 * - mantém se a questão estava ativa (antes toda cópia nascia ativa).
 */
export function copiarQuestoes<T extends QuestaoCopiavel>(originais: T[]): T[] {
  const novoId = new Map(originais.map((q) => [String(q._id), new Types.ObjectId()] as const));
  return originais.map((q) => {
    const copia: QuestaoCopiavel = {
      _id: novoId.get(String(q._id))!,
      text: q.text,
      answerType: q.answerType,
      collection: q.collection,
      options: q.options,
      active: q.active ?? true,
      conditions: q.conditions
        ? {
            logic: q.conditions.logic,
            conditions: q.conditions.conditions.map((c) => ({
              ...c,
              questionId: novoId.get(String(c.questionId))?.toString() ?? c.questionId,
            })),
          }
        : q.conditions,
    };
    if (q.helpText) copia.helpText = q.helpText;
    return { ...copia, createdAt: new Date(), updatedAt: new Date() } as unknown as T;
  });
}
