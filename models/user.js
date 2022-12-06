const mongoose=require('mongoose');
const passportLocalMOngoose=require('passport-local-mongoose');
const UserSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    }
})
UserSchema.plugin(passportLocalMOngoose)
module.exports=mongoose.model('User',UserSchema)