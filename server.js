require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const DB = process.env.DATABASE.replace(
  '%PASSWORD%',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    // mongoose.connect(process.env.DATABASE_LOCAL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful');
  })
  .catch((e) => console.log(e));
//port
const port = 3000 || process.env.PORT;
const host = "127.0.0.1";
app.listen(port, host, () => {
  console.log(`App running on ${port}...`);
});

process.on("unhandledRejection", err => {
  console.log(err.name, err.message);
})