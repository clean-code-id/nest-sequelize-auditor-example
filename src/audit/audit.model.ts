import { Column, Model, Table, DataType, CreatedAt } from 'sequelize-typescript';

@Table({
  tableName: 'audits',
  timestamps: false,
})
export class Audit extends Model {
  @Column({
    type: DataType.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.ENUM('create', 'update', 'delete', 'restore'),
    allowNull: false,
  })
  event: 'create' | 'update' | 'delete' | 'restore';

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  table: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  recordId: string | number;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  oldValues?: Record<string, any>;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  newValues?: Record<string, any>;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  userId?: string | number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  ip?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  userAgent?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  url?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  tags?: Record<string, any>;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  createdAt: Date;
}