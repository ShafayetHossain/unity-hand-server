require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vyipd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const eventsCollection = client.db("eventsDB").collection("events");
    const applicationCollection = client
      .db("applicationDB")
      .collection("application");

    app.get("/", async (req, res) => {
      res.send("This Is Unity-Hand Server");
    });

    app.get("/events", async (req, res) => {
      const { user, searchEvent } = req.query;

      const query = {};

      if (user) {
        query.hr_email = user;
      }

      if (searchEvent) {
        query.title = { $regex: searchEvent, $options: "i" };
      }

      const options = {
        sort: { date: 1 },
      };

      const result = await eventsCollection.find(query, options).toArray();
      res.send(result);
    });

    app.post("/events", async (req, res) => {
      const newEvent = req.body;
      const result = await eventsCollection.insertOne(newEvent);
      res.send(result);
    });

    app.get("/events/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await eventsCollection.findOne(query);
      res.send(result);
    });

    app.patch("/events/:id", async (req, res) => {
      const id = req.params.id;
      const updateEvent = req.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...updateEvent,
        },
      };
      const result = await eventsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.delete("/events/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await eventsCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/application", async (req, res) => {
      const userEmail = req.query.user;
      const query = { applicant_email: userEmail };
      const options = {
        sort: { date: 1 },
      };
      const result = await applicationCollection.find(query, options).toArray();

      const eventssResult = await Promise.all(
        result.map(async (event) => {
          const eventsQuery = { _id: new ObjectId(event.job_id) };
          const events = await eventsCollection.findOne(eventsQuery);
          return events;
        })
      );
      res.send(eventssResult);
    });

    app.get("/application/:id", async (req, res) => {
      const id = req.params.id;
      const query = { job_id: id };
      const result = await applicationCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/application/:id", async (req, res) => {
      const id = req.params.id;
      const query = { job_id: id };

      const result = await applicationCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/participant/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await applicationCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/application", async (req, res) => {
      const { job_id, applicant_email } = req.body;
      const existingApplication = await applicationCollection.findOne({
        job_id,
        applicant_email,
      });
      if (existingApplication) {
        return res
          .status(400)
          .send({ message: "You have already Joined for this Event!" });
      }
      const result = await applicationCollection.insertOne(req.body);
      res.send(result);
    });
  } catch (error) {
    console.log("Error Occure on", error);
  } finally {
    // await client.close();
  }
}
run();

app.listen(port, () => {
  console.log("Server Listening On Port", port);
});
