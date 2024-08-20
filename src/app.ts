import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import session from "express-session";
import createError from "http-errors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import logger from "morgan";
import "reflect-metadata";
import { AppDataSource } from "./database/data-source";
import cors from "cors";
import bodyParser from "body-parser";

import indexRouter from "./routes/index";
import { createServer } from "http";
import { Server } from "socket.io";
import usersRouter from "./routes/users";
import adminRouter from "./routes/admin";
import chatRouter from "./routes/chats";
import protectedRouter from "./routes/protectedRoutes";
import itemRoutes from "./routes/admin";

dotenv.config();

// Database Connection
AppDataSource.initialize()
  .then(() => {
    console.log("Connected to the PostgresSql database successfully");
  })
  .catch((error) => console.log(error));

const app = express();
const frontEndUrl = process.env.FRONTEND_URL;

// socket.io connection
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.SOCKET_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});
interface OnlineUser {
  userId: string;
  socketId: string;
}
let onlineUsers: OnlineUser[] = [];

io.on("connection", (socket) => {
  console.log("a user connected", socket.id, onlineUsers);

  socket.on("addNewUser", (userId) => {
    !onlineUsers.some((user) => user.userId === userId) &&
      onlineUsers.push({ userId, socketId: socket.id as string });
    console.log("online users", onlineUsers);
  });

  io.emit("onlineUsers", onlineUsers);

  socket.on("sendMessage", (message) => {
    console.log("socket-message", message);
    const recipientSocket = onlineUsers.find(
      (user) => user.userId === message.receiverId
    );
    if (recipientSocket) {
      // Emit the message to the recipient's socket
      io.to(recipientSocket.socketId).emit("message", message);
    }
  });

  socket.on("disconnect", () => {
    // Remove user from online users on disconnect
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    console.log("a user disconnected", socket.id, onlineUsers);
  });
});

httpServer.listen(5000);

app.use(
  session({
    secret: process.env.secret ?? "",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(
  cors({
    origin: frontEndUrl,
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static("public"));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/admin", adminRouter);
app.use("/admin", adminRouter);
app.use("/items", itemRoutes);
app.use("/chats", chatRouter);

app.use("/protected-route", protectedRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500).json({ error: err.message });
  // res.render('error');
});

export default app;
