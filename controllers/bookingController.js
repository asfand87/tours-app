const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { catchAsync } = require("../utils/catchAsync");
const Tour = require("../models/tours");
const Booking = require("../models/booking");
const { deleteOne, updateOne, createOne, getOne, getAll } = require("./handlerFactory");

const checkoutSession = catchAsync(async (req, res, next) => {
  // 1) get currently booked tour.
  const { tourID } = req.params;
  const tour = await Tour.findById(tourID);
  // 2) Create checkout session.
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get("host")}/?tour=${tourID}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: tourID,
    line_items: [{
      name: `${tour.name} Tour`,
      description: tour.summary,
      images: [`https://www.technipages.com/wp-content/uploads/2019/07/Cover-600x371.jpg`],
      amount: tour.price * 100,
      currency: 'usd',
      quantity: 1
    }]
  })
  // 3) Create session as response.
  res.status(200).json({
    status: 'success',
    session
  })

});



const createBookingCheckout = catchAsync(async (req, res, next) => {

  const { tour, user, price } = await req.query;
  // console.log("this is query object", req.query, " tour user and price is ", tour, user, price);
  if (!tour || !user || !price) {
    console.log("no Tour , user or price");
    return next();
  }

  const newBooking = { tour: tour, user: user, price: price };
  // console.log("new booking is ", newBooking);
  await Booking.create(newBooking);
  // res.redirect(`${req.protocol}://${req.get("host")}/`)
  res.redirect(req.originalUrl.split("?")[0]);
});

const createBooking = createOne(Booking);
const getBooking = getOne(Booking);
const getAllBookings = getAll(Booking);
const updateBooking = updateOne(Booking);
const deleteBooking = deleteOne(Booking);


module.exports = { checkoutSession, createBookingCheckout, createBooking, getBooking, getAllBookings, updateBooking, deleteBooking };