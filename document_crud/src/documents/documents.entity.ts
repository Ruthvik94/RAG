import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Document {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  filename!: string;

  @Column()
  mimetype!: string;

  @Column()
  size!: number;

  @Column()
  path!: string;

  @CreateDateColumn()
  createdAt!: Date;
}