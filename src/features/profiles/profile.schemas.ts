import { z } from "zod";

export const profileSchema = z.object({
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9][a-z0-9_-]{2,31}$/,
      "핸들은 영문 소문자·숫자·밑줄·하이픈 3~32자로 입력해주세요.",
    ),
  displayName: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(500).optional(),
  isPublic: z.boolean(),
});
