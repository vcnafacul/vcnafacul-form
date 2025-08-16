export const perOptionDefinition = {
  type: 'object',
  properties: {
    points: { type: 'object', additionalProperties: { type: 'number' } },
    weight: { type: 'number' }, // <— permitir weight aqui
  },
  required: ['points'],
  additionalProperties: false,
} as const;
