import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
} from "typeorm";
import { User } from "./user";

@Entity()
export class ProfessionalApplication {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ default: "pending" })
  status!: string;

  @OneToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "applicantId" })
  user!: User;

  @Column({ type: "text" })
  personalStatement!: string;

  @Column({ type: "jsonb", nullable: false })
  addQualification!: {
    institutionName: string;
    areaOfStudy: string;
    yearOfGraduation: Date;
    grade: number;
    qualificationType: string;
    countryOfInstition: string;
  }[];

  @Column({ type: "boolean" })
  academicReference!: boolean;

  @Column({ type: "boolean" })
  employmentDetails!: boolean;

  @Column({ type: "text" })
  fundingInformation!: string;

  @Column({ type: "text" })
  disability!: string;

  @Column({ type: "text" })
  passportUpload!: string;

  @Column({ type: "boolean" })
  englishLanguageQualification!: boolean;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;
}
