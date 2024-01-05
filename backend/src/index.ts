import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import userRoutes from "./routes/users";
import authRoutes from "./routes/auth";
import myHotelRoutes from "./routes/my-hotels";
import cookieParser from "cookie-parser";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string);

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    // our server is only going to accept request from FRONTEND_URL url
    // and that URL must include credentials/HTTP cookie in the request
  })
);

// goes to the frontend dist folder (where has compiled frontend static assets)
// serve those static assets on the root of our URL that the backend runs on
// --> frontend will also be bundled together into backend,
// so goes to localhost:7000 after build can also see the frontend
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/my-hotels", myHotelRoutes);

// --- make sure not BE request (not api endpoint) goes to FE ---
// some of the route are behind conditional logic,
// and wonr be part of the static files (express.static(...))
// because they are generated at request time
// ex. our add-hotel is behind confitional logic and is a protected route --> doesnt exist in static files that we deploy at deploy time
// path="/add-hotel" shows after isLoggedIn, not preexists inside static files
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

app.listen(7000, () => {
  console.log(`server is running on localhost:7000`);
});
