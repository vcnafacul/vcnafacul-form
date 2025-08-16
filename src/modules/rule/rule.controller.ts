import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAllDtoInput } from 'src/common/base/dto/get-all.dto.input';
import { GetAllDtoOutput } from 'src/common/base/dto/get-all.dto.output';
import { Rule } from './rule.schema';
import { CreateRuleDtoInput } from './dto/create-rule.dto.input';
import { RuleSevice } from './rule.service';
import { ConfigSchemaValidationPipe } from './pipe/ajv-validations.pipe';

@ApiTags('Regras')
@Controller('v1/rule')
export class RuleController {
  constructor(private readonly service: RuleSevice) {}

  @Post()
  @ApiBody({
    description: `
    **Type**:
    - Score: Regra de pontuação
    - TieBreaker: Regra de desempate

    **Strategy**:
    - PerOption: Seleção de uma ou mais opções
    - NumericRange: Faixa numéricas de pontuação

      **PerOption**:
    examples: {
      config: {
        "points": {
            "A": 5,
            "B": 3,
            "C": 0
          }
      },
    }
      
      **NumericRange**:
    examples: {
      config: {
          ranges: [
            { min: 0, max: 1000, points: 10 },
            { min: 1000, max: 3000, points: 5 },
            { min: 3000, max: null, points: 0 },
          ]
        },
    }`,
    // type: CreateRuleDtoInput,
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string', enum: ['Score', 'TieBreaker'] },
        strategy: { type: 'string', enum: ['PerOption', 'NumericRange'] },
        questionId: { type: 'string' },
        config: {
          type: 'object',
          example: { points: { A: 5, B: 3 } }, // ou ranges [...]
        },
        weight: { type: 'number' },
      },
      required: [
        'name',
        'description',
        'type',
        'strategy',
        'questionId',
        'config',
      ],
    },
  })
  async create(
    @Body(ConfigSchemaValidationPipe) body: CreateRuleDtoInput,
  ): Promise<Rule> {
    return await this.service.create(body);
  }

  @Get(':id')
  @ApiResponse({
    description: 'buscar regra por id',
    type: Rule,
  })
  async findById(@Param('id') id: string): Promise<Rule | null> {
    return await this.service.findById(id);
  }

  @Get()
  @ApiResponse({
    description: 'buscar todas regras paginados',
    type: GetAllDtoOutput<Rule>,
  })
  async find(@Query() qyery: GetAllDtoInput): Promise<GetAllDtoOutput<Rule>> {
    return await this.service.find(qyery);
  }
}
