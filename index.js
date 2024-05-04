const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

app.use(cors({
  origin:['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.skihu85.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middleware
const logger = async(req,res,next) =>{
  console.log('called:', req.host, req.originalUrl)
  next();
}

const verifyToken = async(req,res,next) =>{
  const token = req.cookies?.token;
  // console.log('value of token in middle ware',token);
  if(!token){
    return res.status(401).send({message: 'not authorized'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    // error
    if(err){
      console.log(err)
      return res.status(401).send({message: 'unauthorized '})
    }
    // if token is valid than it would be decoded
    console.log('value in the token', decoded)
    req.user = decoded;
    next()
  })
  
}

async function run() {
  try {
    const serviceCollection = client.db('carDoctor').collection('services');
    const bookingCollection = client.db('carDoctor').collection('bookings');


    // Auth related APi

    app.post('/jwt', logger, async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      });

      res
      .cookie('token', token, {
        httpOnly:true,
        secure:false
      })       
      .send({success: true});
    })

    // services related Api
    app.get('/services', logger, async(req,res)=>{
    const cursor = serviceCollection.find();
    const result = await cursor.toArray();
    res.send(result);
    // console.log(result)
    });
    
    app.get('/services/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const options = {
        projection: {title: 1, price: 1, services_id: 1, img: 1}
      }

      const result = await serviceCollection.findOne(query,options);
      res.send(result);
      // console.log(result)

    });

    app.post('/bookings', async(req,res)=>{
      const booking = req.body;
      // console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.get('/bookings', logger, verifyToken, async(req,res)=>{
      console.log(req.query);
      console.log('from valid token',req.user)
      if(req.query.email !== req.user.email){
        return res.status(403).send({message: 'forbidden access'})
      }
    //  console.log('tttt token', req.cookies.token)
      let query = {};
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result)
    });

    app.patch('/bookings/:id', async(req,res)=>{
      const id = req.params.id;
      const updatedBookings = req.body;
      // console.log(updatedBookings);
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set: {
          status: updatedBookings.status
        }
      }
      const result = await bookingCollection.updateOne(filter, updateDoc)
      res.send(result);
      // console.log(updatedBookings);
    }) 

    app.delete('/bookings/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });




  } finally {
    
  }
}
run().catch(console.dir);



app.get('/',(req,res)=>{
  res.send('Server is running');
});

app.listen(port, ()=>{
  console.log(`car Doctor Server is running on port ${port}`)
})