import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import createHttpError, { isHttpError } from "http-errors";
import userRouter from "./routes/userRouter";
import morgan from "morgan";
import useragent from "express-useragent";
import cookieParser from "cookie-parser";
import { User as Usertype } from "./utils/typings/user";
import cors from "cors";
import { protect, socketAuthenticator } from "./middlewares/authMiddleware";
import User from "./models/userModel";
import emitEvent from "./utils/helpers/emitEvent";
import LoginHistory from "./models/loginHistoryModel";
import { logout } from "./controllers/authController";
import { getAllHistory } from "./controllers/loginHistoryController";

const app = express();

declare global {
  namespace Express {
    export interface Request {
      user: Usertype;
      token: String;
    }
  }
}

declare module "socket.io" {
  interface Socket {
    user: Usertype;
    token: string;
    deviceInfo: string;
  }
}

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(morgan("dev"));

app.use(cookieParser());

app.use(express.json());

app.use(useragent.express());

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.use("/api/v1/users", userRouter);

app.get("/api/v1/loginHistory", protect, getAllHistory);

app.all("*", (req, res, next) => {
  next(createHttpError(404, "Endpoint not found"));
});

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: { origin: "http://localhost:3000", credentials: true },
});

io.use((socket, next) => {
  cookieParser()(
    socket.request as express.Request,
    socket.data,
    async (err) => await socketAuthenticator(err, socket, next as NextFunction)
  );
});

io.on("connection", (socket) => {
  socket.on("loggingIn", async () => {
    socket.join(socket.user.id);
    try {
      await User.findByIdAndUpdate(
        socket.user.id,
        {
          $set: { "tokens.$[e].active": true },
        },
        {
          arrayFilters: [{ "e.token": socket.token }],
          new: true,
          runValidators: true,
        }
      );

      await LoginHistory.create({
        user: socket.user.id,
        device: socket.deviceInfo,
        socketID: socket.id,
      });
    } catch (err) {
      console.log(err);
    }
    socket.broadcast.to(socket.user.id).emit("newDevice", socket.token, {
      user: socket.user.id,
      device: socket.deviceInfo,
      socketID: socket.id,
      createdAt: new Date(Date.now() + 5 * 100),
    });
  });

  socket.on("disconnect", async () => {
    console.log(socket.id);

    console.log("disconnected");
    try {
      await User.findByIdAndUpdate(
        socket.user.id,
        {
          $set: { "tokens.$[e].active": false },
        },
        {
          arrayFilters: [{ "e.token": socket.token }],
          new: true,
          runValidators: true,
        }
      );

      const data = await LoginHistory.findOne(
        { socketID: socket.id },
        { logoutDate: Date.now() }
      );
    } catch (err) {
      console.log(err);
    }

    socket.broadcast.to(socket.user.id).emit("deviceClosed", socket.token, {
      socketId: socket.id,
      logoutDate: Date.now(),
    });
  });
});

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  let errorMessage = "An unknown error occurred";
  let statusCode = 500;
  if (isHttpError(error)) {
    statusCode = error.status;
    errorMessage = error.message;
  }
  res.status(statusCode).json({ error: errorMessage });
});

export default httpServer;
