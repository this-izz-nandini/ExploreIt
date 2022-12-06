const express=require('express');
const router= express.Router();
const catchAsync=require('../utils/catchAsync');
const Campground=require('../models/campground');
const {isLoggedIn,isAuthor,validateCampground}=require('../middleware');
const {storage}=require('../cloudinary');
const multer  = require('multer');
const upload = multer({ storage });
const {cloudinary}=require('../cloudinary')
const mbxGeocoding= require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken=process.env.MAPBOX_TOKEN;
const geocoder=mbxGeocoding({accessToken: mapBoxToken});
//2 methods- fwd and bwd but we need only fwd

router.get('/',catchAsync(async(req,res)=>{
    const campgrounds=await Campground.find({});
    res.render('campgrounds/index',{campgrounds});
}))
router.get('/new',isLoggedIn,(req,res)=>{
    res.render('campgrounds/new');
    //console.log(req.body)
})
router.post('/',isLoggedIn,upload.array('image'),validateCampground,catchAsync(async(req,res,next)=>{
    //if(!req.body.campground) throw new ExpressError('Invalid campground data',400);
    const geoData=await geocoder.forwardGeocode({
        query:req.body.campground.location,
        limit:1
    }).send()
    const campground=new Campground(req.body.campground);
    campground.geometry=geoData.body.features[0].geometry;
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.author=req.user._id;
    await campground.save();
    //console.log(campground);
    req.flash('success','Successfully made a new campground!')
    res.redirect(`/campgrounds/${campground._id}`);
    //console.log(req.body,req.files)
}))

//upload.single() for multiple inputs 

router.get('/:id',catchAsync(async(req,res)=>{
    const campground=await Campground.findById(req.params.id)
    .populate({path:'reviews', populate:{path:'author'}})
    .populate('author');
    //console.log(campground)
    if(!campground){ 
        req.flash('error','Campground not found!');
        return res.redirect('/campgrounds');
    };
    res.render('campgrounds/show',{campground});
}))
router.get('/:id/edit',isLoggedIn,isAuthor,catchAsync(async(req,res)=>{
    const campground=await Campground.findById(req.params.id);
    if(!campground){ 
        req.flash('error','Campground not found!');
        return res.redirect('/campgrounds');
    };
    res.render('campgrounds/edit',{campground});
}))
router.put('/:id',isLoggedIn,isAuthor,upload.array('image'),validateCampground,catchAsync(async(req,res)=>{
    const {id}= req.params;
    //console.log(req.body);
    const campground=await Campground.findByIdAndUpdate(id,{...req.body.campground});
    const imgs=req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs);
    await campground.save();
    if(req.body.deleteImages){
        for(let filename of req.body.deleteImages){
            await cloudinary.uploader.destroy(filename);}
        await campground.updateOne({$pull:{images:{filename:{$in:req.body.deleteImages}}}})
        //console.log(campground)
    }
    req.flash('success','Successfully updated campground!')
    res.redirect(`/campgrounds/${campground._id}`);
}))
router.delete('/:id',isLoggedIn,catchAsync(async(req,res)=>{
    const {id}= req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success','Successfully deleted the campground!')
    res.redirect('/campgrounds');
}))

module.exports=router;