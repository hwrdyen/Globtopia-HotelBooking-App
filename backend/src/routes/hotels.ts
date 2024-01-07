import express, { Request, Response } from "express";
import Hotel from "../models/hotel";
import { HotelSearchResponse } from "../shared/types";

const router = express.Router();

// GET /api/hotels/search
router.get("/search", async (req: Request, res: Response) => {
  try {
    const query = constructSearchQuery(req.query);

    const pageSize = 5;
    const pageNumber = parseInt(
      req.query.page ? req.query.page.toString() : "1"
    );
    // skip the first X items
    const skip = (pageNumber - 1) * pageSize;

    // skip "skip" amount of hotels and only limit to "pageSize" amount of hotels
    const hotels = await Hotel.find(query).skip(skip).limit(pageSize);

    const total = await Hotel.countDocuments(query);

    const response: HotelSearchResponse = {
      data: hotels,
      pagination: {
        total,
        page: pageNumber,
        pages: Math.ceil(total / pageSize),
      },
    };

    res.json(response);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

const constructSearchQuery = (queryParams: any) => {
  let constructedQuery: any = {};

  if (queryParams.destination) {
    // This is a MongoDB query object that uses the $or operator
    // he $or operator performs a logical OR operation on an array of conditions.
    // If any of the conditions are met, the document is considered a match.
    // ---  this code looks for documents where either the "city" or "country" field matches the provided queryParams.destination ---
    constructedQuery.$or = [
      // This condition uses a regular expression (RegExp)
      // to match documents where the "city" field contains the provided destination
      // "i" flag makes the match case-insensitive
      { city: new RegExp(queryParams.destination, "i") },
      { country: new RegExp(queryParams.destination, "i") },
    ];
  }

  if (queryParams.adultCount) {
    constructedQuery.adultCount = {
      // $gte: greater or equal than
      $gte: parseInt(queryParams.adultCount),
    };
  }

  if (queryParams.childCount) {
    constructedQuery.childCount = {
      // $gte: greater or equal than
      $gte: parseInt(queryParams.childCount),
    };
  }

  return constructedQuery;
};

export default router;
