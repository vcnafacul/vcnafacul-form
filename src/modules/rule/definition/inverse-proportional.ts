export const inverseProportionalDefinition = {
  type: 'object',
  properties: {
    referenceValue: { type: 'number', exclusiveMinimum: 0 },
    maxScore: { type: 'number' },
  },
  required: ['referenceValue', 'maxScore'],
  additionalProperties: false,
} as const;
