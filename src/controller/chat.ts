import { Request, Response } from "express";
import { Chat } from "../entity/chat";
import { User } from "../entity/user";
import { AppDataSource } from "../database/data-source";
import { ProfessionalApplication } from "../entity/professional-app";

// Get all chats for a specific user (either user or admin)

export const getChats = async (req: Request, res: Response) => {
  try {
    const { receiverId, senderId } = req.params;

    // Get repository for Chat entity from AppDataSource
    const chatRepository = AppDataSource.getRepository(Chat);
    const userRepository = AppDataSource.getRepository(User);

    const recipient = await userRepository.findOne({
      where: { id: receiverId },
    });

    // Find all chats between the two specified users
    const chats = await chatRepository
      .createQueryBuilder("chat")
      .leftJoinAndSelect("chat.sender", "sender")
      .leftJoinAndSelect("chat.receiver", "receiver")
      .where(
        "(sender.id = :receiverId AND receiver.id = :senderId) OR (sender.id = :senderId AND receiver.id = :receiverId)",
        { receiverId, senderId }
      )
      .orderBy("chat.createdAt", "ASC")
      .getMany();

    // Format chats as a conversation between the two users
    const conversation = chats.map((chat) => ({
      id: chat.id,
      message: chat.message,
      createdAt: chat.createdAt,
      sender: {
        id: chat.sender.id,
        firstName: chat.sender.firstName,
        lastName: chat.sender.lastName,
      },
      receiver: {
        id: chat.receiver.id,
        firstName: chat.receiver.firstName,
        lastName: chat.receiver.lastName,
      },
    }));

    // Send the conversation to the client
    res.json({ conversation, recipient });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: "Error fetching chats" });
  }
};

// Create a new chat message
export const createChatMessage = async (req: Request, res: Response) => {
  try {
    const message = req.body;

    // Get repositories for User and Chat entities from AppDataSource
    const userRepository = AppDataSource.getRepository(User);
    const chatRepository = AppDataSource.getRepository(Chat);

    // Find sender and receiver users in the database
    const sender = await userRepository.findOne({
      where: { id: message.senderId },
    });
    const receiver = await userRepository.findOne({
      where: { id: message.receiverId },
    });

    if (!sender || !receiver) {
      return res.status(404).json({ message: "Sender or receiver not found" });
    }

    // Create a new chat message
    const newChatMessage = new Chat();
    newChatMessage.sender = sender;
    newChatMessage.receiver = receiver;
    newChatMessage.message = message.text;

    await chatRepository.save(newChatMessage);

    res.status(201).json({ message: "Chat message created successfully" });
  } catch (error) {
    console.error("Error creating chat message:", error);
    res.status(500).json({ message: "Error creating chat message" });
  }
};

export const getChattingUsers = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userRepository = AppDataSource.getRepository(User);
    const chatRepository = AppDataSource.getRepository(Chat);
    const professionalApplicationRepository = AppDataSource.getRepository(ProfessionalApplication);

    const requester = await userRepository.findOneBy({ id: userId });
    if (!requester) {
      return res.status(404).json({ message: "Requesting user not found" });
    }
 
    let users;
    if (requester.isAdmin) {
      const chattingUsers = await chatRepository
        .createQueryBuilder("chat")
        .leftJoinAndSelect("chat.sender", "sender")
        .leftJoinAndSelect("chat.receiver", "receiver")
        .where("chat.sender.id = :userId OR chat.receiver.id = :userId", { userId })
        .getMany();
 
      const userIds = new Set(chattingUsers.map(chat => chat.sender.id === userId ? chat.receiver.id : chat.sender.id));
      users = await userRepository.findByIds(Array.from(userIds));
    } else {
      users = await userRepository.findBy({ isAdmin: true });
    }
 
    const defaultUserImageUrl = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2680&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    const defaultAdminImageUrl = "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2680&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
 
    const mappedUsers = await Promise.all(users.map(async user => {
      const application = await professionalApplicationRepository.findOne({
        where: { user: { id: user.id } },
      });
 
      // Ensure sender is loaded with the last message
      const lastMessage = await chatRepository.createQueryBuilder("chat")
        .leftJoinAndSelect("chat.sender", "sender")
        .where("(chat.sender.id = :userId AND chat.receiver.id = :otherUserId) OR (chat.sender.id = :otherUserId AND chat.receiver.id = :userId)", { userId, otherUserId: user.id })
        .orderBy("chat.createdAt", "DESC")
        .getOne();
 
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        countryOfResidence: user.countryOfResidence,
        createdAt: user.createdAt,
        passportUpload: user.isAdmin ? defaultAdminImageUrl : (application?.passportUpload || defaultUserImageUrl),
        lastMessage: lastMessage ? lastMessage.message : null,
        lastMessageCreatedAt: lastMessage ? lastMessage.createdAt.toISOString() : null,
        // Correctly handle potential undefined sender
        lastMessageSentByCurrentUser: lastMessage ? (lastMessage.sender ? lastMessage.sender.id === userId : false) : null,
      };
    }));
 
    res.status(200).json({ users: mappedUsers });
  } catch (error) {
    console.error("Error fetching chatting users with last message:", error);
    res.status(500).json({ message: "Error fetching chatting users with last message" });
  }
};

// Delete a chat message
export const deleteChatMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    // Get repository for Chat entity from AppDataSource
    const chatRepository = AppDataSource.getRepository(Chat);

    // Find the chat message in the database
    const chatMessage = await chatRepository.findOne({
      where: { id: messageId },
    });

    if (!chatMessage) {
      return res.status(404).json({ message: "Chat message not found" });
    }

    // Delete the chat message
    await chatRepository.remove(chatMessage);

    res.status(200).json({ message: "Chat message deleted successfully" });
  } catch (error) {
    console.error("Error deleting chat message:", error);
    res.status(500).json({ message: "Error deleting chat message" });
  }
};

