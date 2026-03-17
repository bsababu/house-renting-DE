import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { User } from '../users/user.entity';
import { Listing } from '../listings/listing.entity';

export enum ApplicationStatus {
  GENERATED = 'generated',
  SENT = 'sent',
  VIEWED = 'viewed',
  RESPONDED = 'responded',
  VIEWING_SCHEDULED = 'viewing_scheduled',
  REJECTED = 'rejected',
  ACCEPTED = 'accepted',
}

export enum ApplicationMethod {
  EMAIL = 'email',
  CLIPBOARD = 'clipboard',
  AUTO_APPLY = 'auto_apply',
}

@Entity('applications')
@Index(['userId', 'listingId'], { unique: true })
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  listingId: string;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  listing: Listing;

  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.GENERATED })
  status: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  letterContent: string;

  @Column({ type: 'enum', enum: ApplicationMethod, default: ApplicationMethod.EMAIL })
  method: ApplicationMethod;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
