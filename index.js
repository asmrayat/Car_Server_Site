const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());


console.log(process.env.DB_USER);


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z2fxdnr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyJWT = (req, res, next) => {
    console.log("hetting JWRT");
    // console.log(req.headers.authorization);
    const authorization = req.headers.authorization;
    if(!authorization){
        return res.status(401).send ({error:true, message:'unauthorized access'})
    }
    else{
        const token = authorization.split(' ')[1];
        jwt.verify(token,process.env.ACCESS_TOKEN,(error,decoded)=>{
            if(error){
                return res.status(403).send({error:true, message:'unauthorized access'})
            }
            else{
                req.decoded = decoded;
                
                next();
            }
        })
    }
   

}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        const serviceCollection = client.db('carsDB').collection('services');
        const bookingCollection = client.db('carsDB').collection('booking');

        //jwt
        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '1h'
            });
            res.send({ token });
        })


        //all data load
        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        //one data load
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const options = {
                // Include only the `title` and `imdb` fields in the returned document
                projection: { title: 1, price: 1, service_id: 1, img: 1 },
            };
            const result = await serviceCollection.findOne(query, options);
            res.send(result);
        })


        //booking

        app.post('/booking', async (req, res) => {

            const booking = req.body;
            const result = await bookingCollection.insertOne(booking)
            res.send(result);
        })

        app.get('/booking', verifyJWT, async (req, res) => {
            // console.log(req.headers);
            const decoded = req.decoded;

            if(decoded.email!==req.query.email){
                result.res.status(403).send({error:1, message:'forbidden access'})
            }

            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })

        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query);
            res.send(result);
        })
        app.patch('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateBooking = req.body;
            const updateDoc = {
                $set: {
                    status: updateBooking.status
                },
            };

            const result = await bookingCollection.updateOne(filter, updateDoc);
            res.send(result);
        })




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('server is running')
})

app.listen(port, () => {
    console.log(`port number${port}`);
})

