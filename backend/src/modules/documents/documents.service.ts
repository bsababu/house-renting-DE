import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, DocumentStatus, DocumentType } from './document.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
  ) {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    userId: string,
    file: Express.Multer.File,
    type: DocumentType,
    notes?: string,
  ): Promise<Document> {
    // Create unique filename
    const ext = path.extname(file.originalname);
    const fileName = `${userId}_${type}_${Date.now()}${ext}`;
   const filePath = path.join(this.uploadDir, fileName);

    // Write file to disk
    await fs.promises.writeFile(filePath, file.buffer);
    this.logger.log(`Document uploaded: ${fileName} for user ${userId}`);

    // Save record
    const doc = this.documentsRepository.create({
      userId,
      type,
      fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      status: DocumentStatus.PENDING,
      notes: notes || null,
    });

    return this.documentsRepository.save(doc);
  }

  async findAllByUser(userId: string): Promise<Document[]> {
    return this.documentsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Document> {
    const doc = await this.documentsRepository.findOne({
      where: { id, userId },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async delete(id: string, userId: string): Promise<void> {
    const doc = await this.findOne(id, userId);
    // Delete file from disk
    const filePath = path.join(this.uploadDir, doc.fileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    await this.documentsRepository.remove(doc);
    this.logger.log(`Document deleted: ${doc.fileName}`);
  }

  async getVaultSummary(userId: string) {
    const docs = await this.findAllByUser(userId);

    const typeMap: Record<string, { label: string; required: boolean }> = {
      [DocumentType.SCHUFA]: { label: 'Schufa Report', required: true },
      [DocumentType.INCOME_PROOF]: { label: 'Income Proof', required: true },
      [DocumentType.ID_DOCUMENT]: { label: 'ID / Passport', required: true },
      [DocumentType.EMPLOYMENT_CONTRACT]: { label: 'Employment Contract', required: false },
      [DocumentType.RENTAL_HISTORY]: { label: 'Previous Rental Reference', required: false },
      [DocumentType.WBS]: { label: 'WBS Certificate', required: false },
    };

    const summary = Object.entries(typeMap).map(([type, meta]) => {
      const uploaded = docs.find(d => d.type === type);
      return {
        type,
        label: meta.label,
        required: meta.required,
        uploaded: !!uploaded,
        status: uploaded?.status || null,
        documentId: uploaded?.id || null,
        fileName: uploaded?.originalName || null,
        uploadedAt: uploaded?.createdAt || null,
      };
    });

    const requiredCount = summary.filter(s => s.required).length;
    const uploadedRequired = summary.filter(s => s.required && s.uploaded).length;
    const completionPercent = Math.round((uploadedRequired / requiredCount) * 100);

    return {
      documents: summary,
      totalUploaded: docs.length,
      completionPercent,
      isComplete: completionPercent === 100,
    };
  }
}
