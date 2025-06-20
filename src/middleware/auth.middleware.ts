import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";

type JWTPayload = {
  id: string;
  email: string;
};

// We disable these ESLint rules because extending existing global types (like Express.Request) 
// must be done using `declare global` and `namespace`, which would otherwise be flagged.
// `no-shadow` is disabled because `Request` is being redefined inside the namespace 
// to merge with the existing Express type, not to shadow it.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line no-shadow
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const require_auth = (req: Request, res: Response, next: NextFunction): void => {
  const { token } = req.cookies;

  if (!token) {
    res.status(401).json({
      status: "fail",
      message: "Unauthorized: Access token is missing.",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    if (
      typeof decoded === "object" &&
      "id" in decoded &&
      "email" in decoded
    ) {
      req.user = decoded as JWTPayload;
      next();
      return;
    }

    res.status(401).json({
      status: "fail",
      message: "Unauthorized: Malformed token.",
    });

  } catch (err) {
    const error = err as Error;
    console.error("JWT Verification Failed:", error.message);

    res.status(401).json({
      status: "fail",
      message: "Unauthorized: Invalid or expired token.",
    });
  }
};