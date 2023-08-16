// if(process.env.NODE_ENV!=='production'){
//     require('dotenv').config();
// }
require('dotenv').config();
const express=require('express');
const mongoose=require('mongoose');
const path=require('path');
const ejsMate=require('ejs-mate');
const session=require('express-session');
const flash = require('connect-flash');
const mongoSanitize=require('express-mongo-sanitize');
const helmet=require('helmet');

const ExpressError=require('./utils/ExpressError');
const methodOverride=require('method-override');
const passport=require('passport');
const LocalStrategy=require('passport-local');
const User=require('./models/user');

const userRoutes=require('./routes/users');
const campgroundRoutes=require('./routes/campgrounds');
const reviewRoutes=require('./routes/reviews');

const MongoStore=require('connect-mongo')(session);
mongoose.set('strictQuery', true);
//const dbUrl='mongodb://localhost:27017/my-camp'
const dbUrl = process.env.DB_URL;
const mysecret = process.env.SECRET;
mongoose.connect(dbUrl,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    //useCreateIndex:true,
    //useFindAndModify:false
})
const db=mongoose.connection;
db.on('error',console.error.bind(console,'connection errror:'));
db.once('open',()=>{
    console.log('Database connected');
})

const app=express();
app.engine('ejs',ejsMate);
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,'public')));
app.use(mongoSanitize(
    //replaceWith:'_'
));
const store=new MongoStore({
    url:dbUrl,
    secret:mysecret,
    touchAfter: 24*60*60,
})
store.on('error',function(e){
    console.log('session store error',e)
})
const sessionConfig={
    store,
    name:'session',
    secret:mysecret,
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        //secure:true,
        expires:Date.now() + 1000*60*60*24*7,
        maxAge: 1000*60*60*24*7
    }
}
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet({crossOriginEmbedderPolicy:false,contentSecurityPolicy:false}));

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dcuz2moth/", 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);


app.use(passport.initialize());
app.use(passport.session()); //session should be used before it
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    //console.log(req.query)
    //console.log(req.session);
    res.locals.currentUser=req.user;
    res.locals.success= req.flash('success');
    res.locals.error= req.flash('error');
    next();
})

app.get('/fakeUser',async(req,res)=>{
    const user=new User({email:'abc@gmail.com',username:'xyz'});
    const newUser=await User.register(user,'pw_1234');
    res.send(newUser);
})

app.use('/',userRoutes);
app.use('/campgrounds',campgroundRoutes);
app.use('/campgrounds/:id/reviews',reviewRoutes);


app.get('/',(req,res)=>{
    res.render('home');
})

app.all('*',(req,res,next)=>{
    next(new ExpressError('Page Not Found!',404))
})
app.use((err,req,res,next)=>{
    const {statusCode=500}=err;
    if(!err.message) err.message='Oh no, something went wrong!'
    res.status(statusCode).render('error',{err})
})
//order of routes matter
const port = process.env.PORT || 3000;
app.listen(port,()=>{
    console.log(`serve at http://localhost:${port}`);
})


//MV- model view controller framework