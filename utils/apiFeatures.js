class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    // 127.0.0.1:3000/api/v1/tours?duration[lt]=5&difficulty=easy&price[lt]=1500
    let { page, sort, limit, fields, ...rest } = this.queryString;
    let queryStr = JSON.stringify(rest);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => '$' + match); // or can be `$${match}`
    this.query = this.query.find(JSON.parse(queryStr));
    // let query = Tour.find(JSON.parse(queryStr));
    return this;
  }
  sort() {
    let { sort } = this.queryString;
    // // 2)
    if (sort) {
      // {{URL}}api/v1/tours?sort=-price,ratingsAverage
      // const sortBy = sort.replace(",", " ");
      // mongoose sort method is used for ascending - or de-ascending +
      const sortBy = sort.split(',').join(' ');
      // console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }
  // fields 
  // {{URL}}api/v1/tours?fields=name,duration,price,difficulty,__v
  limitFields() {
    let { fields } = this.queryString;
    // // 3) field limiting
    if (fields) {
      const field = fields.split(',').join(' ');
      // select is used to include + or exclude - .
      this.query = this.query.select(field);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }
  /// {{URL}}api/v1/tours?page=3&limit=5
  paginate() {
    let { page, limit } = this.queryString;
    // 4) Pagination
    // by default we are setting the || 1 this is how we define default value
    const pages = page * 1 || 1;
    const limits = limit * 1 || 100;
    // skip is calculated as previous page times the number of results !!!
    const skip = (pages - 1) * limits;
    //page=2&limit=10, 1-10 page1, 11-20 page 2, 21-30 page 3 and so on.
    // skip and limit are mongoose methods which we use to skip and limit query.
    // so the following means skip 10 results and limit results to only 10
    // query.skip(10).limit(10);
    this.query = this.query.skip(skip).limit(limits);

    return this;
  }
}

module.exports = APIFeatures;
