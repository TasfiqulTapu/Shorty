const express = require("express");
const app = express();
const { nanoid } = require("nanoid");
const bodyParser = require("body-parser");
const Datastore = require("nedb");
const Cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
let db = new Datastore({ filename: "./data/database.db", autoload: true });
require("dotenv").config();
app.use(bodyParser.json());
app.use(Cors());
app.use(express.static("./public"));

app.post("/api/test", (req, res) => {
  console.log(req);
  res.send("ok");
});

app.get("/delete", function(req,res) {
  res.redirect(`/delete.html`);
});

app.get("/:id", async function(req, res) {
  db.findOne({ id: req.params.id }, function(err, doc) {
    if (doc) {
      res.redirect(doc.nurl);
    } else {
      if(req.params.id != undefined){
        res.redirect(`/404.html?name=${req.params.id}`);
      }else{
        res.redirect(`/404.html`);
      }
    }
  });
});

let apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: "Too many requests, try again later.",
});

app.post("/api/create", apiLimiter , async function(req, res) {
  console.log(req);
  let newid;
  if (req.body.nurl == "") {
    res.status(500);
    res.json("URL is required");
    return;
  } else if(!validateURL(req.body.nurl)){
    res.status(400);
    res.json("Invalid url provided");
    return;
  }else {
    try {
      if (req.body.id == "") {
        newid = nanoid(8);
        db.findOne({ id: newid }, (err, doc) => {
          if (doc == null) {
            let entry = { id: newid, nurl: req.body.nurl };
            console.log(entry);
            db.insert(entry, (err, doc) => {
              res.status(200);
              res.json(entry);
              return;
            });
          } else {
            res.status(500);
            res.json("something gone ong");
            return;
          }
        });
      } else if(validateID(req.body.id)){
        await db.findOne({ id: req.body.id }, (err, doc) => {
            if (doc == null) {
            newid = req.body.id;
            console.log(req.body.id);
            let entry = { id: newid, nurl: req.body.nurl };
            console.log(entry);
            db.insert(entry, (err, doc) => {
              res.status(200);
              res.json(doc);
              return;
            });
          } else {
            res.status(500);
            res.json("ID ready exists");
            return;
          }
        });
      } else{
        res.status(400);
        res.json("Invalid id provided");
        return;
      }
    } catch (error) {
      res.status(500);
      res.json(error);
    }
  }
});

app.post("/api/delete", apiLimiter , async (req, res) => {
  console.log(req);
  try {
    if (req.body.id == ""){
      res.status(400);
      res.json("Invalid ID provided");
    }else if(req.body.pass != process.env.PASSWORD){
      res.status(413);
      res.json("Invalid password provided");
    }else if (req.body.pass == process.env.PASSWORD) {
      db.remove({ id: req.body.id }, { multi: true }, function(
        err,numRemoved
      ) {
        res.status(200)
        res.json(`${req.body.id} successfully removed.`);
      });
    } else {
      res.status(500);
      res.json("something went wrong");
    }
  } catch (err) {
    res.status(500);
    res.json(err);
  }
});

const port = process.env.PORT || 3000;
const listener = app.listen(process.env.PORT, () => {
  console.log(`App is listening on port ${listener.address().port}`);
});

function validateURL(textval) {
            let urlregex = new RegExp(
            "^(http|https|ftp)\://[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,16}(:[a-zA-Z0-9]*)?/?([a-zA-Z0-9\-\._\?\,\'/\\\+&amp;%\$#\=~])*$");
            return urlregex.test(textval);
        }
function validateID(textval) {
            let idregex = new RegExp("[a-zA-Z0-9\-_]{3,64}");
            return idregex.test(textval);
        }














