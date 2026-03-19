import { ApiProperty } from '@nestjs/swagger';

export enum CardRequestStatus {
  REQUESTED = 'requested',
  ISSUED = 'issued',
}

export class IssueCardResponse {
  @ApiProperty({ example: 1 })
  requestId: number;

  @ApiProperty({
    enum: CardRequestStatus,
    example: CardRequestStatus.REQUESTED,
  })
  status: CardRequestStatus;
}
