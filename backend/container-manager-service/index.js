const express = require('express');
const bodyParser = require('body-parser');
const { startWatcher, updateMetadataFile, getLocalMetadata } = require('./watcher');

const app = express();
const PORT = 3002;

app.use(bodyParser.json());

app.post('/api/activity/hit', async (req, res) => {
    const { containerName } = req.body;
    if (!containerName) return res.status(400).send('Missing containerName');

    try {
        await updateMetadataFile(containerName, { last_hit: new Date().toISOString() });
        console.log(`[CM] LOG: last_hit actualizado para Contenedor: ${containerName}`);
        res.status(204).end();
    } catch (error) {
        console.error(`[CM] ERROR al registrar HIT para ${containerName}:`, error.message);
        res.status(500).send('Error logging access');
    }
});

app.post('/api/activity/start', async (req, res) => {
    const { containerName } = req.body;
    if (!containerName) return res.status(400).send('Missing containerName');

    try {
        const now = new Date().toISOString();
        await updateMetadataFile(containerName, { last_start: now });
        console.log(`[CM] LOG: last_start actualizado para Contenedor: ${containerName}`);
        res.status(204).end();
    } catch (error) {
        console.error(`[CM] ERROR al registrar START para ${containerName}:`, error.message);
        res.status(500).send('Error logging start');
    }
});

app.get('/api/activity/metadata/:containerName', async (req, res) => {
    const { containerName } = req.params;
    const metadata = await getLocalMetadata();
    res.json(metadata[containerName] || { last_start: null, last_hit: null });
});

app.listen(PORT, () => {
    console.log(`Container Manager Service corriendo en el puerto ${PORT}`);
    startWatcher();
});