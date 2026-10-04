/**
 * A nova ordem das questões da seção (tickets-documentacao, card 21).
 *
 * A tela pode mandar só as questões que mostra. Antes, com uma questão
 * inativa na seção, toda reordenação dava 400 ("estão faltando no array").
 * Agora as **inativas** que não vieram vão para o fim, na ordem relativa
 * atual; faltar uma **ativa** continua sendo erro, para não reordenar às
 * cegas.
 *
 * Devolve os ids na ordem final, ou o motivo da recusa.
 */
export function ordemDasQuestoes(
  daSecao: { id: string; active: boolean }[],
  recebidas: string[],
): { ids: string[] } | { foraDaSecao: string[] } | { faltando: string[] } {
  const ids = new Set(daSecao.map((q) => q.id));
  const foraDaSecao = recebidas.filter((id) => !ids.has(id));
  if (foraDaSecao.length > 0) return { foraDaSecao };

  const vieram = new Set(recebidas);
  const ausentes = daSecao.filter((q) => !vieram.has(q.id));
  const faltando = ausentes.filter((q) => q.active).map((q) => q.id);
  if (faltando.length > 0) return { faltando };

  return { ids: [...new Set(recebidas), ...ausentes.map((q) => q.id)] };
}
