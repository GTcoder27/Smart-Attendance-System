const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require('cookie-parser');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const multer = require("multer");
const {storage} = require("./cloudConfig");
const upload = multer({storage});

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));
app.use(cookieParser());

  


app.post('/login',async(req,res)=>{
    let {email,password} = req.body;

    let user = await userModel.findOne({email});
    if(!user) return res.status(500).send("User do Not exist");
    
    bcrypt.compare(password,user.password,(err,result)=>{
        if(result){
            let token = jwt.sign({email: email,userid: user._id},"secretkey");
            res.cookie("token",token);
            res.status(200).redirect("/profile");
        }
        else res.redirect("/login");
    });

    
})

app.post('/register',async(req,res)=>{
    let {email,username,age,name,password} = req.body;

    let user = await userModel.findOne({email});
    if(user) return res.status(500).send("Email Already exist");
    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt,async (err,hash)=>{
            let user = await userModel.create({
                username,email,name,age,
                password:hash
            });
            let token = jwt.sign({email: email,userid: user._id},"secretkey");
            res.cookie("token",token);
            res.redirect("/login");
        });
    });
    

});

app.get('/logout',(req,res)=>{
    res.cookie("token","");
    res.redirect("/");
});

function isLoggedIn(req,res,next){
    if(!req.cookies.token){
        console.log("not logged in");
        res.redirect("/login");
        return;
    }
    if(req.cookies.token === ""){
        console.log("empty");
        res.redirect("/login");
    }
    else{
        let data = jwt.verify(req.cookies.token,"secretkey");
        req.user = data;
        next();
    }
}

app.get('/login',(req,res)=>{
    res.render("login");
})


app.get('/profile',isLoggedIn,async (req,res)=>{
    let user = await userModel.findOne({email: req.user.email}).populate("posts");
    res.render("profile",{user});
})


app.get('/register',(req,res)=>{
    res.render("register");
})


// app.get('/edit/:id',isLoggedIn,async (req,res)=>{
    //     let post = await postModel.findOne({_id: req.params.id}).populate("user");
    //     res.render("edit",{post});
    // })
    
app.get('/delete/:id',async (req,res)=>{
    let post = await postModel.findOneAndDelete({_id: req.params.id});
    res.redirect("/profile");
})

app.post('/update/:id',isLoggedIn,async (req,res)=>{
    let post = await postModel.findOneAndUpdate({_id: req.params.id},{content :req.body.content});
    res.redirect("/profile");
})

app.post('/post',upload.single('img'),isLoggedIn,async (req,res)=>{
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    console.log(req.file.path);
    let user = await userModel.findOne({email: req.user.email});
    let {content,img,heading} = req.body; 
    let post = await postModel.create({
        user: user._id,
        content,
        author: user.name,
        img: req.file.path,
        heading
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
});


app.get('/',async (req,res)=>{
    let posts = await postModel.find();
    res.render("index",{posts});
})


















app.listen(3000);

