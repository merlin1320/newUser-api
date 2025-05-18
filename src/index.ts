import express, { Request, Response } from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import { findUser } from "./userService";

const app = express();
const port = 3020;

const getConnection = () => {
  return mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "mysql-chal",
    password: "pens",
    port: 3306,
  });
};

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, Express with TypeScript!");
});

app.options("/users", (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "*");
  res.send();
});

// getConnection().then((connection)=> {
//   return connection.query('Select * from User')
// }).then(([results,fields]) =>{
//   console.log(results)
//   console.log(fields)
// })
// .catch((err)=>{
//   console.error(err)
// })

//get all users

app.get("/users", (req: Request, res: Response) => {
  getConnection()
    .then((connection) => {
      return connection.query("Select * from User;");
    })
    .then(([results]) => {
      res.json(results);
    })
    .catch((err) => {
      console.error(err);
    });
});

//get user based on ID or username
app.get("/users/:identifier", (req: Request, res: Response) => {
  const identifier = req.params.identifier;
  getConnection()
    .then(async (connection) => {
      const user = await findUser(connection, identifier);
      if (!user) {
        res.status(404).json({ error: "No such User" });
        return;
      }
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch user" });
    });
});

//get all photos for user by ID or username
app.get("/users/:identifier/photos", (req: Request, res: Response) => {
  const identifier = req.params.identifier;
  getConnection()
    .then(async (connection) => {
      const user = await findUser(connection, identifier);
      if (!user) {
        res.status(400).json({ error: "No such user" });
        return;
      }
      // Fetch photos for the found user ID
      const [photos]: any = await connection.execute(
        "SELECT * FROM user_photo WHERE user_id = ?;",
        [user.id]
      );
      res.json(photos);
    })
    .catch((err) => {
      if (err.message === "No such User") return;
      console.error(err);
      res.status(500).json({ error: "Failed to fetch photos" });
    });
});

//get photo by ID
app.get("/users/photos/:id", (req: Request, res: Response) => {
  getConnection()
    .then((connection) => {
      return connection.execute("Select * from user_photo WHERE id = ?;", [
        req.params.id,
      ]);
    })
    .then(([results]) => {
      res.json(results);
    })
    .catch((err) => {
      console.error(err);
    });
});

//add new user
app.post("/users", (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username) {
    res.status(400).json({ error: "Missing required field: Username" });
    return
  }
  getConnection()
    .then(async (connection) => {
      const user = await findUser(connection, username);
      if (user) {
        res.status(409).json({ error: "Username already exists" });
        throw new Error("Username Exists");
      }
      return connection.execute("INSERT INTO User (username) VALUES (?);", [
        username,
      ]);
    })
    .then(([result]: any) => {
      res.status(201).json({ message: "User created", id: result.insertId });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Database insertion failed." });
    });
});

//add new photo with either username or ID
app.post("/users/:identifier/photos", (req: Request, res: Response) => {
  const { photo_url, latitude, longitude } = req.body;
  const identifier: any = req.params.identifier;

  if (!photo_url || !latitude || !longitude) {
    res.status(400).json({ error: "Missing required fields." });
    return
  }

  getConnection()
    .then(async (connection) => {
      const user = await findUser(connection, identifier);
      if (!user) {
        res.status(400).json({ error: "No such user" });
        return;
      }
      return connection.execute(
        "INSERT INTO user_photo (photo_url, latitude, longitude, user_id) VALUES (?,?,?,?);",
        [photo_url, latitude, longitude, user.id]
      );
    })
    .then(([result]: any) => {
      res
        .status(201)
        .json({ message: "Photo added successfully", id: result.insertId });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Database insertion failed." });
    });
});

//delete photo by ID
app.delete("/users/photos/:id", (req: Request, res: Response) => {
  const photo_id = req.params.id;
  getConnection()
    .then((connection) => {
      return connection
        .execute("SELECT id from user_photo WHERE id =?;", [photo_id])
        .then(([results]: any) => {
          if (results.length === 0) {
            res.status(400).json({ error: "No photo with that ID" });
            throw new Error("Invalid photo ID");
          }
          return connection.execute("DELETE FROM user_photo WHERE id=?;", [
            photo_id,
          ]);
        });
    })
    .then(([result]: any) => {
      res.status(200).json({ message: "Photo deleted" });
    })
    .catch((err) => {
      if (err.message === "Invalid photo ID") return;
      console.error(err);
      res.status(500).json({ error: "Database Deletion Failed." });
    });
});

//delete all photos for user by ID or username
app.delete("/users/:identifier", (req: Request, res: Response) => {
  let identifier = req.params.identifier;
  getConnection()
    .then(async (connection) => {
      const user = await findUser(connection, identifier);
      if (!user) {
        res.status(400).json({ error: "No such user" });
        return;
      }
      return connection
        .execute("DELETE FROM user_photo WHERE user_id=?;", [user.id])
        .then(() => {
          return connection.execute("DELETE from User WHERE id=?", [user.id]);
        });
    })
    .then(([result]: any) => {
      res.status(200).json({ message: "User and associated photos deleted" });
    })
    .catch((err) => {
      if (err.message === "No such User") return;
      console.error(err);
      res.status(500).json({ error: "Database Deletion failed" });
    });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
