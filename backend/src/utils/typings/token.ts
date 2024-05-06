import { ObjectId } from "mongoose";

export interface token {
  token: string;
  expiredAt: Date;
  deviceInfo: string;
  active: boolean;
  id: string;
  _id: ObjectId;
}
