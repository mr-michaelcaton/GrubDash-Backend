const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//CRUD functions
function list(req, res) {
  res.json({ data: orders });
}

function create(req, res, next) {
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res, next) {
  const order = res.locals.order;

  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.status(200).json({ data: order });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);

  if (orders[index].status !== "pending") {
    res
      .status(400)
      .json({ error: "An order cannot be deleted unless it is pending" });
  }

  if (index > -1) {
    orders.splice(index, 1);
    res.sendStatus(204);
  }
}

//Middleware functions

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }

  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

//Validation functions

function orderDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;

    //Handle Dishes
    if (propertyName === "dishes" && data[propertyName] && Array.isArray(data[propertyName])) {
      data[propertyName].some((dish, index) => {
        if (
          !dish.quantity ||
          dish.quantity < 1 ||
          !Number.isInteger(dish.quantity)
        ) {
          return next({
            status: 400,
            message: `Dish ${index} must have a quantity that is an integer greater than 0`,
          });
        }
      });
    }

    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a ${propertyName}`,
    });
  };
}

function orderDataIsNotEmpty(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;

    if (data[propertyName].length > 0) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include a ${propertyName}`,
    });
  };
}

function orderDishDataIsValid(req, res, next) {
  const { data = {} } = req.body;

  if (!Array.isArray(data["dishes"])) {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }
  next();
}

function orderDishQuantityIsValid(req, res, next) {
  const { data = {} } = req.body;

  data["dishes"].find((dish) => {
    if (!Number.isInteger(dish.quantity) || dish.quantity < 1) {
      return next({
        status: 400,
        message: `Order must include at least one dish`,
      });
    }
  });
  next();
}

function orderStatusIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatuses = [
    "pending",
    "preparing",
    "out-for-delivery",
    "delivered",
  ];

  if (validStatuses.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
  });
}


function orderIdMatches(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { orderId } = req.params;
  if (id == null || id.length < 1 || id === orderId) {
    return next();
  }
  res.status(400).json({
    error: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
  });
}

//Export functions

module.exports = {
  list,
  create: [
    orderDataHas("deliverTo"),
    orderDataIsNotEmpty("deliverTo"),
    orderDataHas("mobileNumber"),
    orderDataHas("dishes"),
    orderDataIsNotEmpty("dishes"),
    orderDishDataIsValid,
    orderDishQuantityIsValid,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    orderDataHas("deliverTo"),
    orderDataIsNotEmpty("deliverTo"),
    orderDataHas("mobileNumber"),
    orderDataHas("dishes"),
    orderDataIsNotEmpty("dishes"),
    orderDishDataIsValid,
    orderDishQuantityIsValid,
    orderDataHas("status"),
    orderStatusIsValid,
    orderIdMatches,
    update,
  ],
  delete: [orderExists, destroy],
};
