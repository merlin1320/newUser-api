import express, { Request, Response } from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import { error, log } from "console";

const app = express();
const port = 3020;

interface Users {
  id: number;
  username: string;
  created: Date;
  last_updated: Date;
}
interface user_photo {
  id: number;
  photo_url: string;
  latitude: number;
  longitude: number;
  created: Date;
  last_updated: Date;
  user_id: number;
}

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

let Users: Users[] = [];

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
      let query;
      // Check if identifier is a number (ID)
      if (/^\d+$/.test(identifier)) {
        // Try to find user by ID
        query = "SELECT * FROM User WHERE id = ? LIMIT 1;";
      } else {
        query = "SELECT * FROM User WHERE username = ? LIMIT 1;";
      }
      const [results]: any = await connection.execute(query, [identifier]);
      if (results.length === 0) {
        res.status(404).json({ error: "No such User" });
        return;
      }
      res.json(results[0]);
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
      let userId: number | null = null;
      // Check if identifier is a number (ID)
      if (/^\d+$/.test(identifier)) {
        // Try to find user by ID
        const [results]: any = await connection.execute(
          "SELECT id FROM User WHERE id = ?;",
          [identifier]
        );
        if (results.length === 0) {
          res.status(400).json({ error: "No such User" });
          throw new Error("No such User");
        }
        userId = results[0].id;
      } else {
        // Try to find user by username
        const [results]: any = await connection.execute(
          "SELECT id FROM User WHERE username = ?;",
          [identifier]
        );
        if (results.length === 0) {
          res.status(400).json({ error: "No such User" });
          throw new Error("No such User");
        }
        userId = results[0].id;
      }
      // Fetch photos for the found user ID
      const [photos]: any = await connection.execute(
        "SELECT * FROM user_photo WHERE user_id = ?;",
        [userId]
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
  }
  getConnection()
    .then((connection) => {
      return connection
        .execute("SELECT id from User WHERE username =?;", [username])
        .then(([results]: any) => {
          if (results.length > 0) {
            res.status(409).json({ error: "Username already exists" });
            throw new Error("Username Exists");
          }
          return connection.execute("INSERT INTO User (username) VALUES (?);", [
            username,
          ]);
        });
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
  }

  getConnection()
    .then(async (connection) => {
      let userID: number | null = null;
      let results: any;

      if (/^\d+$/.test(identifier)) {
        [results] = await connection.execute(
          "SELECT id FROM User WHERE id = ?;",
          [identifier]
        );
      } else {
        [results] = await connection.execute(
          "SELECT id FROM User WHERE username = ?;",
          [identifier]
        );
      }
      if (results.length === 0) {
        res.status(400).json({ error: "No such User" });
        throw new Error("No such User");
      }
      userID = results[0].id;
      return connection.execute(
        "INSERT INTO user_photo (photo_url, latitude, longitude, user_id) VALUES (?,?,?,?);",
        [photo_url, latitude, longitude, userID]
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
app.delete("/users/:identifier", (req: Request, res: Response)=>{
  let identifier = req.params.identifier

  getConnection()
  .then(async (connection) => {
    if(/^\d+$/.test(identifier)){
      return connection.execute("SELECT id from User where id = ?;", [identifier])
      .then(([results]:any)=>{
        if(results.length ===0){
          res.status(400).json({error: "No user with that ID"})
          throw new Error("No such User")
        }
        return connection.execute("DELETE FROM user_photo WHERE user_id=?;", [identifier])
        .then(()=> {
          return connection.execute("DELETE from User WHERE id=?", [identifier])
        })
      })
    }else{
      return connection.execute("SELECT id from User where username = ?;", [identifier])
      .then(([results]: any) => {
        if(results.length ===0){
          res.status(400).json({error: "No user with that username"})
          throw new Error("No such User")
        }
        const userID = results[0].id
        return connection.execute("DELETE FROM user_photo WHERE user_id=?;", [userID])
        .then(()=> {
          return connection.execute("DELETE from User WHERE id=?", [userID])
        })
      })
    }
  }).then(([result]:any) => {
    res.status(200).json({message: "User and associated photos deleted"})
  }).catch((err)=>{
    if(err.message === "No such User") return;
    console.error(err)
    res.status(500).json({error: "Database Deletion failed"})
  })
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
