import jwt from "jsonwebtoken";
import env from "../utils/validateEnv";
import { NextFunction, Request, RequestHandler, Response } from "express";
import User from "../models/userModel";
import createHttpError from "http-errors";
import { Document } from "mongoose";
import emitEvent from "../utils/helpers/emitEvent";
import { io } from "../app";

const signToken = (id: string) => {
  return jwt.sign({ id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
};

const createAndSendToken = async (
  user: Document,
  statusCode: number,
  res: Response,
  next: NextFunction,
  deviceInfo: String,
  req: Request
) => {
  try {
    const token = signToken(user.id);
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      {
        $push: {
          tokens: {
            token: token,
            expiredAt: Date.now() + 7 * 24 * 60 * 60,
            deviceInfo,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.cookie("jwt", token, {
      expires: new Date(
        Date.now() + env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.status(statusCode).json({
      status: "success",
      token,
      data: {
        user: updatedUser,
      },
    });

    emitEvent(io, user.id, "newToken", {
      token: token,
      expiredAt: Date.now() + 7 * 24 * 60 * 60,
      deviceInfo,
    });
  } catch (error) {
    next(error);
  }
};

interface SignupBody {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export const signup: RequestHandler<
  unknown,
  unknown,
  SignupBody,
  unknown
> = async (req, res, next) => {
  try {
    const exsistingEmail = await User.findOne({ email: req.body.email });

    if (exsistingEmail) throw createHttpError(409, "E-Mail is already taken");

    const user = await User.create(req.body);

    createAndSendToken(
      user,
      201,
      res,
      next,
      req.useragent!.source,
      req as Request
    );
  } catch (error) {
    next(error);
  }
};

interface LoginBody {
  email: string;
  password: string;
}

export const Login: RequestHandler<
  unknown,
  unknown,
  LoginBody,
  unknown
> = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password)
      throw createHttpError(400, "Please provide email and password!");

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password, user.password)))
      throw createHttpError(401, "Incorrect email or password");

    createAndSendToken(
      user,
      200,
      res,
      next,
      req.useragent!.source,
      req as Request
    );
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    let token;
    if (req.body.token) {
      token = req.body.token;
    } else {
      token = req.cookies.jwt;
      res.clearCookie("jwt");
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $pull: { tokens: { token } },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    emitEvent(io, req.user.id, "logout", {
      token: token,
    });
    res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
};
