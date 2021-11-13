const express = require('express')
const app = express()
const { MongoClient } = require('mongodb');
const admin = require("firebase-admin");
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config()

 
const serviceAccount = require("./bike-world-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const cors = require('cors')


const port = process.env.PORT || 5000


app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0uqqq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req, res, next){
    if(req.headers?.authorization?.startWith('Barer ')){
      const token = req.headers.authorization.split(' ')[1];

      try{
        const decodedUser = await admin.auth().verifyIdToken(token)
        req.decodedEmail=decodedUser.email;
      }
      catch{

      }


    }

  next()
}


async function run() {
    try {
        
    await client.connect();
      
    const database = client.db("bikeWorld");
    const bikesCollection = database.collection("products");
    const reviewsCollection = database.collection("reviews");
    const ordersCollection = database.collection("orders");
    const orderConfirms = database.collection("confirm");
    const usersCollection = database.collection("users");


    // post api products
    app.post ('/products',async(req, res)=>{
        const service=req.body;
        // console.log(service);
        const result = await bikesCollection.insertOne(service);
        // console.log(result);
        res.json(result)
    })

    // post api reviews
    app.post ('/reviews',async(req, res)=>{
        const service=req.body;
        // console.log(service);
        const result = await reviewsCollection.insertOne(service);
        // console.log(result);
        res.json(result)
    })


    // post api oeders
    app.post ('/orders',async(req, res)=>{
        const service=req.body;
        console.log(service);
        const result = await ordersCollection.insertOne(service);
        // console.log(result);
        res.json(result)
    })

    //post order Confirm  api
    app.post('/orderConfirms', async (req, res) => {
      const orderConfirm = req.body;
      const result = await orderConfirms.insertOne(orderConfirm)
      console.log(result);
      res.json(result)
    })

  
    //my purchages order confirms get all for admin
        app.get('/allmypurchages', async (req, res) => {
            const query = req.query;
            // const  = { email: email }
            const cursor = orderConfirms.find(query);
            const mypurchages = await cursor.toArray();
            res.json(mypurchages)
        })

    app.post('/users', async (req, res)=>{
      const user=req.body;
      const result =await usersCollection.insertOne(user);
      res.json(result)
    })



    // get specific userorders
    app.get('/userorders', async (req, res)=>{
      const email= req.query.email;
      const query = {email: email}
      const cursor = orderConfirms.find(query)
      const userorders= await cursor.toArray()
      res.json(userorders)
    })
   


    // get single product
    app.get("/products/:id",async (req, res)=>{
        const id =req.params.id;
        const query = {_id: ObjectId(id)}
        const service = await bikesCollection.findOne(query)
        res.json(service)
    })

     // get api product
     app.get('/products',async(req, res)=>{
        const cursor = bikesCollection.find({});
        const services= await cursor.toArray();
        res.send(services)
    })
     // get api orders
     app.get('/orders',async(req, res)=>{
        const cursor = ordersCollection.find({});
        const services= await cursor.toArray();
        res.send(services)
    })
     // get api review
     app.get('/reviews',async(req, res)=>{
        const cursor = reviewsCollection.find({});
        const service= await cursor.toArray();
        res.send(service)
    })

    // admin check
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === 'admin') {
          isAdmin = true;
      }
      res.json({ admin: isAdmin });
  })


    // make Admin
    app.put('/users/admin', verifyToken, async (req, res)=>{
      const user =req.body;
      const requester = req.decodedEmail;
      if (requester) {
        const requesterAccount = await usersCollection.findOne({email:requester})
        if (requesterAccount.role ==="admin") {
          const filter = {email:user.email};
          const updateDoc = { $set: {role:'admin' } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result)
        }
      }else {
        res.status(403).json({message: 'You do not have acces to make admin'})
      }
      

    })

    // cancel single Order
    app.delete('/DeleteOrder/:id', async(req,res)=>{
      console.log(req.params.id);
      const result =await ordersCollection.deleteOne({
          _id: ObjectId(req.params.id),
      
      });
      res.send(result)
  });


    // delete user Order
    app.delete('/userordersdelete/:id', async(req,res)=>{
      console.log(req.params.id);
      const result =await orderConfirms.deleteOne({
          _id: ObjectId(req.params.id),
      
      });
      res.send(result)
  });


  // delete products
  app.delete('/services/:id', async (req, res)=>{
    const result= await bikesCollection.deleteOne({ 
          _id: ObjectId(req.params.id),
       
        });
    res.json(result)
  })

//UPDATE API
app.put('/services/:id', async (req, res) => {
  const id = req.params.id;
  // console.log('update id:',req);
  const updatedUser = req.body;
  const filter = { _id: ObjectId(id) };
  const options = { upsert: true };
  const updateDoc = {
      $set: {
          titile: updatedUser.titile,
          description: updatedUser.description,
          img: updatedUser.img,
          time: updatedUser.time,
          price: updatedUser.price,
      },
  };
  const result = await bikesCollection.updateOne(filter, updateDoc, options)
  // console.log('updating', id)
  res.json(result)
})




      
    } finally {
    //   await client.close();
    }
  }
  run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`i am listening you from here${port}`)
})