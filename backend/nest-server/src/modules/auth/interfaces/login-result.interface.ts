import { User } from "src/modules/users/entities/user.entity";

export interface LoginResult {
  user: User;
  sessionId: string;
}