const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

router.use(express.json());

const premadeFile = path.join(__dirname, "premadeitineraries.json");
const savedFile = path.join(__dirname, "saveditineraries.json");

// Route to get pre-made itineraries based on filters
router.post("/api/filter", (req, res) => {
  const { season, totalBudget, duration } = req.body || {};

  fs.readFile(premadeFile, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error reading data" });
    }

    const itineraries = JSON.parse(data);

    const filtered = itineraries
      .map((itinerary, index) => {
        return { id: index + 1, ...itinerary };
      })
      .filter((itinerary) => {
        const seasonMatch = !season || itinerary.season === season;
        const budgetMatch =
          !totalBudget || itinerary.totalBudget <= totalBudget;
        const durationMatch = !duration || itinerary.duration <= duration;

        return seasonMatch && budgetMatch && durationMatch;
      });

    res.json(filtered);
  });
});
router.post("/api/save", (req, res) => {
  const { id } = req.body;

  fs.readFile(premadeFile, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error reading pre-made itineraries" });
    }

    const itineraries = JSON.parse(data);
    const itineraryToSave = itineraries.find((itinerary, index) => index + 1 === id);

    if (!itineraryToSave) {
      return res.status(404).json({ error: "Itinerary not found in pre-made itineraries" });
    }
    const itineraryWithId = { id, ...itineraryToSave };

    fs.readFile(savedFile, "utf8", (err, savedData) => {
      if (err && err.code !== "ENOENT") {
        return res.status(500).json({ error: "Error reading saved itineraries" });
      }

      const savedItineraries = JSON.parse(savedData || "[]");
      const existingItinerary = savedItineraries.find((itinerary) => itinerary.id === id);
      if (existingItinerary) {
        return res.status(400).json({ error: "Itinerary with this ID is already saved" });
      }

      savedItineraries.push(itineraryWithId);

      fs.writeFile(
        savedFile,
        JSON.stringify(savedItineraries, null, 2),
        (err) => {
          if (err) {
            return res.status(500).json({ error: "Error saving itinerary" });
          }
          res.json({ message: "Itinerary saved successfully", itinerary: itineraryWithId });
        }
      );
    });
  });
});

// Route to customize and update an itinerary
router.put("/api/update", (req, res) => {
  const { id, updatedItinerary } = req.body;

  fs.readFile(savedFile, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Error reading saved itineraries" });
    }

    const savedItineraries = JSON.parse(data || "[]");
    const itineraryIndex = savedItineraries.findIndex(
      (itinerary) => itinerary.id === id
    );

    if (itineraryIndex === -1) {
      return res.status(404).json({ error: "Itinerary not found" });
    }

    savedItineraries[itineraryIndex] = {
      ...savedItineraries[itineraryIndex],
      ...updatedItinerary,
    };

    fs.writeFile(
      savedFile,
      JSON.stringify(savedItineraries, null, 2),
      (err) => {
        if (err) {
          return res.status(500).json({ error: "Error updating itinerary" });
        }
        res.json({ message: "Itinerary updated successfully" });
      }
    );
  });
});

module.exports = router;

