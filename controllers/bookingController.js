const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { catchAsync } = require("../utils/catchAsync");
const Tour = require("../models/tours");
const User = require("../models/user");
const Booking = require("../models/booking");
const { deleteOne, updateOne, getOne, getAll } = require("./handlerFactory");

const checkoutSession = catchAsync(async (req, res, next) => {
  // 1) get currently booked tour.
  const { tourID } = req.params;
  const tour = await Tour.findById(tourID);
  // 2) Create checkout session.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: tourID,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  })
  // 3) Create session as response.
  res.status(200).json({
    status: 'success',
    session
  })

});


const createBookingCheckOut = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email }))._id;
  const price = session.amount_total / 100;
  const data = { tour: tour, user: user, price: price };
  await Booking.create(data);
}

const webhookCheckout = async (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);


  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    console.log("event.type ", event.type);
    await createBookingCheckOut(event.data.object)
  }
  res.status(200).json({ recieved: "true" });
};


// const createBooking = createOne(Booking);
const getBooking = getOne(Booking);
const getAllBookings = getAll(Booking);
const updateBooking = updateOne(Booking);
const deleteBooking = deleteOne(Booking);


module.exports = { checkoutSession, getBooking, getAllBookings, updateBooking, deleteBooking, webhookCheckout };