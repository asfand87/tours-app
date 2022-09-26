const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { catchAsync } = require("../utils/catchAsync");
const Tour = require("../models/tours");
const User = require("../models/user");
const Booking = require("../models/booking");
const { deleteOne, updateOne, createOne, getOne, getAll } = require("./handlerFactory");

const checkoutSession = catchAsync(async (req, res, next) => {
  // 1) get currently booked tour.
  const { tourID } = req.params;
  const tour = await Tour.findById(tourID);
  // 2) Create checkout session.
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get("host")}/?my-tours`,
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


const createBookingCheckOut = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.line_items[0].amount / 100;
  await Booking.create({ tour, user, price });
}

const webhookCheckout = (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);

  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  if (event.type === "checkout.session.complete") {
    createBookingCheckOut(event.data.object)
  }
  res.status(200).json({ recieved: "true" });
};


const createBooking = createOne(Booking);
const getBooking = getOne(Booking);
const getAllBookings = getAll(Booking);
const updateBooking = updateOne(Booking);
const deleteBooking = deleteOne(Booking);


module.exports = { checkoutSession, createBooking, getBooking, getAllBookings, updateBooking, deleteBooking, webhookCheckout };