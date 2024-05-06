import { Schema, model } from "mongoose";
import { loginHistory } from "../utils/typings/loginHistory";

const loginHistorySchema = new Schema(
  {
    user: {
      type: Schema.ObjectId,
      ref: "User",
      required: [true, "A order must belong to a user"],
    },
    device: String,
    logoutDate: Date,
    socketID: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const LoginHistory = model<loginHistory>("LoginHistory", loginHistorySchema);

export default LoginHistory;
