import * as authService from '../services/authService.js';
import passport from 'passport';
    
export const login = async (req, res) => {
    try {
        const response = await authService.login(req.body);
        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const register = async (req, res) => {
    try {
        const response = await authService.register(req.body);
        res.status(201).json(response);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const googleAuth = (req, res, next) => {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
};

export const googleCallback = (req, res, next) => {
    passport.authenticate('google', { failureRedirect: '/login' }, (err, user) => {
        if (err || !user) {
            return res.redirect('/login');
        }
        // Successful authentication, redirect home.
        res.redirect('/');
    })(req, res, next);
};
