const express = require('express');
const bodyParser = require('body-parser');
const authController = require('./auth.controller');
console.log('[DEBUG INDEX] authController loaded:', Object.keys(authController));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.use((req, res, next) => {
    console.log(`[AUTH SERVICE RECEIVE] Method: ${req.method} Path: ${req.originalUrl}`);
    next();
});

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

app.post('/login', authController.login);
app.post('/signup-direct', authController.signupDirect);
app.post('/refresh-token', authController.refreshToken);
app.post('/logout', authController.logout);
app.get('/verify-token', authController.verifyToken);

app.get('/user-metadata/check', authController.attachUserMetadata, authController.checkUserMetadata);
app.post('/user-metadata/register', authController.attachUserMetadata, authController.registerUserMetadata);

app.listen(PORT, () => {
    console.log(`Auth Service corriendo en el puerto ${PORT}`);
});