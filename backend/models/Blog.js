const mongoose = require('mogoose');

const blogSchema = mongoose.createSchema({
    user : String,
    likes : {type : String, default : "0"},
    rating : {type: Number, default : "0"},
    content : JSON
})

const blogModel