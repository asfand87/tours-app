const { catchAsync } = require("../utils/catchAsync");
const { AppError } = require("../utils/appError");
const APIFeatures = require('../utils/apiFeatures');

module.exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const id = req.params.id;
    // const tour = tours.filter(el => el.id !== id);
    const doc = await Model.findByIdAndDelete(id);

    if (!doc) {
        return next(new AppError("No document found with this ID", 404));
    }
    res.status(200).json({
        status: 'Success!, doc deleted',
        data: null,
    });

});

module.exports.updateOne = Model => catchAsync(async (req, res, next) => {
    // const tour = await Tour.findByIdAndUpdate({ _id: req.params.id, tour: req.body }, { this code doesn't give any depreciation warning. 
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!doc) {
        return next(new AppError("No doc found with this ID", 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            data: doc,
        },
    });
});


module.exports.createOne = (Model) => catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body)
    res.status(201).json({
        status: 'success',
        data: {
            data: newDoc,
        },
    });
})


module.exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {

    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    // below code reflect all the code above!
    // const doc = await Tour.findById(req.param.id).populate("reviews");
    if (!doc) {
        return next(new AppError("No doc found with this ID", 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            data: doc,
        },
    });
});







module.exports.getAll = Model => catchAsync(async (req, res, next) => {
    // this is to allow for nested GET reviews on Tour. 
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // EXECUTING QUERY
    // console.log(req.query)
    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    // const doc = await features.query.explain(); this explain() shows multiple options when the query is run i.e how many documents scanned and stuff.
    const doc = await features.query;
    res.status(200).json({
        results: doc.length,
        status: 'success',
        requestedAt: req.requestTime,
        data: {
            data: doc,
        },
    });
});




