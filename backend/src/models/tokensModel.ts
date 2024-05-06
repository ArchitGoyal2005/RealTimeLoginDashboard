import { Schema } from "mongoose";

const tokensSchema = new Schema({
  token: {
    type: String,
    required: [true, "A token is required!"],
  },
  user: {
    type: Schema.ObjectId,
    ref: "User",
    required: [true, "A token must belong to a user"],
  },
});
