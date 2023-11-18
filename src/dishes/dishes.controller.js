const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//CRUD functions
function list(req, res) {
  res.json({ data: dishes });
}

function create(req, res, next) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  if (price < 0) {
    return next({
      status: 400,
      message: `Dish must have a price that is greater than 0`,
    });
  }
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const dish = res.locals.dish;

  const { data: { id, name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.status(200).json({ data: dish });
}

function destroy(req, res) {
  res.json({
    status: 404,
    message: `Delete method not allowed at ${req.originalUrl}`,
  });
}

//Middleware functions
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }

  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  });
}

//Validation functions
function dishDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Dish must include a ${propertyName}`,
    });
  };
}

function dishDataIsNotEmpty(propertyName){
    return function (req, res, next){
        const { data = {} } = req.body;
        if (data[propertyName].length > 0) {
            return next();
        }
        next({
            status: 400,
            message: `Dish must include a ${propertyName}`,
        });
    }
}

function dishDataIsValidNumber(propertyName){
    return function (req, res, next){
        const { data = {} } = req.body;
        if (data[propertyName] > 0 && Number.isInteger(data[propertyName])) {
            return next();
        }
        next({
            status: 400,
            message: `Dish must have a price that is an integer greater than 0`,
        });
    }
}   

function dishIdMatches(req, res, next){
    const { data: { id } = {} } = req.body;
    const { dishId } = req.params;
    if (isNaN(id) || id == null || id.length < 1 || id === dishId){
        return next();
    }
    res.status(400).json({ error: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`});
}


//Export functions

module.exports = {
  list,
  create: [
    dishDataHas("name"),
    dishDataHas("description"),
    dishDataHas("price"),
    dishDataHas("image_url"),
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    dishDataHas("name"),
    dishDataHas("description"),
    dishDataHas("price"),
    dishDataHas("image_url"),
    dishDataIsNotEmpty("name"),
    dishDataIsNotEmpty("description"),
    dishDataIsNotEmpty("image_url"),
    dishDataIsValidNumber("price"),
    dishIdMatches,
    update,
  ],
  delete: [dishExists, destroy],
};
