import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { DocumentType } from './document.entity';

@Controller('documents')
@UseGuards(AuthGuard('jwt'))
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.documentsService.findAllByUser(req.user.userId);
  }

  @Get('summary')
  async getSummary(@Request() req: any) {
    return this.documentsService.getVaultSummary(req.user.userId);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
  )
  async upload(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: DocumentType,
    @Body('notes') notes?: string,
  ) {
    return this.documentsService.upload(req.user.userId, file, type, notes);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    await this.documentsService.delete(id, req.user.userId);
    return { message: 'Document deleted successfully' };
  }
}
