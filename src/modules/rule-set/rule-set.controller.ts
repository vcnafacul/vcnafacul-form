import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { GetAllDtoInput } from 'src/common/base/dto/get-all.dto.input';
import { GetAllDtoOutput } from 'src/common/base/dto/get-all.dto.output';
import { CreateRuleSetDtoInput } from './dto/create-rule-set.dto.input';
import { RuleSet } from './rule-set.schema';
import { RuleSetSevice } from './rule-set.service';
import {
  Action,
  UpdateRuleSetDtoInput,
  UpdateRuleSetWithActionDtoInput,
} from './dto/update-rule-set.dto.input';
import { RankingDtoOutput } from './dto/ranking.dto.output';
import { RankingDtoInput } from './dto/ranking.dto.input';

@ApiTags('Conjunto de Regras')
@Controller('v1/rules-set')
export class RuleSetController {
  constructor(private readonly service: RuleSetSevice) {}

  @Post()
  @ApiResponse({
    description: 'criação de conjunto de regras',
    type: RuleSet,
  })
  async create(@Body() body: CreateRuleSetDtoInput): Promise<RuleSet> {
    return await this.service.create(body);
  }

  @Post('ranking')
  @ApiResponse({
    description: 'ranking de regras',
    type: RankingDtoOutput,
  })
  async rankFormUsers(
    @Body() body: RankingDtoInput,
  ): Promise<RankingDtoOutput> {
    return await this.service.rankFormUsers(body);
  }

  @Get(':id')
  @ApiResponse({
    description: 'buscar conjunto de regra por id',
  })
  async findById(@Param('id') id: string): Promise<RuleSet | null> {
    return await this.service.findById(id);
  }

  @Get()
  @ApiResponse({
    description: 'buscar todos os conjuntos de regras paginados',
  })
  async find(
    @Query() qyery: GetAllDtoInput,
  ): Promise<GetAllDtoOutput<RuleSet>> {
    return await this.service.find(qyery);
  }

  @Patch('add')
  @ApiResponse({
    description: 'adiciona regras ao conjunto de regras',
    type: RuleSet,
  })
  async addRule(@Body() body: UpdateRuleSetDtoInput): Promise<RuleSet> {
    return await this.service.addOrRemoveRule({
      ...body,
      action: Action.Add,
    } as UpdateRuleSetWithActionDtoInput);
  }

  @Patch('remove')
  @ApiResponse({
    description: 'remove regras ao conjunto de regras',
    type: RuleSet,
  })
  async removeRule(@Body() body: UpdateRuleSetDtoInput): Promise<RuleSet> {
    return await this.service.addOrRemoveRule({
      ...body,
      action: Action.Remove,
    } as UpdateRuleSetWithActionDtoInput);
  }
}
