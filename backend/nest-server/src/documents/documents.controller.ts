import { Controller, Get } from '@nestjs/common';
import { DocumentsService } from './documents.service';
// import { DocumentsController } from './documents.controller';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  findAll() {
    return this.documentsService.findAll();
  }
}
