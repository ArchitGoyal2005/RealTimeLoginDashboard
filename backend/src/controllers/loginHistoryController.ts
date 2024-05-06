import { RequestHandler } from "express";
import LoginHistory from "../models/loginHistoryModel";

export const getAllHistory: RequestHandler = async (req, res, next) => {
  try {
    const filter = {} as { user?: string };
    if (req.query.user) filter.user = req.query.user as string;

    const data = await LoginHistory.find(filter).populate({
      path: "user",
      select: "name",
    });

    res.status(200).json({
      data,
    });
  } catch (error) {
    return next(error);
  }
};
