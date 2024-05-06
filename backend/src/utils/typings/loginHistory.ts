import { ObjectId } from "mongoose";

export interface loginHistory {
  _id: ObjectId;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  user: ObjectId;
  device: string;
  logoutDate: Date;
  socketId: string;
}
