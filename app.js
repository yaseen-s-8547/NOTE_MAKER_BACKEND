import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())
mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("connection successfull")
})
.catch(()=>console.log("mongodb connection failure"))
const UserSchema=new mongoose.Schema({UserName:{type:String,required:true},PassWord:{type:String,required:true}})
const User =mongoose.model("User",UserSchema)
app.post("/signup",async(req,res)=>{
    const {UserName,PassWord}=req.body
   try{
     await User.create({UserName:UserName,PassWord:PassWord})
    res.json({message:"sign up successfull"})
   }
   catch(err){
    res.status(401).json({message:"sign up failed"})
   }

})

app.post("/signin",async(req,res)=>{
    const {UserName,PassWord}=req.body
    try{
    const user = await User.findOne({UserName})
        if(!user) {return res.status(401).json({message:"user not found"})}
        if(user.PassWord!==PassWord) {return res.status(401).json({message:"password not found"})}
        const token =jwt.sign(
            {userId:user._id},"secretkey",{expiresIn:"1h"}
        )
        res.json({token})
    }
    catch(err){
        res.status(500).json({message:"signin failed"})
    }
})
const PORT=process.env.PORT||5000
app.listen(PORT,()=>{
    console.log("server listen on :", PORT)
})