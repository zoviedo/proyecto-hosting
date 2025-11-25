const axios = require('axios');

const ROBLE_AUTH_TOKEN = process.env.ROBLE_AUTH_TOKEN;
const USER_METADATA_TABLE = process.env.USER_METADATA_TABLE_NAME;
const ROBLE_BASE_URL = "https://roble-api.openlab.uninorte.edu.co";
const ROBLE_AUTH_ENDPOINT = `${ROBLE_BASE_URL}/auth/${ROBLE_AUTH_TOKEN}`;
const AXIOS_TIMEOUT = 30000;

const axiosConfig = {
    timeout: AXIOS_TIMEOUT
};

function getUserIdFromToken(token) {
    return axios.get(`${ROBLE_AUTH_ENDPOINT}/verify-token`, {
        headers: { Authorization: token },
        timeout: AXIOS_TIMEOUT,
    })
        .then(robleRes => {
            const data = robleRes.data;
            const id = data?.id || data?.user?.id || data?.user?.sub || data?.sub;
            const email = data?.user?.email || data?.email;

            if (!id) {
                throw new Error('ID de usuario no encontrado.');
            }
            return { id, email };
        })
        .catch(error => {
            throw error;
        });
}

const isValidUsername = (username) => {
    const USERNAME_REGEX = /^[a-z0-9-]{3,20}$/;
    if (!username || username.length < 3 || username.length > 20) {
        return false;
    }
    if (!USERNAME_REGEX.test(username) || username.startsWith('-') || username.endsWith('-')) {
        return false;
    }
    return true;
};

console.log('[DEBUG CONTROLLER] Defining attachUserMetadata...');

const attachUserMetadata = async (req, res, next) => {
    console.log('[DEBUG MIDDLEWARE] Running attachUserMetadata for path:', req.originalUrl);
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Token de autorización requerido.' });
    }

    try {
        const { id, email } = await getUserIdFromToken(token);

        req.userId = id;
        req.email = email;

        req.userToken = token;

        next();

    } catch (error) {
        const status = error.response?.status || 500;
        console.error("Fallo de autenticación en middleware interno:", error.response?.data || error.message);
        res.status(status).json(error.response?.data || { message: 'Token de acceso inválido o expirado.' });
    }
};

const login = async (req, res) => {
    try {
        const robleRes = await axios.post(`${ROBLE_AUTH_ENDPOINT}/login`, req.body, axiosConfig);
        res.json(robleRes.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error interno de Roble.' });
    }
};

const signupDirect = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: 'Nombre, apellido, email y contraseña son requeridos.' });
        }

        const roblePayload = {
            name: `${firstName} ${lastName}`,
            email: email,
            password: password
        };

        const robleRes = await axios.post(`${ROBLE_AUTH_ENDPOINT}/signup-direct`, roblePayload, axiosConfig);
        res.status(201).json(robleRes.data);

    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error interno de Roble.' });
    }
};

const checkUserMetadata = async (req, res) => {
    const userId = req.userId;
    const userToken = req.headers.authorization;

    if (!userId) {
        return res.status(401).json({ message: 'UUID de usuario requerido.' });
    }

    const robleDbUrl = `${ROBLE_BASE_URL}/database/${ROBLE_AUTH_TOKEN}`;

    try {
        const response = await axios.get(
            `${robleDbUrl}/read`,
            {
                headers: { 'Authorization': userToken },
                params: { tableName: USER_METADATA_TABLE, id_usuario: userId },
                timeout: AXIOS_TIMEOUT
            }
        );

        const userData = Array.isArray(response.data) ? response.data : (response.data.rows || []);

        if (userData.length === 0) {
            console.log('[DEBUG CHECK] Devolviendo 404 - Username no encontrado.');
            return res.status(404).json({ message: 'Username no registrado.' });
        }
        console.log('[DEBUG CHECK] Devolviendo 200 - Username encontrado.');

        return res.json({
            username: userData[0].username,
            userId: userId
        });

    } catch (error) {
        console.error("Error al verificar metadata de usuario:", error.message);
        return res.status(500).json({ message: 'Error interno de DB.' });
    }
};

const registerUserMetadata = async (req, res) => {
    const { username } = req.body;
    const userId = req.userId;
    const userEmail = req.email;
    const userToken = req.headers.authorization;

    if (!userId || !username) {
        return res.status(400).json({ message: 'UUID y username son requeridos.' });
    }

    if (!isValidUsername(username)) {
        return res.status(400).json({ message: 'Username inválido.' });
    }

    const robleDbUrl = `${ROBLE_BASE_URL}/database/${ROBLE_AUTH_TOKEN}`;

    try {
        const uniquenessCheck = await axios.get(
            `${robleDbUrl}/read`,
            {
                headers: { 'Authorization': userToken },
                params: { tableName: USER_METADATA_TABLE, username: username },
                timeout: AXIOS_TIMEOUT
            }
        );

        const existingRecords = Array.isArray(uniquenessCheck.data)
            ? uniquenessCheck.data
            : (uniquenessCheck.data.rows || []);

        if (existingRecords.length > 0) {
            console.log(`[DEBUG REGISTER] FALLO: Username '${username}' ya está en uso.`);
            return res.status(409).json({ message: 'El username ya está en uso. Por favor, elija otro.' });
        }

        const metadataPayload = {
            username: username,
            id_usuario: userId
        };

        console.log(`[DEBUG REGISTER] Intentando insertar payload:`, metadataPayload);

        const robleResponse = await axios.post(
            `${robleDbUrl}/insert`,
            { tableName: USER_METADATA_TABLE, records: [metadataPayload] },
            { headers: { 'Authorization': userToken } }
        );

        console.log(`[DEBUG ROBLE RESPONSE] Status: ${robleResponse.status}, Data:`, robleResponse.data);

        if (robleResponse.status === 201 || robleResponse.status === 200) {
            if (robleResponse.data?.inserted?.length > 0) {
                console.log(`[DEBUG REGISTER] ÉXITO: Username '${username}' guardado. ID Roble Insertado: ${robleResponse.data.inserted[0]._id}`);
            } else {
                console.error("[DEBUG REGISTER] FALLO SILENCIOSO: Status OK, pero no se devolvieron registros insertados.");
                return res.status(500).json({ message: 'Error interno: Roble no confirmó la inserción.' });
            }
        }

        res.status(201).json({ message: 'Username registrado con éxito.' });

    } catch (error) {
        const errorData = error.response?.data || error.message;
        console.error("[DEBUG REGISTER] ERROR CRÍTICO al guardar:", error.response?.status, errorData);

        if (error.response?.status === 409) {
            return res.status(409).json({ message: 'El username ya está en uso.' });
        }
        res.status(500).json({ message: 'Error interno al registrar el username.' });
    }
};

const verifyToken = async (req, res) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ message: 'Token requerido.' });
        }

        const robleRes = await axios.get(`${ROBLE_AUTH_ENDPOINT}/verify-token`, {
            headers: { Authorization: token },
            timeout: AXIOS_TIMEOUT,
        });

        const data = robleRes.data;
        const id =
            data?.id ||
            data?.user?.id ||
            data?.user?.sub ||
            data?.sub;

        if (!id) {
            console.error('Estructura inesperada en verify-token:', data);
            return res.status(500).json({
                message: 'Estructura inesperada de verificación de Roble.',
            });
        }

        return res.json({
            message: 'Token válido.',
            user: {
                id,
                email: data?.user?.email || data?.email,
                role: data?.user?.role || data?.role,
                dbName: data?.user?.dbName || data?.dbName,
            },
        });
    } catch (error) {
        const status = error.response?.status || 500;
        console.error(
            'Fallo al verificar token en Roble:',
            error.response?.data || error.message
        );
        res
            .status(status)
            .json(
                error.response?.data || {
                    message: 'Error en la verificación del token de Roble.',
                }
            );
    }
};


const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'El refreshToken es requerido.' });
        }

        const robleRes = await axios.post(`${ROBLE_AUTH_ENDPOINT}/refresh-token`, { refreshToken }, axiosConfig);
        res.json(robleRes.data);

    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Fallo al renovar el token.' });
    }
};

const logout = async (req, res) => {
    try {
        const accessToken = req.headers.authorization;

        if (!accessToken) {
            return res.status(400).json({ message: 'El accessToken es requerido para cerrar la sesión.' });
        }

        const robleRes = await axios.post(
            `${ROBLE_AUTH_ENDPOINT}/logout`,
            null,
            {
                headers: { Authorization: accessToken },
                timeout: AXIOS_TIMEOUT,
            }
        );

        res.status(robleRes.status).json(robleRes.data);

    } catch (error) {
        console.error("Fallo al cerrar sesión en Roble:", error.response?.data || error.message);
        const status = error.response?.status === 401 ? 200 : (error.response?.status || 500);
        res.status(status).json(error.response?.data || { message: 'Fallo al cerrar sesión.' });
    }
};

module.exports = {
    isValidUsername,
    getUserIdFromToken,
    login,
    signupDirect,
    verifyToken,
    refreshToken,
    logout,
    registerUserMetadata,
    checkUserMetadata,
    attachUserMetadata,
};

console.log('[DEBUG CONTROLLER] Module loaded successfully.');