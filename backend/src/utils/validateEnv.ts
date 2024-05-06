import { cleanEnv } from "envalid";
import { num, port, str } from "envalid/dist/validators";

export default cleanEnv(process.env, {
  MONGO_DB_URI: str(),
  MONGO_DB_PASSWORD: str(),
  PORT: port(),
  JWT_SECRET: str(),
  JWT_EXPIRES_IN: str(),
  JWT_COOKIE_EXPIRES_IN: num(),
});
