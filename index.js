const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


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

async function run() {
  try {
    const serviceCollection = client.db('carDoctor').collection('services');
    const bookingCollection = client.db('carDoctor').collection('bookings');


    app.get('/services', async(req,res)=>{
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
      console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.get('/bookings', async(req,res)=>{
      console.log(req.query);
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
      console.log(updatedBookings);
      const filter = {_id: new ObjectId(id)}
      const updateDoc = {
        $set: {
          status: updatedBookings.status
        }
      }
      const result = await bookingCollection.updateOne(filter, updateDoc)
      res.send(result);
      console.log(updatedBookings);
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