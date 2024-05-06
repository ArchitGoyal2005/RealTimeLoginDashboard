import { ObjectId } from "mongoose";
import { token } from "./token";

export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  active: boolean;
  password: string;
  passwordConfirm?: string | undefined;
  passwordChangedAt: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  id: string;
  createdAt: string;
  updatedAt: string;
  tokens: token[];
  __v: number;
  comparePassword: (
    candidatePassword: string,
    userPassword: string
  ) => Promise<boolean>;
  changedPasswordAfter: (JWTTimestamp: number) => boolean;
}
