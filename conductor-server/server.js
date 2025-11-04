import express from 'express';
import session from 'express-session';
import apiRoutes from './routes/apiRoutes.js';
import dotenv from 'dotenv';
import passport from 'passport';
import './config/passport.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

//Parse JSON and forms
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use("/api", apiRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('✅ Express 5.1.0 server running on Node.js v24.11.0 LTS');
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
})