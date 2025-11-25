const Docker = require('dockerode');
const fs = require('fs-extra');
const tar = require('tar-fs');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

exports.buildImage = (buildPath, imageName) => {
    const tarStream = tar.pack(buildPath);
    return new Promise((resolve, reject) => {
        console.log(`[Build] Iniciando: ${imageName}`);
        docker.buildImage(tarStream, { t: imageName }, (err, stream) => {
            if (err) return reject(err);
            stream.on('error', reject);
            docker.modem.followProgress(stream, (err, output) => {
                if (err) return reject(err);
                console.log(`[Build] Exitosa: ${imageName}`);
                resolve(output);
            });
        });
    });
};

exports.runContainer = async (imageName, containerName, exposedPort) => {
    const NETWORK_NAME = "proyecto-hosting_roble-network";
    const exposedPorts = {};
    exposedPorts[`${exposedPort}/tcp`] = {};

    const payload = {
        Image: imageName,
        name: containerName,
        ExposedPorts: exposedPorts,
        HostConfig: {
            Memory: 536870912,      // 512 MB
            NanoCpus: 500000000,    // 0.5 CPU
            NetworkMode: NETWORK_NAME
        },
        Env: [`VIRTUAL_HOST=${containerName}.localhost`]
    };
    console.log("DEBUG PAYLOAD:", JSON.stringify(payload, null, 2));

    const container = await docker.createContainer(payload);

    await container.start();
    console.log(`[Run] Contenedor ${containerName} iniciado.`);
    return container;
};

exports.deleteProject = async (containerName, imageName) => {
    try {
        const container = docker.getContainer(containerName);
        await container.remove({ force: true });
    } catch (err) {
        if (err.statusCode !== 404) console.warn(`Error borrando container: ${err.message}`);
    }

    try {
        const image = docker.getImage(imageName);
        await image.remove({ force: true });
    } catch (err) {
        if (err.statusCode !== 404) console.warn(`Error borrando imagen: ${err.message}`);
    }
};

exports.getContainerStatus = async (containerName) => {
    try {
        const container = docker.getContainer(containerName);
        const data = await container.inspect();
        if (data.State.Running) return 'running';
        if (data.State.Paused) return 'paused';
        if (data.State.Restarting) return 'restarting';
        return 'stopped';
    } catch (err) {
        if (err.statusCode === 404) return 'not_found';
        return 'error';
    }
};

exports.stopContainer = async (containerName) => {
    const container = docker.getContainer(containerName);
    await container.stop();
};

exports.startContainer = async (containerName) => {
    const container = docker.getContainer(containerName);
    await container.start();
};

exports.getContainerStats = async (containerName) => {
    try {
        const container = docker.getContainer(containerName);
        const stats = await container.stats({ stream: false });
        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
        const systemCpuDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
        const numberCpus = stats.cpu_stats.online_cpus || 1;

        let cpuPercent = 0.0;
        if (systemCpuDelta > 0 && cpuDelta > 0) {
            cpuPercent = (cpuDelta / systemCpuDelta) * numberCpus * 100.0;
        }

        const usedMemory = stats.memory_stats.usage || 0;

        return {
            cpu: cpuPercent.toFixed(2),
            ram: `${(usedMemory / 1024 / 1024).toFixed(2)} MB`
        };
    } catch (err) {
        return { cpu: '0', ram: '0 MB' };
    }
};

exports.renameContainer = async (oldName, newName) => {
    try {
        const container = docker.getContainer(oldName);
        await container.rename({ name: newName });
        console.log(`[Docker] Renombrado: ${oldName} → ${newName}`);
    } catch (err) {
        console.error(`[Docker] Error al renombrar ${oldName}:`, err.message);
        throw err;
    }
};
