import { RequestHandler } from "express";

export const getMe: RequestHandler = (req, res) => {
  res.status(200).json({
    user: req.user,
    token: req.token,
  });
};
