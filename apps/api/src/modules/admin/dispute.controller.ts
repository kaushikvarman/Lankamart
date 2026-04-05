import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, JwtPayload } from '@/common/decorators/current-user.decorator';
import { PaginatedResponse } from '@/modules/vendors/vendors.service';
import { AdminService } from './admin.service';
import {
  CreateDisputeDto,
  DisputeResponseDto,
  QueryDisputesDto,
} from './dto';

@ApiTags('Disputes')
@Controller('disputes')
@ApiBearerAuth('access-token')
export class DisputeController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @ApiOperation({ summary: 'Create a dispute (any authenticated user)' })
  @ApiCreatedResponse({ description: 'Dispute created', type: DisputeResponseDto })
  @ApiConflictResponse({ description: 'Active dispute already exists for this order' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiForbiddenResponse({ description: 'Cannot create dispute for another user\'s order' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async createDispute(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDisputeDto,
  ): Promise<DisputeResponseDto> {
    return this.adminService.createDispute(user.sub, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'List my disputes' })
  @ApiOkResponse({ description: 'Paginated dispute list' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async listMyDisputes(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryDisputesDto,
  ): Promise<PaginatedResponse<DisputeResponseDto>> {
    return this.adminService.listUserDisputes(user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute details (owner or admin)' })
  @ApiOkResponse({ description: 'Dispute details', type: DisputeResponseDto })
  @ApiNotFoundResponse({ description: 'Dispute not found' })
  @ApiForbiddenResponse({ description: 'Not authorized to view this dispute' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getDispute(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DisputeResponseDto> {
    const dispute = await this.adminService.getDispute(id);

    const isAdmin =
      user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
    const isOwner = dispute.initiator?.id === user.sub;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You are not authorized to view this dispute');
    }

    return dispute;
  }
}
