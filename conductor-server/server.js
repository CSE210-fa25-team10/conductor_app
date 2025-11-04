import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

//Parse JSON and forms
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Test route
app.get('/', (req, res) => {
    res.send('✅ Express 5.1.0 server running on Node.js v24.11.0 LTS');
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
})