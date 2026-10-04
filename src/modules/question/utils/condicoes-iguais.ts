interface CondicaoComparavel {
  logic?: string;
  conditions?: { questionId: unknown; operator: unknown; expectedValue: unknown }[];
}

const chave = (c?: CondicaoComparavel | null) =>
  JSON.stringify({
    logic: c?.logic ?? null,
    conditions: (c?.conditions ?? []).map((x) => [
      String(x.questionId),
      String(x.operator),
      String(x.expectedValue),
    ]),
  });

/**
 * As condições recebidas são as mesmas que já estão gravadas?
 *
 * A tela reenvia todas as condições em toda edição, mesmo quando só o texto
 * mudou. Se uma questão referenciada foi desativada depois, a validação
 * recusava e não dava mais para corrigir nem um erro de digitação
 * (tickets-documentacao, card 23). Só se valida o que mudou.
 */
export function condicoesIguais(
  gravadas?: CondicaoComparavel | null,
  recebidas?: CondicaoComparavel | null,
): boolean {
  return chave(gravadas) === chave(recebidas);
}
