import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartCallDto {
  @ApiProperty({ enum: ['voice', 'video'] })
  @IsEnum(['voice', 'video'])
  type: 'voice' | 'video';

  @IsOptional()
  @IsString()
  channelId?: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsString()
  workspaceSlug?: string;

  @IsOptional()
  @IsString()
  recipientId?: string;

  @IsOptional()
  @IsString()
  callId?: string;

  @IsOptional()
  @IsBoolean()
  notifyAll?: boolean;
}

export class UpdateCallDto {
  @IsString()
  action: 'join' | 'leave' | 'updateState' | 'promote' | 'remove' | 'endForAll' | 'screenShareStarted';

  @IsOptional()
  @IsNumber()
  uid?: number;

  @IsOptional()
  @IsBoolean()
  muted?: boolean;

  @IsOptional()
  @IsBoolean()
  videoOff?: boolean;
}

export class ScheduleCallDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['voice', 'video'])
  type: 'voice' | 'video';

  @IsDateString()
  scheduledFor: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsString()
  workspaceSlug?: string;

  @IsOptional()
  @IsString()
  channelId?: string;
}

export class SoundboardSoundDto {
  @IsString()
  soundId: string;

  @IsOptional()
  @IsString()
  callId?: string;
}
