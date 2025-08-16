import { ApiProperty } from '@nestjs/swagger';

export class RankingDto {
  @ApiProperty()
  rank: number;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  totalScore: number;
}

export class RankingDtoOutput {
  constructor(rankings: RankingDto[]) {
    this.rankings = rankings;
  }
  @ApiProperty()
  rankings: RankingDto[];
}
