import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBasicAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CustomerProductsResponseDto } from './dto/customer-products-response.dto';
import { IssueCardDto } from './dto/issue-card.dto';
import { BasicAuthGuard } from './guards/basic-auth.guard';
import { IssueCardResponse } from './interfaces/issue-card-response.interface';
import { IssuerService } from './issuer.service';

@ApiTags('cards')
@ApiBasicAuth()
@UseGuards(BasicAuthGuard)
@Controller()
export class IssuerController {
  constructor(private readonly issuerService: IssuerService) {}

  @Post('cards/issue')
  @ApiOperation({ summary: 'Request card issuance' })
  @ApiBody({ type: IssueCardDto })
  @ApiOkResponse({ type: IssueCardResponse })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid basic auth' })
  issueCard(@Body() payload: IssueCardDto): Promise<IssueCardResponse> {
    return this.issuerService.issueCard(payload);
  }

  @Get('customers/:documentNumber/product')
  @ApiOperation({ summary: 'Get customer product by document number' })
  @ApiParam({ name: 'documentNumber', example: '12345678' })
  @ApiOkResponse({ type: CustomerProductsResponseDto })
  @ApiNotFoundResponse({ description: 'Customer not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid basic auth' })
  async getCustomerProducts(
    @Param('documentNumber') documentNumber: string,
  ): Promise<CustomerProductsResponseDto> {
    const customer =
      await this.issuerService.getCustomerProductsByDocumentNumber(
        documentNumber,
      );

    return customer;
  }
}
