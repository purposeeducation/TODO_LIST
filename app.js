const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);
app.use(express.static("public"));
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useFindAndModify", false);

const itemsSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemsSchema);
const item1 = {
  name: "Welcome to todolist !",
};
const item2 = {
  name: "<--Hit to delete item !",
};
const defaultItems = [item1, item2];

const customListSchema = new mongoose.Schema({
  name: String,
  item: [itemsSchema],
});
const List = mongoose.model("List", customListSchema);

app.get("/", function (req, result) {
  Item.find(function (err, data) {
    if (data.length === 0) {
      Item.insertMany(defaultItems, function (error) {
        if (!error) {
          console.log("Successfully added one item !");
        }
      });
      result.redirect("/");
    } else {
      result.render("index", { dayChanged: "Today", itemsChanged: data });
    }
  });
});
app.post("/", function (req, res) {
  const itemName = req.body.input;
  const postName = req.body.button;
  const item = new Item({
    name: itemName,
  });
  if (postName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: postName }, function (err, result) {
      result.item.push(item);
      result.save();
      res.redirect("/" + postName);
    });
  }
});

app.post("/delete", function (req, result) {
  const id = req.body.checkBox;
  const customName = req.body.customName;
  if (customName === "Today") {
    Item.findByIdAndRemove(id, function (err, res) {
      if (!err) {
        console.log("Successfully deleted !");
      }
    });
    result.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: customName },
      { $pull: { item: { _id: id } } },
      function (err, data) {
        if (!err) {
          result.redirect("/" + customName);
        }
      }
    );
  }
});

app.get("/:customListName", function (req, res) {
  const listName = _.capitalize(req.params.customListName);
  List.findOne({ name: listName }, function (err, data) {
    if (!err) {
      if (!data) {
        //Create new list
        console.log("List doesn't exist!");
        const itemNew = new List({
          name: listName,
          item: defaultItems,
        });
        itemNew.save();
        res.redirect("/" + listName);
      } else {
        res.render("index", { dayChanged: data.name, itemsChanged: data.item });
        console.log("List exists !");
      }
    }
  });
});
