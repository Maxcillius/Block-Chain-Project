import { Router } from "express";

const router = Router();

router.get("/data", (req, res) => {
  // TODO: Return all the data from the blockchain
});

router.post("/data", (req, res) => {
  try {
    const { location, data } = req.body;

    if (!location || !data) {
      res.status(400).json({
        ok: false,
        message: "Please provide location and data",
      });
      return;
    }

    // TODO: Save data to the blockchain with timestamp

    res.status(201).json({
      ok: true,
      message: "Data saved successfully",
      data: {
        location,
        data,
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Internal server error",
    });
    console.error(error);
  }
});

export default router;
