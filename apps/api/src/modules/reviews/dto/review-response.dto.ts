import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Review, User, Product } from '@prisma/client';

type ReviewWithRelations = Review & {
  author?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>;
  product?: Pick<Product, 'id' | 'name'> | null;
  targetUser?: Pick<User, 'id' | 'firstName' | 'lastName'> | null;
};

export class ReviewResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() authorId!: string;
  @ApiProperty() authorName!: string;
  @ApiPropertyOptional() authorAvatar!: string | null;

  @ApiPropertyOptional() productId!: string | null;
  @ApiPropertyOptional() productName!: string | null;
  @ApiPropertyOptional() targetUserId!: string | null;
  @ApiPropertyOptional() targetUserName!: string | null;

  @ApiProperty() rating!: number;
  @ApiPropertyOptional() title!: string | null;
  @ApiPropertyOptional() content!: string | null;
  @ApiProperty({ type: [String] }) images!: string[];
  @ApiProperty() isVerified!: boolean;
  @ApiProperty() helpfulCount!: number;

  @ApiPropertyOptional() vendorReply!: string | null;
  @ApiPropertyOptional() vendorRepliedAt!: Date | null;

  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static fromEntity(entity: ReviewWithRelations): ReviewResponseDto {
    const dto = new ReviewResponseDto();
    dto.id = entity.id;
    dto.authorId = entity.authorId;
    dto.authorName = entity.author
      ? `${entity.author.firstName} ${entity.author.lastName}`
      : entity.authorId;
    dto.authorAvatar = entity.author?.avatarUrl ?? null;

    dto.productId = entity.productId;
    dto.productName = entity.product?.name ?? null;
    dto.targetUserId = entity.targetUserId;
    dto.targetUserName = entity.targetUser
      ? `${entity.targetUser.firstName} ${entity.targetUser.lastName}`
      : null;

    dto.rating = entity.rating;
    dto.title = entity.title;
    dto.content = entity.content;
    try {
      dto.images = entity.images
        ? (JSON.parse(entity.images) as string[])
        : [];
    } catch {
      dto.images = [];
    }
    dto.isVerified = entity.isVerified;
    dto.helpfulCount = entity.helpfulCount;

    dto.vendorReply = entity.vendorReply;
    dto.vendorRepliedAt = entity.vendorRepliedAt;

    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;

    return dto;
  }
}
