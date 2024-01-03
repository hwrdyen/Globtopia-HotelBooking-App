import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// express the Request type
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies["auth_token"];

  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    // verify the token we got is actually created by us
    // by decoding the token with the secret key that was used to create the token

    req.userId = (decoded as JwtPayload).userId;
    // the reason why we are adding this userId to the request is because
    // whenever Express forwards on the request in auth.ts .get("/validate-token")
    // we are able to verify jwt token, get access to req.userId,
    // and send the user id back to the frontend
    next();
  } catch (error) {
    return res.status(401).json({ message: "unauthorized" });
  }
};

export default verifyToken;
