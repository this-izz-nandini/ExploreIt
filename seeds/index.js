const mongoose=require('mongoose');
const cities=require('./cities');
const {places,descriptors}=require('./seedHelpers');
const Campground=require('../models/campground');

mongoose.connect('mongodb://localhost:27017/my-camp',{
    useNewUrlParser:true,
    useUnifiedTopology:true
})

const db=mongoose.connection;
db.on('error',console.error.bind(console,'connection errror:'));
db.once('open',()=>{
    console.log('Database connected');
})
const sample = array => array[Math.floor(Math.random() *array.length)];

const seedDB= async() => {
    await Campground.deleteMany({});
    for(let i=0; i<300; i++){
        const random1000= Math.floor(Math.random()*1000);
        const price=Math.floor(Math.random()*20)+10;
        const camp= new Campground({
            author:'638ddd618d433e0c95a387b6',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title:`${sample(descriptors)} ${sample(places)}`,
            description:'Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa ab totam quo, ratione quas aut ea nam harum reiciendis qui esse quisquam omnis, amet nihil expedita debitis molestiae et? Non.',
            price,
            geometry:{
                type:'Point',
                coordinates:[
                    cities[random1000].longitude,
                    cities[random1000].latitude
                ]
            },
            images:[
                {
                    url: 'https://res.cloudinary.com/dcuz2moth/image/upload/v1670177011/ExploreIt/cg12_jstv1l.jpg',
                    filename: 'ExploreIt/cg12_jstv1l',
                  },
                  {
                    url: 'https://res.cloudinary.com/dcuz2moth/image/upload/v1670177029/ExploreIt/cg13_yipcwu.jpg',
                    filename: 'ExploreIt/cg13_yipcwu',
                  },
                  {
                    url:'https://res.cloudinary.com/dcuz2moth/image/upload/v1670179385/ExploreIt/cg6_xinnma.jpg',
                    filename:'ExploreIt/cg6_xinnma',
                  },
                  {
                    url:'https://res.cloudinary.com/dcuz2moth/image/upload/v1670179368/ExploreIt/cg8_jjijmc.jpg',
                    filename:'ExploreIt/cg8_jjijmc',
                  }
            ]
        })
        await camp.save();
    }
}
seedDB().then(()=>{
    mongoose.connection.close();
})

//used to seed our databse, run this as node.
//deletes everything in our database