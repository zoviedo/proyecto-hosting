const express = require('express');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const projectController = require('./project.controller');
const authMiddleware = require('./auth.middleware');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // Limita cada IP a 100 peticiones por ventana (windowMs)
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            message: "Demasiadas peticiones desde esta IP, por favor intente de nuevo en un minuto.",
            error: "Rate Limit Exceeded"
        });
    }
});

app.use(apiLimiter);

app.get('/wakeup/:containerName', projectController.wakeupProject);
app.post('/deploy', authMiddleware.verifyUserToken, projectController.createAndDeployProject);
app.get('/projects', authMiddleware.verifyUserToken, projectController.getProjects);
app.get('/projects/:projectId', authMiddleware.verifyUserToken, projectController.getProjectDetails);
app.put('/projects/:projectId', authMiddleware.verifyUserToken, projectController.updateProject);
app.delete('/projects/:projectId', authMiddleware.verifyUserToken, projectController.deleteProject);

app.post('/projects/:projectId/stop', authMiddleware.verifyUserToken, projectController.stopProject);
app.post('/projects/:projectId/start', authMiddleware.verifyUserToken, projectController.startProject);
app.post('/projects/:projectId/redeploy', authMiddleware.verifyUserToken, projectController.redeployProject);
app.get('/projects/:projectId/stats', authMiddleware.verifyUserToken, projectController.getProjectStats);
app.post('/hit/:containerName', projectController.recordProjectHit);

app.listen(PORT, () => {
    console.log(`Project Manager Service corriendo en el puerto ${PORT}`);
});