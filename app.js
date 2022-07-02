//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const cors = require("cors");

const app = express();


app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.use(cors());
mongoose.connect("mongodb+srv://whaledarn:texasepic@cluster0.aebky.mongodb.net/travelDB");
const ridersSchema = {
  _id: String,
  firstName: String,
  lastName: String,
  emailAddress: String,
  phoneNumber: Number,
  church: Number,
  time: Number,
  address: String,
  driver: String
}
const driversSchema = {
  _id: String,
  firstName: String,
  lastName: String,
  emailAddress: String,
  phoneNumber: Number,
  church: Number,
  time: Number,
  quantity: Number,
  notes: String,
  riders: [String]
}

const Rider = mongoose.model("Rider", ridersSchema);

const Driver = mongoose.model("Driver", driversSchema);

app

/*GET METHODS*/

app.get("/riders", function(req,res){
  Rider.find(function(err, foundRiders){
    if(!err)
      res.send(foundRiders);
    else
      res.send(err);
  });
});

app.get("/drivers", function(req,res){
  Driver.find(function(err, foundDrivers){
    if(!err)
      res.send(foundDrivers);
    else
      res.send(err);
  });
});

app.route("/riders/:userid").get(function(req,res){
  Rider.findById(req.params.userid, function(err,r){
    if(!r)
      res.status(500).send({ error: 'Something failed!' });
    else{
      res.send(r);
    }
  });
});

app.route("/drivers/:userid").get(function(req,res){
  Driver.findById(req.params.userid, function(err,r){
    if(!r)
      res.status(500).send({ error: 'Something failed!' });
    else{
      res.send(r);
    }
  });
});

/*POST METHODS*/

app.post("/riders", function(req,res){
  /*Collect all the data from the form*/
  const firstName = req.body.first;
  const lastName = req.body.last;
  const email = req.body.email;
  const phone = req.body.phone;
  const userid = req.body.userid;
  const address = req.body.address;
  const driver = req.body.driver;

  Rider.countDocuments({
    _id: userid
  }, function(err, count) {
    if (count > 0) {
      res.status(500).send({ error: 'Something failed!' });
    } else {
      Driver.findById(driver, function(err, p) { // check if driver exists
        if (!p || p.riders.length >= p.quantity)
          res.send("Driver does not exist or there are not enough spots.");
        else {

          /*Create a new driver*/
          const rider = new Rider({
            _id: userid,
            firstName: firstName,
            lastName: lastName,
            emailAddress: email,
            phoneNumber: phone,
            address: address,
            driver: driver
          });
          console.log("created rider");

          p.riders.push(userid);

          p.save(function(err) {
            if (err)
              res.send('Error saving driver info')
            else{
              rider.save();
              res.send('Success');
              console.log("saved rider");
            }

          });
        }
      });

      console.log("updated driver");

    }
  });//end count documents
});

app.post("/drivers",function(req,res){
  /*Collect all the data from the form*/
  const firstName = req.body.first;
  const lastName = req.body.last;
  const email = req.body.email;
  const phone = req.body.phone;
  const _id = req.body.userid;
  const church = req.body.church;
  const time = req.body.time;
  const quantity = req.body.quantity;
  const notes = req.body.notes;

  // if(id==null)
  // res.send("ERROR");

  Driver.countDocuments({
    _id: _id
  }, function(err, count) {
    if (count > 0) {
      res.status(500).send({ error: 'Something failed!' });
    } else {
      /*Create a new driver*/
      const driver = new Driver({
        _id: _id,
        firstName: firstName,
        lastName: lastName,
        emailAddress: email,
        phoneNumber: phone,
        church: church,
        time: time,
        quantity: quantity,
        notes: notes,
        riders: []
      });
      /*Save driver to database and redirect to view*/
      driver.save();
      res.send("Successfully added!");
    }
  });
});

/*DELETE METHODS*/

app.route("/riders/:userid").delete(function(req,res){
  Rider.findById(req.params.userid, function(err, rider) { // finds the driver from the rider
    if (rider != null) {
      Driver.findOne({
        _id: rider.driver
      }, function(err, driver) {
        if (err) {
          res.status(500).send({ error: 'Something failed!' });
        } else {
          let newList = driver.riders.filter(function(value, index, arr) {
            return value != req.params.userid;
          });
          Driver.findOneAndUpdate({
            _id: rider.driver
          }, {
            $set: {
              riders: newList
            }
          }, {
            returnDocument: 'after'
          }, (err, doc) => {
            if (err) {
              res.status(500).send({ error: 'Something failed!' });
            }

            console.log(doc);
          });
        }
      });

      Rider.findByIdAndRemove(req.params.userid, function(err) { // Removes rider
        if (!err)
          res.send("Removed your id!");
      });
    }
    else
      res.status(500).send({ error: 'Something failed!' });
  });


});

app.route("/drivers/:userid").delete(function(req,res){
  Driver.findById(req.params.userid, function(err, driver) { // finds the driver in list
    if (err || driver == null) {
      res.status(500).send({ error: 'Something failed!' });
    } else {
      let riders = driver.riders;
      riders.forEach(function(rider) {
        Rider.findByIdAndRemove(rider, function(err) { // for each of the riders, remove
          if (!err)
            res.send("Removed your id!");
        });
      })
      Driver.findByIdAndRemove(req.params.userid, function(err) { // removes the driver
        if (!err)
          res.send("Removed your id!");
      });
    }
  })


});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);
