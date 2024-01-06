import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import Hotel from "../models/hotel";
import { HotelType } from "../shared/types";
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

// POST /api/my-hotels
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
      const imageUrls = await uploadImages(imageFiles);

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

// GET /api/my-hotels
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    // hotels that are created by the userId (not all created hotels)
    const hotels = await Hotel.find({ userId: req.userId });
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

// GET /api/my-hotels/:id
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  const id = req.params.id.toString();
  try {
    // not using .find() because that will return a [{}]
    // using .findOne() only return {}
    const hotel = await Hotel.findOne({ _id: id, userId: req.userId });
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

// PUT /api/my-hotels/:hotelId
router.put(
  "/:hotelId",
  verifyToken,
  upload.array("imageFiles"),
  async (req: Request, res: Response) => {
    try {
      const updatedHotel: HotelType = req.body;
      updatedHotel.lastUpdated = new Date();

      const hotel = await Hotel.findOneAndUpdate(
        {
          _id: req.params.hotelId,
          userId: req.userId,
        },
        updatedHotel,
        { new: true }
      );

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      const files = req.files as Express.Multer.File[];
      const updatedImageUrls = await uploadImages(files);

      hotel.imageUrls = [
        ...updatedImageUrls,
        ...(updatedHotel.imageUrls || []),
      ];

      await hotel.save();
      res.status(201).json(hotel);
    } catch (error) {
      res.status(500).json({ message: "Something went wrong!" });
    }
  }
);

async function uploadImages(imageFiles: Express.Multer.File[]) {
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
  return imageUrls;
}

export default router;
