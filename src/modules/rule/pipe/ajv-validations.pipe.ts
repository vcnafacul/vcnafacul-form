import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import Ajv from 'ajv';
import { Strategy } from '../enum/strategy';
import { computedInverseProportionalDefinition } from '../definition/computed-inverse-proportional';
import { inverseProportionalDefinition } from '../definition/inverse-proportional';
import { numericRangeDefinition } from '../definition/numeric-range';
import { perOptionDefinition } from '../definition/per-option';
import { CreateRuleDtoInput } from '../dto/create-rule.dto.input';

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });

const compiled = {
  [Strategy.NumericRange]: ajv.compile(numericRangeDefinition),
  [Strategy.PerOption]: ajv.compile(perOptionDefinition),
  [Strategy.InverseProportional]: ajv.compile(inverseProportionalDefinition),
  [Strategy.ComputedInverseProportional]: ajv.compile(computedInverseProportionalDefinition),
};

@Injectable()
export class ConfigSchemaValidationPipe implements PipeTransform {
  transform(value: CreateRuleDtoInput) {
    const strategy = value?.strategy;

    if (!strategy) return value; // sem strategy → inferida pelo service

    const validator = compiled[strategy];
    if (!validator) return value; // sem schema → sem validação

    const ok = validator(value?.config);
    if (!ok) {
      const msg = ajv.errorsText(validator.errors, { dataVar: 'config' });
      throw new BadRequestException(`Config inválido para strategy '${strategy}': ${msg}`);
    }

    // validações de negócio adicionais (ex.: ranges não sobrepostos)
    if (strategy === Strategy.NumericRange) {
      this.assertRanges(value.config.ranges);
    }

    return value;
  }

  private assertRanges(ranges: Array<{ min?: number | null; max?: number | null }>) {
    // checa ordenação e sobreposição (exemplo simples)
    const norm = ranges
      .map((r) => ({
        min: r.min ?? Number.NEGATIVE_INFINITY,
        max: r.max ?? Number.POSITIVE_INFINITY,
      }))
      .sort((a, b) => a.min - b.min || a.max - b.max);

    for (let i = 1; i < norm.length; i++) {
      if (norm[i].min < norm[i - 1].max) {
        throw new BadRequestException('Faixas de ranges se sobrepõem');
      }
    }
  }
}
