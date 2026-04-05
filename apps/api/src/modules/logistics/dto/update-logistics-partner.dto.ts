import { PartialType } from '@nestjs/swagger';
import { CreateLogisticsPartnerDto } from './create-logistics-partner.dto';

export class UpdateLogisticsPartnerDto extends PartialType(CreateLogisticsPartnerDto) {}
