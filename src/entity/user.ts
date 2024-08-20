import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class User {
  update(arg0: { otpSecret: string; otp: string; otpExpiration: Date }) {
    throw new Error("Method not implemented.");
  }
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  phoneNumber: string;

  @Column()
  password: string;

  @Column()
  countryOfResidence: string;
  courses: any;

  @Column({ nullable: true, default: null })
  otp: string;

  @Column({ nullable: true, default: null })
  otpSecret: string;

  @Column({ nullable: true, default: null })
  otpExpiration: Date;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ nullable: true, type: "varchar" })
  resetToken: string | null;

  @Column({ nullable: true, type: "timestamp", default: null })
  resetTokenExpires: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(
    firstName: string,
    lastName: string,
    email: string,
    phoneNumber: string,
    password: string,
    countryOfResidence: string,
    createdAt: Date,
    updatedAt: Date,
    otp: string,
    otpSecret: string,
    otpExpiration: Date,
    isVerified: boolean,
    isAdmin: boolean
  ) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.phoneNumber = phoneNumber;
    this.password = password;
    this.countryOfResidence = countryOfResidence;
    this.otp = otp;
    this.otpSecret = otpSecret;
    this.otpExpiration = otpExpiration;
    this.isVerified = isVerified;
    this.isAdmin = isAdmin;
    this.resetToken = null;
    this.resetTokenExpires = null;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
