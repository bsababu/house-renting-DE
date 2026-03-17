import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string; // e.g. "Berlin 2-room"

  @Column({ type: 'jsonb' })
  filters: {
    city: string;
    maxPrice?: number;
    minSize?: number;
    minRooms?: number;
    districts?: string[];
  };

  @Column({ default: false })
  autoApply: boolean;

  @Column({ default: true })
  emailNotification: boolean;

  @Column({ default: true })
  pushNotification: boolean;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastTriggeredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
