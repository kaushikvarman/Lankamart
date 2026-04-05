import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser, JwtPayload } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { UsersService, PaginatedResponse } from './users.service';
import {
  AdminUpdateUserDto,
  QueryUsersDto,
  UpdateUserDto,
  UserResponseDto,
  VendorPublicDto,
} from './dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Current user profile', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getMyProfile(
    @CurrentUser() user: JwtPayload,
  ): Promise<UserResponseDto> {
    return this.usersService.getProfile(user.sub);
  }

  @Patch('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ description: 'Updated user profile', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async updateMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Get('vendors/:slug')
  @Public()
  @ApiOperation({ summary: 'Get public vendor profile by business slug' })
  @ApiOkResponse({ description: 'Public vendor profile', type: VendorPublicDto })
  @ApiNotFoundResponse({ description: 'Vendor not found' })
  async getPublicVendorProfile(
    @Param('slug') slug: string,
  ): Promise<VendorPublicDto> {
    return this.usersService.getPublicVendorProfile(slug);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiOkResponse({ description: 'Paginated list of users' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  async listUsers(
    @Query() query: QueryUsersDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    return this.usersService.listUsers(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  @ApiOkResponse({ description: 'User details', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin update user status/role (admin only)' })
  @ApiOkResponse({ description: 'Updated user', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires ADMIN or SUPER_ADMIN role' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async adminUpdateUser(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.adminUpdateUser(id, dto, currentUser.role);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Soft delete user (SUPER_ADMIN only)' })
  @ApiOkResponse({ description: 'User soft-deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden: requires SUPER_ADMIN role' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.usersService.deleteUser(id);
  }
}
