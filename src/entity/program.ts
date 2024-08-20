import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
@Entity()
export class Program {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: false })
  courseType: string;

  @Column({ nullable: false })
  studyMode: string;

  @Column({ nullable: false })
  courseSearch: string;

  @Column({ nullable: false })
  entryYear: string;

  @Column({ nullable: false })
  entryMonth: string;

  constructor(
    courseType: string,
    studyMode: string,
    courseSearch: string,
    entryYear: string,
    entryMonth: string,
    userId: string
  ) {
    this.courseType = courseType;
    this.studyMode = studyMode;
    this.courseSearch = courseSearch;
    this.entryYear = entryYear;
    this.entryMonth = entryMonth;
    this.userId = userId;
  }
}
