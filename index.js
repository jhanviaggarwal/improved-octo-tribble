const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3001;

const { readFile, writeFile } = require("./file");
const usersRouter = require("./users"); 
const hotelsFile = "./hotels.json";
const destinationFile = "./destinations.json";
const postsFile = './posts.json';

app.use(cors());
app.use(express.json());

app.use(cors({ origin: "http://localhost:3001" }));

const itinerariesRouter = require("./itineraries");
app.use("/users", usersRouter); 

app.use("/itineraries", itinerariesRouter);

app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "itinerary.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "hotels.html"));
});

const hotelRoutes = require("./hotels");
app.use("/", hotelRoutes);

const galleryRoutes = require("./gallery");
app.use("/", galleryRoutes);

const premadeRoutes = require("./premade");
app.use("/", premadeRoutes);

// Post a new destination with places  DIYA
app.post("/destination", (req, res) => {
  const { season, destination, places } = req.body;

  if (!season || !destination || !places) {
    return res.status(400).send("All fields are required.");
  }

  let destinations = readFile(destinationFile);
  let dest_id = destinations.length
    ? destinations[destinations.length - 1].id + 1
    : 1;

  const newDest = { id: dest_id, season, destination, places };
  destinations.push(newDest);
  writeFile(destinationFile, destinations);

  res.status(201).json(newDest);
});
app.get("/destinations", (req, res) => {
  let destinations = readFile(destinationFile); // Read destinations from the file
  
  // Check if destinations are found
  if (destinations && destinations.length > 0) {
    res.status(200).json(destinations); // Return destinations as JSON response
  } else {
    res.status(404).json({ message: "Destinations not found." }); // Handle error if no destinations found
  }
});

// Retrieve destinations for a particular season  DIYA
app.get("/destination/:season", (req, res) => {
  const season = req.params.season.toLowerCase();
  const destinations = readFile(destinationFile);
  const selectedDest = destinations.filter(
    (dest) => dest.season.toLowerCase() === season
  );
  res.status(200).json(selectedDest.map((dest) => dest.destination));
});


app.delete('/destinations/:id',(req,res)=>{
  const id = parseInt(req.params.id);
  const destinations = readFile(destinationFile);
  for(let i=0; i<destinations.length; i++){
    if(destinations[i].id===id){
      destinations.splice(i,1);
      writeFile(destinationFile, destinations);
      res.status(204).send();
      return;
    }
  }
  res.send(404).send(`${id} does not exist.`);
})

app.put('/destinations/:id',(req,res)=>{
  const id = parseInt(req.params.id);
  const destinations = readFile(destinationFile);
  for (let i = 0; i < destinations.length; i++) {
    if (destinations[i].id === id) {
      destinations[i].destination = req.body.destination;
      writeFile(destinationFile, destinations);
      res.status(204).send();
      return;
    }
  }
  res.status(404).send(`${id} does not exist.`);
})


//DIYA
// app.delete('/delete/destinations/:destination',(req,res)=>{
//   const destination = req.params.destination.toLowerCase();
//   const destinations = readFile();
//   for(let i=0; i<destinations.length; i++){
//     if(destinations[i].destination.toLowerCase()==destination){
//       destinations.splice(i,1);
//       writeFile(destinations);
//       res.status(204).send();
//       return;
//     }
//   }
//   res.send(404).send(${destination} does not exist.);
// })

//DIYA
// app.put("/update/destinations/:destination", (req, res) => {  
//   const destination = req.params.destination.toLowerCase();
//   const destinations = readFile();
//   for (let i = 0; i < destinations.length; i++) {
//     if (destinations[i].destination.toLowerCase() == destination) {
//       destinations[i].destination = req.body.destination;
//       writeFile(destinations);
//       res.status(204).send();
//       return;
//     }
//   }
//   res.send(404).send(${destination} does not exist.);
// });

// Retrieve a destination by id   // DIYA
app.get("/destinat/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const destinations = readFile(destinationFile);
  const dest = destinations.find((dest) => dest.id === id);

  if (dest) {
    res.status(200).json(dest);
  } else {
    res.status(404).send(`Id ${id} does not exist.`);
  }
});

// Retrieve places for a particular destination  //PRAGATI
app.get("/destinations/:destination", (req, res) => {
  const destination = req.params.destination.toLowerCase();
  const destinations = readFile(destinationFile);
  const placesArr = destinations.find(
    (dest) => dest.destination.toLowerCase() === destination
  );

  if (placesArr) {
    res.status(200).json(placesArr.places);
  } else {
    res.status(404).send("Destination not found.");
  }
});

// PUT method to update a place's details   PRAGATI
app.put("/destinations/:id/places/:placeName", (req, res) => {
  const id = parseInt(req.params.id);
  const placeName = req.params.placeName.toLowerCase();
  const { name, description, opening_hours } = req.body;
  const destinations = readFile(destinationFile);
  const destIndex = destinations.findIndex((dest) => dest.id === id);

  if (destIndex === -1) {
    return res.status(404).send("Destination not found.");
  }

  const placeIndex = destinations[destIndex].places.findIndex(
    (place) => place.name.toLowerCase() === placeName
  );

  if (placeIndex === -1) {
    return res.status(404).send("Place not found.");
  }

  const place = destinations[destIndex].places[placeIndex];
  if (name) place.name = name;
  if (description) place.description = description;
  if (opening_hours) place.opening_hours = opening_hours;

  writeFile(destinationFile, destinations);
  res.status(200).json(place);
});

// POST method to add a new place //PRAGATI
app.post("/destinations/:id/places", (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description, opening_hours } = req.body;
  const destinations = readFile(destinationFile);
  const destIndex = destinations.findIndex((dest) => dest.id === id);

  if (destIndex === -1) {
    return res.status(404).send("Destination not found.");
  }

  if (!name || !description || !opening_hours) {
    return res
      .status(400)
      .send("Name, description, and opening hours are required.");
  }

  const newPlace = { name, description, opening_hours };
  destinations[destIndex].places.push(newPlace);
  writeFile(destinationFile, destinations);

  res.status(201).json(newPlace);
});

// DELETE a place by destination and place name // PRAGATI
app.delete("/destinations/:destination/places/:placeName", (req, res) => {
  const destination = req.params.destination.toLowerCase();
  const placeName = req.params.placeName.toLowerCase();
  const destinations = readFile(destinationFile);
  const destinationIndex = destinations.findIndex(
    (dest) => dest.destination.toLowerCase() === destination
  );
  if (destinationIndex === -1) {
    return res.status(404).send(`Destination ${destination} not found.`);
  }
  const placeIndex = destinations[destinationIndex].places.findIndex(
    (place) => place.name.toLowerCase() === placeName
  );
  if (placeIndex === -1) {
    return res.status(404).send(`Place ${placeName} not found in ${destination}.`);
  }
  destinations[destinationIndex].places.splice(placeIndex, 1);
  writeFile(destinationFile, destinations);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});