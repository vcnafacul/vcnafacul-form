import { BadRequestException } from '@nestjs/common';

export function assertPerOptionKeysExist(
  question: { options?: string[] | { label: string; value: string }[] },
  config: { points: Record<string, number> },
) {
  if (!config?.points || typeof config.points !== 'object') {
    throw new BadRequestException('config.points é obrigatório');
  }

  // Normaliza opções da Question (aceita string[] ou {label,value}[])
  const optValues = new Set(
    (question.options ?? []).map((o: any) => (typeof o === 'string' ? o : o?.value)),
  );

  // Caso não haja opções na Question
  if (optValues.size === 0) {
    throw new BadRequestException('A Question selecionada não possui options');
  }

  // Checa se todas as chaves de points existem nas options
  for (const key of Object.keys(config.points)) {
    if (!optValues.has(key)) {
      throw new BadRequestException(`Option '${key}' não existe na Question selecionada`);
    }
  }
}
