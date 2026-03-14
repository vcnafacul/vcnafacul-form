import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAllDtoInput } from 'src/common/base/dto/get-all.dto.input';
import { GetAllDtoOutput } from 'src/common/base/dto/get-all.dto.output';
import { CreateRuleSetDtoInput } from './dto/create-rule-set.dto.input';
import { RankingDtoInput } from './dto/ranking.dto.input';
import { RankingDtoOutput } from './dto/ranking.dto.output';
import {
  Action,
  UpdateRuleSetDtoInput,
  UpdateRuleSetWithActionDtoInput,
} from './dto/update-rule-set.dto.input';
import { RuleSet } from './rule-set.schema';
import { RuleSetService } from './rule-set.service';

@ApiTags('Conjunto de Regras')
@Controller('v1/rules-set')
export class RuleSetController {
  constructor(private readonly service: RuleSetService) {}

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
  async rankFormUsers(@Body() body: RankingDtoInput): Promise<RankingDtoOutput> {
    return await this.service.rankFormUsers(body);
  }

  @Get()
  @ApiResponse({
    description: 'buscar todos os conjuntos de regras paginados',
  })
  async find(@Query() qyery: GetAllDtoInput): Promise<GetAllDtoOutput<RuleSet>> {
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

  @Get('by-inscription/:inscriptionId')
  @ApiResponse({
    description: 'buscar ou criar conjunto de regras por inscriptionId',
    type: RuleSet,
  })
  async findOrCreateByInscriptionId(
    @Param('inscriptionId') inscriptionId: string,
  ): Promise<RuleSet> {
    return await this.service.findOrCreateByInscriptionId(inscriptionId);
  }

  @Get(':id/last-ranking')
  @ApiResponse({
    description: 'buscar último ranking gerado do conjunto de regras',
    type: RankingDtoOutput,
  })
  async getLastRanking(@Param('id') id: string): Promise<RankingDtoOutput | null> {
    return await this.service.getLastRanking(id);
  }

  @Get(':id')
  @ApiResponse({
    description: 'buscar conjunto de regra por id',
  })
  async findById(@Param('id') id: string): Promise<RuleSet | null> {
    return await this.service.findById(id);
  }

  @Patch(':id')
  @ApiResponse({
    description: 'atualizar nome do conjunto de regras',
    type: RuleSet,
  })
  async update(
    @Param('id') id: string,
    @Body() body: { name: string },
  ): Promise<RuleSet> {
    return await this.service.update(id, body.name);
  }

  @Delete(':id')
  @ApiResponse({
    description: 'deletar conjunto de regras',
  })
  async delete(@Param('id') id: string): Promise<void> {
    return await this.service.delete(id);
  }
}
