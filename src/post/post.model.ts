import { Column, Model, Table, DataType } from "sequelize-typescript";
import { Auditable, AuditEvent } from "@cleancode-id/nestjs-sequelize-auditor";

@Auditable({
  exclude: ["created_at", "updated_at"],
  onlyDirty: false,
  auditEvents: [AuditEvent.CREATED, AuditEvent.UPDATED, AuditEvent.DELETED],
})
@Table({
  tableName: "posts",
  timestamps: true,
  underscored: true,
})
export class Post extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  content?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  published: boolean;
}
