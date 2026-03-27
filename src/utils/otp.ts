import bcrypt from "bcryptjs";

export const generateOtpCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const hashOtpCode = (code: string) => bcrypt.hash(code, 10);

export const compareOtpCode = (code: string, hash: string) =>
  bcrypt.compare(code, hash);

