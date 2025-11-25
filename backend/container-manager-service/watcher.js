const Docker = require('dockerode');
const fs = require('fs-extra');
const path = require('path');
const DOCKER_UTIL = require('./docker.util');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const METADATA_FILE = '/usr/src/app/access_metadata.json';

const getLocalMetadata = async () => {
    try {
        if (!await fs.pathExists(METADATA_FILE)) {
            await fs.writeJson(METADATA_FILE, {});
        }
        return await fs.readJson(METADATA_FILE);
    } catch (e) {
        console.error("Watcher: Error leyendo metadata local:", e.message);
        return {};
    }
};

const updateMetadataFile = async (containerName, data) => {
    const metadata = await getLocalMetadata();
    metadata[containerName] = { ...metadata[containerName], ...data };
    await fs.writeJson(METADATA_FILE, metadata);
};

const INACTIVITY_THRESHOLD = 30 * 60 * 1000; // 30 minutos
const CHECK_INTERVAL = 30 * 1000; // Chequeo cada 30 segundos

async function checkAndStopContainers() {
    const now = Date.now();

    console.log(`\n[${new Date().toISOString()}] Iniciando chequeo de inactividad...`);

    try {
        const localMetadata = await getLocalMetadata();
        const allContainers = await docker.listContainers({ filters: { status: ['running'] } });

        for (const containerInfo of allContainers) {

            const containerName = containerInfo.Names[0].replace('/', '');
            if (containerName.startsWith('roble-')) {
                continue;
            }

            const metadata = localMetadata[containerName];

            if (!metadata) {
                console.log(`[Watcher] DEBUG: Contenedor ${containerName} sin metadata. Inicializando ahora.`);
                await updateMetadataFile(containerName, { last_start: new Date().toISOString(), last_hit: null });
                continue;
            }

            const lastHitTime = metadata.last_hit ? new Date(metadata.last_hit).getTime() : 0;
            const lastStartTime = metadata.last_start ? new Date(metadata.last_start).getTime() : 0;

            const lastActiveTime = Math.max(lastHitTime, lastStartTime);

            if (lastActiveTime === 0) continue;

            const inactiveTime = now - lastActiveTime;
            const minutesInactive = Math.round(inactiveTime / 60000);

            console.log(`[Watcher] DEBUG: Container ${containerName}. Última actividad: ${new Date(lastActiveTime).toLocaleTimeString()}. Inactive Minutes: ${minutesInactive}`);

            if (inactiveTime > INACTIVITY_THRESHOLD) {

                console.log(`\n[Watcher] STOPPING: Contenedor ${containerName} inactivo por ${minutesInactive} minutos. Apagando.`);

                try {
                    await DOCKER_UTIL.stopContainer(containerName);
                    console.log(`[Watcher] STOPPED: ${containerName}.`);
                } catch (stopErr) {
                    console.error(`[Watcher] ERROR al detener ${containerName}:`, stopErr.message);
                }
            }
        }
    } catch (error) {
        console.error("Error crítico durante el chequeo de inactividad:", error.message);
    }
}

function startWatcher() {
    console.log(`Container Manager Watcher iniciado. Chequeando cada ${CHECK_INTERVAL / 1000} segundos. Umbral: ${INACTIVITY_THRESHOLD / 60000} minutos.`);
    checkAndStopContainers();
    setInterval(checkAndStopContainers, CHECK_INTERVAL);
}

module.exports = { startWatcher, updateMetadataFile, getLocalMetadata };