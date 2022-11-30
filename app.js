const express=require("express");
const path = require('path');
const session = require('express-session');
const nodemailer=require('nodemailer'); // for sending mails
const Razorpay = require('razorpay');

let alert = require('alert');


const razorpay = new Razorpay({
    key_id:'rzp_test_nAM0i25twseyRd',
    key_secret:'OeJW1qC4yz9mjzt1YCZ0Voro'
})

const cookieParser = require("cookie-parser");

const fs = require('fs');
const app=express();
var mongo=require("mongodb");


const port = 8080;
const hostname = '127.0.0.1';
var MongoClient = mongo.MongoClient;
// var url ="mongodb://localhost:27017/";
// mongodb+srv://gunjan124:<password>@cluster0.lnzwxca.mongodb.net/?retryWrites=true&w=majority
var url="mongodb+srv://gunjan124:mahatmagandhi@cluster0.lnzwxca.mongodb.net/?retryWrites=true&w=majority";

app.use('/static', express.static('static'));
app.use(express.urlencoded())

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const oneDay = 1000 * 60 * 60 * 24;   // time in millisecond

app.use(cookieParser());

app.use(session({
    secret:'secret',
    resave:false,
    saveUninitialized:true,
    cookie:{maxAge: oneDay},// maximum time for login deatils to expire
}))




//End points

app.get("/", (req,res)=>{
    res.status(200).render("home.pug");    //rendering to home page
    // alert("Hello !");
})

// to send query
app.post("/", (req, res)=>{
    MongoClient.connect(url, (err, db)=>{
        if(err) throw err;
        var dbo=db.db("GYM");
        var obj={
            Name:req.body.name,
            Email:req.body.email,
            Mobile:req.body.phone,
            query:req.body.describe,
        }
        dbo.collection("Query").insertOne(obj, (err, rep)=>{
            if(err){res.send("Failed to send the query. Please send again."); throw err;}
            db.close();
            res.render("home.pug");
        })
    })
})


app.get("/personalTraining.pug",(req,res)=>{
    res.status(200).render("personalTraining.pug");
})

// apply for trainer
app.post("/personalTraining.pug", (req, res)=>{
    MongoClient.connect(url, (err, db)=>{
        if(err) throw err;
        var dbo=db.db("GYM");
        var obj={
            Name:req.body.name,
            Gender:req.body.gender,
            Age:req.body.age,
            Mobile:req.body.phone,
            Email:req.body.email,
            Height:req.body.height,
            Weight:req.body.weight,
            Address:req.body.address,
            About:req.body.desc,
            Password:req.body.password,
        }
        dbo.collection("trainers").insertOne(obj, (err, rep)=>{
            if(err){res.send("Failed to send the query. Please send again."); throw err;}

            // for confirming the trainer registered 
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'kumargunjan0124@gmail.com',
                  pass: 'xynrruyxgmfdeosi'
                }
            });
            var mailOptions = {
                from: 'kumargunjan0124@gmail.com',
                to: req.body.email,
                subject: 'Registration Successful !',
                text: 'Dear '+req.body.name+', You are successfully registrated for gym training. We will contact you soon. \n Thank You'
            };
            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
            });

            db.close();
            res.render("personalTraining.pug");
        })
    })
})

// if already logged in then render profile else login page
app.get("/member.pug",(req,res)=>{
    if(req.session.user){       // if already logged in then don't open the login page
        MongoClient.connect(url, (err, db)=>{
            if(err) throw err;
            var dbo=db.db("GYM");
            var query={
                Email:req.session.user,
            }
            dbo.collection("members").find(query).toArray((err, result)=>{
                if(err){res.send("Failed to send the query. Please send again."); throw err;}
                res.status(200).render("profile.pug", {user: result[0]});
                
            })
        })
    }
    else{
        res.status(200).render("member.pug");
    }
})


app.get("/register.pug",(req,res)=>{
    res.status(200).render("register.pug");
})


//members registeration
app.post("/Register", (req, res)=>{
    MongoClient.connect(url, (err, db)=>{
        if(err) throw err;
        var dbo=db.db("GYM");
        const d = new Date();
        d.setMonth(d.getMonth()+1);
        var obj={
            Name:req.body.name,
            Gender:req.body.gender,
            Age:req.body.age,
            Mobile:req.body.phone,
            Email:req.body.email,
            Weight:req.body.weight,
            Address:req.body.address,
            Password:req.body.password,
            Plan_expire:d,
        }


        dbo.collection("partialMembers").insertOne(obj, (err, rep)=>{                                    //for storing the members in case payment not done
            if(err){res.send("Failed to send the query. Please send again."); throw err;}
            req.session.register=obj.Email;

            db.close();
            res.render("payments.pug", {amount:1500});
        })
    })
})

// payment for registration
app.post('/payment', (req,res)=>{

    let option={
        amount: 150000,
        currency: "INR",
    }
    razorpay.orders.create(option, (err,order)=>{
        console.log(order);
        res.json(order);
    })
})

// operation after payment
app.post('/update_payment',(req,res)=>{
    razorpay.payments.fetch(req.body.razorpay_payment_id).then((payDoc)=>{
        console.log(payDoc);  //to save the payment id-->payDoc.id
        if(payDoc.status == 'captured'){
            // res.send("Payments Succesful");
            MongoClient.connect(url, (err, db)=>{
                if(err) throw err;
                var dbo=db.db("GYM");
                
                var query={
                    Email:req.session.register,
                }

                dbo.collection("partialMembers").find(query).toArray((err, result)=>{
                    if(err){res.send("Failed to send the query. Please send again."); throw err;}
                    
                    var obj={
                        Name:result[0].Name,
                        Gender:result[0].Gender,
                        Age:result[0].Age,
                        Mobile:result[0].Mobile,
                        Email:result[0].Email,
                        Weight:result[0].Weight,
                        Address:result[0].Address,
                        Password:result[0].Password,
                        Plan_expire:result[0].Plan_expire,
                    }
                    
            
            
                    dbo.collection("members").insertOne(obj, (err, rep)=>{
                        if(err){res.send("Failed to send the query. Please send again."); throw err;}


                        // for confirming the members registered via mail
                        var transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                              user: 'kumargunjan0124@gmail.com',
                              pass: 'xynrruyxgmfdeosi'
                            }
                        });
                        var mailOptions = {
                            from: 'kumargunjan0124@gmail.com',
                            to: obj.Email,
                            subject: 'Registration Successful !',
                            text: 'Dear '+obj.Name+', You are successfully registered. We warmly welcome you to our esteemed Gym. We will contact you soon. \n Thank You.'
                        };
                        transporter.sendMail(mailOptions, function(error, Info){
                            if (error) {
                              console.log(error);
                              throw error;
                            } 
                            else {
                              console.log('Email sent: ' + Info.response);
                            }
                        });
            

                        
                    })
                    
                    
                })
                dbo.collection("partialMembers").deleteOne(query, (err, rep)=>{
                    if(err){res.send("Failed to delete account. Please try again."); throw err;}
                    db.close();
                    // res.send('Registered Successfully');
                    alert("Registered Successfully !");
                    res.render('member.pug');
                });

                req.session.destroy();
            })

        }
        else{
            res.send("payment Failed");
        }
    })
})



//members login 
app.post("/member.pug", (req, res)=>{
    MongoClient.connect(url, (err, db)=>{
        if(err) throw err;
        var dbo=db.db("GYM");
        var query ={
            Email:req.body.email,
            Password:req.body.password,
        }
        if(req.body.email =="" && req.body.password =="")
        {
            res.render("member.pug");
            alert("Enter the email/password");
        }
        else{
            dbo.collection("members").find(query).toArray((err, result)=>{
                if(err){
                    // res.send("Failed to send the query. Please send again.");
                    alert("There was some error, try again");
                    res.render("member.pug");

                }
                else if(result.length == 0){
                    alert("Invalid Email/Password");
                    res.render("member.pug");
                }
                else if(result[0].Email==req.body.email && result[0].Password==req.body.password)
                {
                    if(new Date() <= result[0].Plan_expire){

                        req.session.user=req.body.email;
                        db.close();
                        res.render("profile.pug", {user:result[0]});
                    }
                    else{
                        req.session.old=req.body.email;
                        res.render("subscription.pug", {amount:1000});
                    }
                }
                
                else{

                    res.render("member.pug");
                }

            })
        }
    })
})

// payment for subscription
app.post('/subscribe', (req,res)=>{

    let option={
        amount: 100000,
        currency: "INR",
    }
    razorpay.orders.create(option, (err,order)=>{
        console.log(order);
        res.json(order);
    })
})

// operation after subscription payment
app.post("/subscription_payment",(req,res)=>{
    razorpay.payments.fetch(req.body.razorpay_payment_id).then((payDoc)=>{
        console.log(payDoc);  //to save the payment id-->payDoc.id
        if(payDoc.status == 'captured'){
            MongoClient.connect(url, (err, db)=>{
                if(err) throw err;
                var dbo=db.db("GYM");
                var obj={
                    Email:req.session.old,
                }
                const d = new Date();
                d.setMonth(d.getMonth()+1);
                var change={
                    $set:{
                        Plan_expire:d,
                    }
                }
                dbo.collection("members").updateOne(obj, change,(err, rep)=> {
                    if(err){res.send("Failed to update. Please try again."); throw err;}
                    req.session.destroy();
                    db.close();
                    alert("Subscription Renewed successfully. Please login to continue.")
                    res.status(200).render("./member.pug");
                })
            })

        }
        else{
            res.send("payment Failed");
        }
    })
})




// logout
app.get('/logout.pug',(req,res) => {
    req.session.destroy();
    res.render('member.pug');
})

// delete profile/membership
app.get('/delete',(req, res)=>{
    MongoClient.connect(url, (err, db)=>{
        if(err) throw err;
        var dbo=db.db("GYM");
        var obj={
            Email:req.session.user,
        }
        dbo.collection("members").deleteOne(obj, (err, rep)=>{
            if(err){res.send("Failed to delete account. Please try again."); throw err;}
            req.session.destroy();
            db.close();
            res.render("home.pug");
        })
    })
})

// to render to update page for member
app.get('/updateMember.pug',(req, res)=>{
    MongoClient.connect(url, (err, db)=>{
        if(err) throw err;
        var dbo=db.db("GYM");
        var query={
            Email:req.session.user,
        }
        dbo.collection("members").find(query).toArray((err, result)=>{
            if(err){res.send("Failed to send the query. Please send again."); throw err;}
            db.close();
            res.status(200).render("updateMember.pug", {user: result[0]});
            
        })
    })
})


//for update the member's profile
app.post('/member.pug',(req, res)=>{
    MongoClient.connect(url, (err, db)=>{
        if(err) throw err;
        var dbo=db.db("GYM");
        var obj={
            Email:req.session.user,
        }
        var change={
            $set:{
                Name:req.body.name,
                Mobile:req.body.phone,
                Email:req.body.email,
                Age:req.body.age,
                Weight:req.body.weight,
                Password:req.body.password,
            }
        }
        dbo.collection("members").updateOne(obj, change,(err, rep)=> {
            if(err){res.send("Failed to update. Please try again."); throw err;}
            // req.session.destroy();
            res.status(200).render("./member.pug");
            db.close();
        })
    })
})

// to display the list of trainers
app.get("/trainers.pug", (req, res)=>{
    MongoClient.connect(url, (err, db)=>{
        if(err) throw err;
        var dbo=db.db("GYM");
        dbo.collection("trainers").find().toArray((err, result)=>{
            if(err){res.send("Failed to fetch the query. Please try again."); throw err;}
            db.close();
            res.status(200).render("trainers.pug", {trains: result});
            
        })
    })
    // res.render('trainers.pug');
})



app.get('/admin_login.pug', (req,res)=>{
    if(req.session.admin){       // if already logged in then don't open the login page
        MongoClient.connect(url, (err, db)=>{
            if(err) throw err;
            var dbo=db.db("GYM");
            var query={
                Email:req.session.admin,
            }
            dbo.collection("admin").find(query).toArray((err, result)=>{
                if(err){res.send("Failed to send the query. Please send again."); throw err;}
                dbo.collection("members").find().toArray((error,result1)=>{

                    db.close();
                    res.render("admin.pug", {user:result[0], members:result1});
                })
                
            })
        })
    }
    else{
        res.status(200).render("admin_login.pug");
    }
})

//admin login
app.post("/admin_login.pug", (req, res)=>{
    MongoClient.connect(url, (err, db)=>{
        if(err) throw err;
        var dbo=db.db("GYM");
        var query ={
            Email:req.body.email,
            Password:req.body.password,
        }
        if(req.body.email =="" && req.body.password =="")
        {
            alert("Enter your Email/Password");
            res.render("admin_login.pug");
        }
        else{
            dbo.collection("admin").find(query).toArray((err, result)=>{
                if(err){
                    // res.send("Failed to send the query. Please send again.");
                    alert("There was some problem, try again");
                    res.render("admin_login.pug");

                }
                else if(result.length == 0){
                    alert("Enter valid Email/Password");
                    res.render("admin_login.pug");
                }
                else if(result[0].Email==req.body.email && result[0].Password==req.body.password)
                {
                    req.session.admin=req.body.email;
                    dbo.collection("members").find().toArray((error,result1)=>{

                        db.close();
                        res.render("admin.pug", {user:result[0], members:result1});
                    })
                    
                }
                
                else{

                    res.render("admin_login.pug");
                }

            })
        }
    })
})


// news update to all members
app.post('/news_update', (req,res)=>{
    MongoClient.connect(url, (err, db)=>{
        if(err) throw err;
        var dbo=db.db("GYM");
        var body = req.body.news;
        dbo.collection("members").find().toArray((err, result)=>{
            if(err){res.send("Failed to send the query. Please send again."); throw err;}
            
            for(var i=0;i<result.length;i++){
               
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: 'kumargunjan0124@gmail.com',
                      pass: 'xynrruyxgmfdeosi'
                    }
                });
                var mailOptions = {
                    from: 'kumargunjan0124@gmail.com',
                    to: result[i].Email,
                    subject: 'NOTICE',
                    text: body,
                };
                transporter.sendMail(mailOptions, function(error, Info){
                    if (error) {
                      console.log(error);
                      throw error;
                    } 
                    else {
                      console.log('Email sent: ' + Info.response);
                    }
                });

            }

            
            var query={
                Email:req.session.admin,
            }
            dbo.collection("admin").find(query).toArray((err, result)=>{
                if(err){res.send("Failed to send the query. Please send again."); throw err;}
                dbo.collection("members").find().toArray((error,result1)=>{
    
                    db.close();
                    res.render("admin.pug", {user:result[0], members:result1});
                })
                
            })
        })
    })
})

//remind the plan expired members for the plan renewal
app.post('/inform', (req,res)=>{
    var email=req.body.email;

    // for confirming the members registered via mail
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'kumargunjan0124@gmail.com',
          pass: 'xynrruyxgmfdeosi'
        }
    });
    var mailOptions = {
        from: 'kumargunjan0124@gmail.com',
        to:email,
        subject: 'Reminder!',
        text: 'Dear customer, your plan has expired. \nKindly login to pay and renew your subscription.\n\n Thank You.'
    };
    transporter.sendMail(mailOptions, function(error, Info){
        if (error) {
          console.log(error);
          throw error;
        } 
        else {
          console.log('Email sent: ' + Info.response);
        }
    });

    MongoClient.connect(url, (err, db)=>{
        if(err) throw err;
        var dbo=db.db("GYM");
        var query={
            Email:req.session.admin,
        }
        dbo.collection("admin").find(query).toArray((err, result)=>{
            if(err){res.send("Failed to send the query. Please send again."); throw err;}
            dbo.collection("members").find().toArray((error,result1)=>{

                db.close();
                res.render("admin.pug", {user:result[0], members:result1});
            })
            
        })
    })

}) 


// admin logout
app.get('/admin_logout.pug',(req,res) => {
    req.session.destroy();
    res.render('home.pug');
})


// START THE SERVER 

app.listen(port,hostname, ()=>{
    console.log(`Server running at http://${hostname}:${port}/`);
})


