import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import Hotel, { HotelType } from "../models/hotel";
import verifyToken from "../middleware/auth";
import { body } from "express-validator";

const router = express.Router();

// telling multer we want to store any files/images we get from the API request in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// /api/my-hotels
router.post(
  "/",
  // only logged-in user can create hotels
  verifyToken,
  // check the request body using express-validator
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("city").notEmpty().withMessage("City is required"),
    body("country").notEmpty().withMessage("Country is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("type").notEmpty().withMessage("Hotel Type is required"),
    body("pricePerNight")
      .notEmpty()
      .isNumeric()
      .withMessage("Price per night is required and must be a number"),
    body("facilities")
      .notEmpty()
      .isArray()
      .withMessage("Facilities are required"),
  ],
  // our frontend form will have an image files array that will have up to 6 files in it
  upload.array("imageFiles", 6),
  async (req: Request, res: Response) => {
    try {
      const imageFiles = req.files as Express.Multer.File[];
      const newHotel: HotelType = req.body;

      // 1. upload the images to cloudinary
      // iterating the image files array that we get in the post request
      // that was passed on to us by multer
      const uploadPromises = imageFiles.map(async (image) => {
        // we encode the image as a Base-64 string
        const b64 = Buffer.from(image.buffer).toString("base64");
        // we create a string that describes the image
        let dataURI = "data:" + image.mimetype + ";base64," + b64;
        // using the cloudinary SDK to upload this image to our cloudinary account
        const res = await cloudinary.v2.uploader.upload(dataURI);
        // if its success, then it'll return the URL
        // (if we have five images, then all images will be uploaded at the same time
        // and before we get the image URL back)
        return res.url;
      });

      // this is going to wait for all our images to be uploaded
      // before we get back a string array that gets assigned to this imageUrls variable
      const imageUrls = await Promise.all(uploadPromises);
      // 2. if upload was successful, add the URLs to the new hotel
      newHotel.imageUrls = imageUrls;
      newHotel.lastUpdated = new Date();
      // userId we get from the request
      // (the one we got where the cookie got parsed, then check valid or not, and return/store the userID in the request)
      newHotel.userId = req.userId; // not req.body.userId its the userId we get from auth_token

      // 3. save the new hotel in our database
      const hotel = new Hotel(newHotel);
      await hotel.save();

      // 4. return a 201 status
      res.status(201).send(hotel);
    } catch (error) {
      console.log("Error creating hotel: ", error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

export default router;
