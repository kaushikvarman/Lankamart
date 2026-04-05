import { ApiProperty } from '@nestjs/swagger';

export class RatingDistributionDto {
  @ApiProperty({ description: 'Count of 1-star reviews' }) 1!: number;
  @ApiProperty({ description: 'Count of 2-star reviews' }) 2!: number;
  @ApiProperty({ description: 'Count of 3-star reviews' }) 3!: number;
  @ApiProperty({ description: 'Count of 4-star reviews' }) 4!: number;
  @ApiProperty({ description: 'Count of 5-star reviews' }) 5!: number;
}

export class ReviewStatsDto {
  @ApiProperty({ description: 'Average rating across all reviews' })
  averageRating!: number;

  @ApiProperty({ description: 'Total number of reviews' })
  totalReviews!: number;

  @ApiProperty({ description: 'Count of reviews per star rating', type: RatingDistributionDto })
  ratingDistribution!: RatingDistributionDto;
}
