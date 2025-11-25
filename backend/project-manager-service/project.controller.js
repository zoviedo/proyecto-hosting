const gitUtil = require('./git.util');
const dockerUtil = require('./docker.util');
const robleDbUtil = require('./roble.db.util');
const axios = require('axios');
const Docker = require('dockerode');

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const AUTH_SERVICE_URL = 'http://roble-auth-service:3000';
const CONTAINER_MANAGER_URL = 'http://roble-container-manager:3002/api/activity';
const TEMPLATE_PORTS = { 'html_css_js': '80', 'react': '80', 'flask': '80' };

const getDockerNames = (projectName, username) => {
    const safeProjectName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const safeUsername = username.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const containerName = `${safeProjectName}.${safeUsername}`;
    const imageName = `user-${safeUsername}/app-${safeProjectName}`;
    return { containerName, imageName };
};

const getFreshAccessToken = async (refreshToken) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/refresh-token`, { refreshToken });
        return response.data.accessToken;
    } catch (error) {
        throw new Error("Sesión expirada.");
    }
};

const deployCore = async (userId, projectName, urlRepo, templateType, userToken) => {
    const username = await robleDbUtil.getUsernameByUserId(userId, userToken);
    const { containerName, imageName } = getDockerNames(projectName, username);
    const exposedPort = TEMPLATE_PORTS[templateType];

    if (!exposedPort) throw new Error(`Template '${templateType}' no válido.`);
    try {
        const oldContainer = docker.getContainer(containerName);
        await oldContainer.remove({ force: true });
    } catch (e) { }

    const buildPath = await gitUtil.cloneAndPrepareRepo(urlRepo, projectName, templateType);
    await dockerUtil.buildImage(buildPath, `${imageName}:latest`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await dockerUtil.runContainer(`${imageName}:latest`, containerName, exposedPort);
    await gitUtil.cleanTemp(projectName).catch(() => { });

    return { url: `http://${containerName}.localhost` };
};

exports.createAndDeployProject = async (req, res) => {
    const { projectName, description, urlRepo, templateType, refreshToken } = req.body;
    const userId = req.userId;

    if (!userId) return res.status(401).json({ message: "Usuario no identificado." });

    try {
        const userToken = req.headers.authorization;

        const validDockerName = /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/;

        if (!validDockerName.test(projectName)) {
            return res.status(400).json({
                message:
                    "Nombre inválido. Solo minúsculas, números, '.', '-', '_' y no puede iniciar ni terminar con símbolos."
            });
        }

        const existingProjects = await robleDbUtil.getProjectsByUserId(userId, userToken);

        const exists = existingProjects.some(
            p => p.nombre_proyecto.trim().toLowerCase() === projectName.trim().toLowerCase()
        );

        if (exists) {
            return res.status(409).json({
                message: "Ya existe un proyecto con ese nombre."
            });
        }

        const { url } = await deployCore(userId, projectName, urlRepo, templateType, userToken);

        const freshAccessToken = await getFreshAccessToken(refreshToken);

        const projectData = {
            id_usuario: userId,
            nombre_proyecto: projectName,
            descripcion: description || "",
            template: templateType,
            url_repositorio: urlRepo,
            url_despliegue: url
        };

        const newRecord = await robleDbUtil.registerProject(projectData, freshAccessToken);
        const username = await robleDbUtil.getUsernameByUserId(userId, userToken);
        const { containerName } = getDockerNames(projectName, username);

        await axios.post(`${CONTAINER_MANAGER_URL}/start`, { containerName });

        return res.status(201).json({
            message: "Desplegado correctamente.",
            project: { ...projectData, _id: newRecord._id },
            newAccessToken: freshAccessToken
        });

    } catch (error) {
        console.error("Error Deploy:", error);
        await gitUtil.cleanTemp(projectName).catch(() => { });

        res.status(500).json({
            message: "Fallo despliegue.",
            error: error.message
        });
    }
};

exports.redeployProject = async (req, res) => {
    const { projectId } = req.params;
    const { refreshToken } = req.body;
    const userToken = req.headers.authorization;

    try {
        const project = await robleDbUtil.getProjectById(projectId, userToken);
        if (!project) return res.status(404).json({ message: "Proyecto no encontrado en BD." });

        const { url } = await deployCore(project.id_usuario, project.nombre_proyecto, project.url_repositorio, project.template, userToken);

        const freshAccessToken = await getFreshAccessToken(refreshToken);

        const updateDataRoble = { url_despliegue: url };

        await robleDbUtil.updateProjectRecord(projectId, updateDataRoble, freshAccessToken);

        const username = await robleDbUtil.getUsernameByUserId(project.id_usuario, userToken);
        const { containerName } = getDockerNames(project.nombre_proyecto, username);

        await axios.post(`${CONTAINER_MANAGER_URL}/start`, { containerName });

        res.status(200).json({
            message: "Re-despliegue exitoso.",
            newAccessToken: freshAccessToken
        });
    } catch (error) {
        console.error("Fallo al re-desplegar:", error.message, error.stack);
        res.status(500).json({ message: "Fallo al re-desplegar.", error: error.message });
    }
};

exports.startProject = async (req, res) => {
    const { projectId } = req.params;
    const { refreshToken } = req.body;
    const userToken = req.headers.authorization;

    try {
        const project = await robleDbUtil.getProjectById(projectId, userToken);
        if (!project) return res.status(404).json({ message: "Proyecto no encontrado" });

        const username = await robleDbUtil.getUsernameByUserId(project.id_usuario, userToken);
        const { containerName } = getDockerNames(project.nombre_proyecto, username);

        const status = await dockerUtil.getContainerStatus(containerName);
        if (status === 'not_found') {
            return res.status(404).json({
                message: "El contenedor no existe. Por favor usa 'Re-desplegar'."
            });
        }

        await dockerUtil.startContainer(containerName);
        await new Promise(resolve => setTimeout(resolve, 3000));

        const freshAccessToken = await getFreshAccessToken(refreshToken);

        await axios.post(`${CONTAINER_MANAGER_URL}/start`, { containerName });

        res.json({ message: "Iniciado correctamente.", newAccessToken: freshAccessToken });

    } catch (e) {
        console.error("Error al iniciar proyecto:", e.message, e.stack);
        res.status(500).json({ message: "Error al iniciar.", error: e.message });
    }
};

exports.deleteProject = async (req, res) => {
    const { projectId } = req.params;
    const userToken = req.headers.authorization;
    try {
        const token = userToken;

        const project = await robleDbUtil.getProjectById(projectId, token);

        if (project) {
            const username = await robleDbUtil.getUsernameByUserId(project.id_usuario, userToken);
            const { containerName, imageName } = getDockerNames(project.nombre_proyecto, username);
            await dockerUtil.deleteProject(containerName, imageName);
        }

        await robleDbUtil.deleteProjectRecord(projectId, token);

        res.json({ message: "Eliminado." });
    } catch (e) {
        console.error("Error crítico en deleteProject:", e.message);
        res.status(500).json({ message: "Error eliminando.", error: e.message });
    }
};

exports.getProjects = async (req, res) => {
    const userId = req.userId;
    const userToken = req.headers.authorization;
    try {
        const username = await robleDbUtil.getUsernameByUserId(userId, userToken);
        const projects = await robleDbUtil.getProjectsByUserId(userId, userToken);
        const enriched = await Promise.all(projects.map(async (p) => {
            const { containerName } = getDockerNames(p.nombre_proyecto, username);
            const status = await dockerUtil.getContainerStatus(containerName);

            return {
                ...p,
                description: p.descripcion,
                estado_real: status,
                username: username
            };
        }));
        res.json(enriched);
    } catch (e) { res.status(500).json({ message: "Error listando." }); }
};

exports.getProjectDetails = async (req, res) => {
    const { projectId } = req.params;
    const userToken = req.headers.authorization;
    try {
        const project = await robleDbUtil.getProjectById(projectId, userToken);
        if (!project) return res.status(404).json({ message: "No encontrado" });

        const username = await robleDbUtil.getUsernameByUserId(project.id_usuario, userToken);
        const { containerName } = getDockerNames(project.nombre_proyecto, username);
        const status = await dockerUtil.getContainerStatus(containerName);

        let lastAccess = null;
        try {
            const cmResponse = await axios.get(`${CONTAINER_MANAGER_URL}/metadata/${containerName}`);
            const metadata = cmResponse.data;

            const hitTime = metadata.last_hit ? new Date(metadata.last_hit).getTime() : 0;
            const startTime = metadata.last_start ? new Date(metadata.last_start).getTime() : 0;
            const lastActiveTime = Math.max(hitTime, startTime);

            lastAccess = lastActiveTime > 0 ? new Date(lastActiveTime).toISOString() : null;

        } catch (e) {
            console.warn("No se pudo obtener metadata del CM:", e.message);
        }

        res.json({
            ...project,
            description: project.descripcion,
            estado_real: status,
            username: username,
            ultimo_acceso: lastAccess
        });
    } catch (e) { res.status(500).json({ message: "Error detalles." }); }
};

exports.stopProject = async (req, res) => {
    const { projectId } = req.params;
    const userToken = req.headers.authorization;
    try {
        const project = await robleDbUtil.getProjectById(projectId, userToken);
        const username = await robleDbUtil.getUsernameByUserId(project.id_usuario, userToken);
        const { containerName } = getDockerNames(project.nombre_proyecto, username);
        await dockerUtil.stopContainer(containerName);
        res.json({ message: "Detenido." });
    } catch (e) { res.status(500).json({ message: "Error al detener." }); }
};

exports.getProjectStats = async (req, res) => {
    const { projectId } = req.params;
    const userToken = req.headers.authorization;
    try {
        const project = await robleDbUtil.getProjectById(projectId, userToken);
        const { containerName } = getDockerNames(project.nombre_proyecto, project.id_usuario);
        const stats = await dockerUtil.getContainerStats(containerName);
        res.json(stats);
    } catch (e) { res.json({ cpu: '0', ram: '0 MB' }); }
};

exports.recordProjectHit = async (req, res) => {
    const { containerName } = req.params;
    console.log(`[PM HIT] Petición de registro de HIT recibida para: ${containerName}`);

    try {
        await axios.post(`${CONTAINER_MANAGER_URL}/hit`, { containerName });
        console.log(`[PM HIT] Notificación de HIT enviada a Container Manager para: ${containerName}`);
    } catch (e) {
        console.error("[PM HIT] ERROR CRÍTICO al actualizar HIT (vía CM):", e.message);
    }

    res.status(204).end();
};

exports.wakeupProject = async (req, res) => {
    const { containerName } = req.params;

    try {
        const status = await dockerUtil.getContainerStatus(containerName);
        const userToken = req.headers.authorization;

        if (status === 'stopped') {
            console.log(`[Wakeup] Contenedor ${containerName} detenido. Iniciando...`);
            await dockerUtil.startContainer(containerName);

            const project = await robleDbUtil.getProjectByContainerName(containerName, userToken);

            if (project && project._id) {
                const username = await robleDbUtil.getUsernameByUserId(project.id_usuario, userToken);
                const { containerName: resolvedContainerName } = getDockerNames(project.nombre_proyecto, username);

                await axios.post(`${CONTAINER_MANAGER_URL}/start`, { containerName: resolvedContainerName });
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
        } else if (status === 'running') {
            console.log(`[Wakeup] Contenedor ${containerName} ya está corriendo. Redirigiendo.`);
        } else {
            return res.status(503).send(`El proyecto ${containerName} no puede ser iniciado (Estado: ${status}).`);
        }

        res.redirect(`http://${containerName}.localhost${req.query.path || ''}`);

    } catch (e) {
        console.error("Error al despertar proyecto:", e.message);
        res.status(500).send("Error interno al intentar reiniciar el servicio.");
    }
};

exports.updateProject = async (req, res) => {
    const { projectId } = req.params;
    const { nombre_proyecto, descripcion, url_repositorio, template, refreshToken } = req.body;

    const userToken = req.headers.authorization;
    const userId = req.userId;

    try {
        const original = await robleDbUtil.getProjectById(projectId, userToken);
        if (!original) {
            return res.status(404).json({ message: "Proyecto no encontrado." });
        }

        if (nombre_proyecto && nombre_proyecto !== original.nombre_proyecto) {
            const validDockerName = /^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/;
            if (!validDockerName.test(nombre_proyecto)) {
                return res.status(400).json({
                    message:
                        "Nombre inválido. Solo minúsculas, números, '.', '-', '_' y no puede iniciar ni terminar con símbolos."
                });
            }

            const allProjects = await robleDbUtil.getProjectsByUserId(userId, userToken);
            const exists = allProjects.some(
                p =>
                    p._id !== projectId &&
                    p.nombre_proyecto.trim().toLowerCase() === nombre_proyecto.trim().toLowerCase()
            );

            if (exists) {
                return res.status(409).json({ message: "Ya existe otro proyecto con ese nombre." });
            }
        }

        const username = await robleDbUtil.getUsernameByUserId(original.id_usuario, userToken);
        const updateData = {};

        if (nombre_proyecto) updateData.nombre_proyecto = nombre_proyecto;
        if (descripcion !== undefined) updateData.descripcion = descripcion;
        if (url_repositorio) updateData.url_repositorio = url_repositorio;
        if (template) updateData.template = template;

        if (nombre_proyecto && nombre_proyecto !== original.nombre_proyecto) {
            const newNames = getDockerNames(nombre_proyecto, username);
            updateData.url_despliegue = `http://${newNames.containerName}.localhost`;
        }

        const freshAccessToken = await getFreshAccessToken(refreshToken);

        await robleDbUtil.updateProjectRecord(projectId, updateData, freshAccessToken);

        if (nombre_proyecto && nombre_proyecto !== original.nombre_proyecto) {
            const oldNames = getDockerNames(original.nombre_proyecto, username);
            const newNames = getDockerNames(nombre_proyecto, username);

            try {
                const status = await dockerUtil.getContainerStatus(oldNames.containerName);
                if (status !== 'not_found' && status !== 'error') {
                    await dockerUtil.stopContainer(oldNames.containerName).catch(() => { });
                    await dockerUtil.renameContainer(oldNames.containerName, newNames.containerName);
                    await dockerUtil.startContainer(newNames.containerName);
                    await axios.post(`${CONTAINER_MANAGER_URL}/start`, { containerName: newNames.containerName });
                }
            } catch (err) {
                console.warn("No se pudo renombrar contenedor:", err.message);
            }
        }

        return res.json({
            message: "Proyecto actualizado correctamente.",
            updated: { ...original, ...updateData, username: username },
            newAccessToken: freshAccessToken
        });

    } catch (error) {
        console.error("Error updateProject:", error.message);
        return res.status(500).json({ message: "Fallo al actualizar proyecto.", error: error.message });
    }
};