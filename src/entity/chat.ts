import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    JoinColumn,
    ManyToOne
  } from "typeorm";
  import { User } from "./user";
  
  @Entity()
  export class Chat {
    @PrimaryGeneratedColumn("uuid")
    id!: string;
  
    @ManyToOne(() => User, { eager: true }) // Assuming eager loading is required for sender

    @JoinColumn({ name: "senderId" })
    sender!: User;

    @ManyToOne(() => User, { eager: true }) // Assuming eager loading is required for receiver
    
    @JoinColumn({ name: "receiverId" })
    receiver!: User;

    @Column("text")
    message!: string;

    @CreateDateColumn({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
    createdAt!: Date;
      admin: any;
  }
  