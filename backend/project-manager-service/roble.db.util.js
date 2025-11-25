const axios = require('axios');

const ROBLE_DB_TOKEN = process.env.ROBLE_DB_TOKEN;
const PROJECTS_TABLE = process.env.PROJECTS_TABLE_NAME;
const USER_METADATA_TABLE = process.env.USER_METADATA_TABLE_NAME;

const ROBLE_DB_URL = `https://roble-api.openlab.uninorte.edu.co/database/${ROBLE_DB_TOKEN}`;

const AXIOS_TIMEOUT = 30000;

const cleanToken = (token) => {
    if (!token) return '';
    return token.replace('Bearer ', '').trim();
};

exports.registerProject = async (projectData, userToken) => {
    try {
        const token = cleanToken(userToken);

        const recordToInsert = {
            id_usuario: projectData.id_usuario,
            nombre_proyecto: projectData.nombre_proyecto,
            descripcion: projectData.descripcion || "",
            template: projectData.template,
            url_repositorio: projectData.url_repositorio,
            url_despliegue: projectData.url_despliegue
        };

        const response = await axios.post(`${ROBLE_DB_URL}/insert`, {
            tableName: PROJECTS_TABLE,
            records: [recordToInsert]
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-project-name': PROJECTS_TABLE
            },
            timeout: AXIOS_TIMEOUT
        });

        if (!response.data?.inserted || !response.data.inserted[0]) {
            console.error("Respuesta inesperada de Roble DB:", response.data);
            throw new Error("Roble DB no devolvió un registro insertado.");
        }

        return response.data.inserted[0];

    } catch (error) {
        console.error("Error al registrar proyecto en Roble:", error.response?.data || error.message);
        throw new Error("Fallo al guardar el proyecto en la base de datos.");
    }
};

exports.getProjectsByUserId = async (userId, userToken) => {
    try {
        const token = cleanToken(userToken);

        const response = await axios.get(
            `${ROBLE_DB_URL}/read`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-project-name': PROJECTS_TABLE
                },
                params: {
                    tableName: PROJECTS_TABLE,
                    id_usuario: userId
                },
                timeout: AXIOS_TIMEOUT
            }
        );

        if (Array.isArray(response.data)) {
            return response.data;
        }
        return response.data.rows || [];

    } catch (error) {
        console.error("Error al leer proyectos de Roble:", error.response?.data || error.message);
        throw new Error("Fallo al obtener la lista de proyectos.");
    }
};

exports.getProjectById = async (projectId, userToken) => {
    try {
        const token = cleanToken(userToken);

        const response = await axios.get(
            `${ROBLE_DB_URL}/read`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-project-name': PROJECTS_TABLE
                },
                params: {
                    tableName: PROJECTS_TABLE,
                    _id: projectId
                },
                timeout: AXIOS_TIMEOUT
            }
        );

        const data = Array.isArray(response.data) ? response.data : (response.data.rows || []);

        if (data.length === 0) return null;
        return data[0];

    } catch (error) {
        console.error("Error al buscar proyecto por ID:", error.response?.data || error.message);
        throw new Error("Fallo al buscar el proyecto.");
    }
};

exports.deleteProjectRecord = async (projectId, userToken) => {
    try {
        const token = cleanToken(userToken);

        await axios.delete(`${ROBLE_DB_URL}/delete`, {
            data: {
                tableName: PROJECTS_TABLE,
                idColumn: '_id',
                idValue: projectId
            },
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-project-name': PROJECTS_TABLE
            },
            timeout: AXIOS_TIMEOUT
        });

    } catch (error) {
        console.error("Error al eliminar registro de Roble:", error.response?.data || error.message);
        throw new Error("Fallo al eliminar el registro de la base de datos.");
    }
};

exports.updateProjectRecord = async (projectId, updateData, userToken) => {
    try {
        const token = cleanToken(userToken);

        const response = await axios.put(
            `${ROBLE_DB_URL}/update`,
            {
                tableName: PROJECTS_TABLE,
                idColumn: "_id",
                idValue: projectId,
                updates: updateData
            },
            {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "x-project-name": PROJECTS_TABLE
                },
                timeout: AXIOS_TIMEOUT
            }
        );

        return response.data;

    } catch (error) {
        console.error("Error al actualizar proyecto en Roble:", error.response?.data || error.message);
        throw new Error("Fallo al actualizar el proyecto en la base de datos.");
    }
};

exports.getProjectByContainerName = async (containerName, userToken) => {
    const parts = containerName.split('.');
    if (parts.length < 2) return null;

    const projectName = parts[0];
    const username = parts[1];

    const token = cleanToken(userToken);
    if (!token || !projectName || !username) return null;

    try {
        const metadataResponse = await axios.get(
            `${ROBLE_DB_URL}/read`,
            {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { tableName: USER_METADATA_TABLE, username: username },
                timeout: AXIOS_TIMEOUT
            }
        );

        const metadata = Array.isArray(metadataResponse.data) ? metadataResponse.data : (metadataResponse.data.rows || []);
        if (metadata.length === 0) return null;

        const userId = metadata[0].id_usuario;

        const projectResponse = await axios.get(
            `${ROBLE_DB_URL}/read`,
            {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { tableName: PROJECTS_TABLE, nombre_proyecto: projectName, id_usuario: userId },
                timeout: AXIOS_TIMEOUT
            }
        );

        const data = Array.isArray(projectResponse.data) ? projectResponse.data : (projectResponse.data.rows || []);
        if (data.length === 0) {
            console.log(`[DEBUG UTIL] Busqueda Fallida para ${containerName}: Proyecto o Username no encontrado.`);
            return null;
        }

        console.log(`[DEBUG UTIL] Proyecto encontrado: ${data[0].nombre_proyecto}, ID: ${data[0]._id}`);
        return data[0] || null;

    } catch (error) {
        console.error("Error al buscar proyecto por nombre de contenedor:", error.message);
        return null;
    }
};


exports.getUsernameByUserId = async (userId, userToken) => {
    if (userId.length <= 8) return userId;

    try {
        const token = cleanToken(userToken);
        const robleDbUrl = `https://roble-api.openlab.uninorte.edu.co/database/${ROBLE_DB_TOKEN}`;

        const response = await axios.get(
            `${robleDbUrl}/read`,
            {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { tableName: USER_METADATA_TABLE, id_usuario: userId },
                timeout: AXIOS_TIMEOUT
            }
        );

        const userData = Array.isArray(response.data) ? response.data : (response.data.rows || []);

        if (userData.length === 0) {
            console.warn("Metadatos de usuario no encontrados. Usando hash ID como fallback.");
            return userId.substring(0, 8);
        }

        return userData[0].username;

    } catch (error) {
        console.error("Error al obtener username:", error.message);
        return userId.substring(0, 8);
    }
};