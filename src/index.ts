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

// const getUsers = getConnection().then((connection) => {
//     return connection.query("Select * from User;");
//   })
//   .then(([results, fields]) => {
//     console.log(results);
//     console.log(fields);
//   })
//   .catch((err) => {
//     console.error(err);
//   });

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

app.get("/users", (req: Request, res: Response) => {
  getConnection()
    .then((connection) => {
      return connection.query("Select * from User;");
    })
    .then(([results, fields]) => {
      res.json(results);
      // console.log(fields)
    })
    .catch((err) => {
      console.error(err);
    });
});

app.get("/users/:id", (req: Request, res: Response) => {
  getConnection()
    .then((connection) => {
      return connection.execute("Select * from User WHERE id = ?;", [
        req.params.id,
      ]);
    })
    .then(([results, fields]) => {
      res.json(results);
      // console.log(fields)
    })
    .catch((err) => {
      console.error(err);
    });
});

app.get("/users/:id/photos", (req: Request, res: Response) => {
  getConnection()
    .then((connection) => {
      return connection.execute("Select * from user_photo WHERE user_id = ?;", [
        req.params.id,
      ]);
    })
    .then(([results, fields]) => {
      res.json(results);
      // console.log(fields)
    })
    .catch((err) => {
      console.error(err);
    });
});
app.get("/users/:username/photos", (req: Request, res: Response) => {
  getConnection()
    .then((connection) => {
      return connection.execute("Select * from user_photo WHERE user_id = ?;", [
        req.params.id,
      ]);
    })
    .then(([results, fields]) => {
      res.json(results);
      // console.log(fields)
    })
    .catch((err) => {
      console.error(err);
    });
});
app.get("/users/photos/:id", (req: Request, res: Response) => {
  getConnection()
    .then((connection) => {
      return connection.execute("Select * from user_photo WHERE id = ?;", [
        req.params.id,
      ]);
    })
    .then(([results, fields]) => {
      res.json(results);
      // console.log(fields)
    })
    .catch((err) => {
      console.error(err);
    });
});

app.post("/users/:id/photos", (req: Request, res: Response) => {
  const { photo_url, latitude, longitude } = req.body;
  const userId = req.params.id;

  if (!photo_url || !latitude || !longitude) {
    res.status(400).json({ error: "Missing required fields." });
  }

  getConnection()
    .then((connection) => {
      return connection.execute(
        `INSERT INTO user_photo (photo_url, latitude, longitude, user_id)
         VALUES (?, ?, ?, ?);`,
        [photo_url, latitude, longitude, userId]
      );
    })
    .then(([result]: any) => {
      res.status(201).json({ message: "Photo added successfully", id: result.insertId });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Database insertion failed." });
    });
});

app.post('/users', (req: Request, res: Response) => {
  const {username} = req.body;
  if(!username) {
    res.status(400).json({error: 'Missing required field: Username'})
  }
  getConnection().then((connection) => {
    return connection.execute('INSERT INTO User (username) VALUES (?);', [username]);
  })
  .catch((err) => {
    console.error(err)
    res.status(500).json({error: 'Database insertion failed.'})
  })
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
