import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";
@Entity()
export class Onboarding {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  gender?: string;

  @Column({ nullable: true })
  birthCountry?: string;

  @Column({ nullable: true })
  nationality?: string;

  constructor(
    gender: string,
    birthCountry: string,
    nationality: string,
    userId: string
  ) {
    this.gender = gender;
    this.birthCountry = birthCountry;
    this.nationality = nationality;
    this.userId = userId;
  }
}
