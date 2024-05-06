import { NextFunction, RequestHandler, Request } from "express";
import createHttpError from "http-errors";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/userModel";
import env from "../utils/validateEnv";
import httpServer from "../app";
import { Socket } from "socket.io";

export const protect: RequestHandler = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      throw createHttpError(
        401,
        "You are not logged in! Please log in to get access."
      );
    }

    // 2) Verification token
    const decoded: JwtPayload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      throw createHttpError(
        401,
        "The user belonging to this token does no longer exist."
      );
    }

    const tokenIssueDate: number = decoded.iat as number;

    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(tokenIssueDate)) {
      throw createHttpError(
        401,
        "User recently changed password! Please log in again."
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    req.token = token;
    // res.locals.user = currentUser;

    if (!req.user.tokens.some((tok) => tok.token === token))
      throw createHttpError(
        401,
        "You are not logged in! Please log in to get access."
      );

    return next();
  } catch (error) {
    next(error);
  }
};

export const socketAuthenticator = async (
  err: any,
  socket: Socket,
  next: NextFunction
) => {
  try {
    if (err) return next(err);
    const req = socket.request as Request;

    const authToken = req.cookies.jwt;

    if (!authToken)
      return next(createHttpError(401, "Please login to access this route"));

    const decodedData = jwt.verify(authToken, env.JWT_SECRET) as JwtPayload;

    if (!decodedData.id)
      return next(createHttpError(401, "Please login to access this route"));

    const user = await User.findById(decodedData.id);

    if (!user)
      return next(createHttpError(401, "Please login to access this route"));

    socket.user = user;
    socket.token = authToken;
    socket.deviceInfo = user.tokens.find(
      (token) => token.token === authToken
    )?.deviceInfo!;

    return next();
  } catch (error) {
    console.log(error);
    return next(createHttpError(401, "Please login to access this route"));
  }
};
