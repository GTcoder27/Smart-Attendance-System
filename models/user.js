const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/YCCE_News");

const userSchema = mongoose.Schema({
    username:String,
    name:String,
    email:String,
    password:String,
    posts:[{type: mongoose.Schema.Types.ObjectId, ref:"post"}],
});

module.exports = mongoose.model('user',userSchema);






