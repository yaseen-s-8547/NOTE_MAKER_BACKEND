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
const postSchema=new mongoose.Schema({title:{type:String,required:true},content:{type:String,required:true},userId:{type:mongoose.Schema.Types.ObjectId,
  ref:"User"
}})
const User =mongoose.model("User",UserSchema)
const Post=mongoose.model("Post",postSchema)
function authMiddleware(req,res,next){
    try{
        const authHeader=req.headers.authorization
    if(!authHeader){
       return res.status(401).json({message:"no token"})
    }
    const token =authHeader.split(" ")[1]
    const decoded =jwt.verify(token,"secretkey")
    req.userId=decoded.userId
    next()
    }
    catch(err){
        res.status(401).json({ message:"invalid token"})
    }
}
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
app.post('/savenotes',authMiddleware,async(req,res)=>{
    const {title,content}=req.body
   try{
    await  Post.create({title,content,userId:req.userId})
     res.json({message:"saved successfully"})
   }
   catch(err){
    res.status(500).json({message:"failed to save"})
   }
    
     
})
app.get("/notes",authMiddleware,async(req,res)=>{
    try{
      const  notes=  await Post.find({userId:req.userId})
        res.json(notes)
    }
    catch(err){
        res.status(404).json({message:"cannot get"})
    }
})
app.get("/viewnotes/:id",authMiddleware,async(req,res)=>{
     try{
        const {id}=req.params
        const post =await Post.findById(id)
        res.json(post)
     }
     catch(err){
          res.status(404).json({message:"cannot get notes"})
     }
})
app.delete("/deletenotes/:id",authMiddleware,async (req,res)=>{
    try{
        const {id}=req.params
        const deletePost =await Post.findByIdAndDelete(id)
        if(!deletePost){
            return res.status(404).json({message:"not found "})
        }
        res.status(200).json({message:"deleted successfully"})
    }
    catch(err){
        res.status(500).json({message:"delete failed"})
    }

})
app.put("/updatetitle/:id",authMiddleware,async(req,res)=>{
   try{
      const {id}=req.params
      const {title}=req.body
      const updated= await Post.findByIdAndUpdate(id,{title},{new:true})
      if(!updated){
        return res.status(404).json({message:"notes not found"})

      }
      res.status(202).json(updated)

   }
   catch(err){
        res.status(500)
   }
})
app.put("/updatecontent/:id",authMiddleware,async(req,res)=>{
    try{
        const {id}=req.params
        const {content}=req.body 
        const updated=await Post.findByIdAndUpdate(id,{content},{new:true})
        if(!updated){
        return res.status(404).json({message:"notes not found"})
         
      }
       res.status(202).json(updated)
    }
    catch(err){
        res.status(500)
    }
})
const PORT=process.env.PORT||5000
app.listen(PORT,()=>{
    console.log("server listen on :", PORT)
})