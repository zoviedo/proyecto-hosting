const axios = require('axios');

const AUTH_SERVICE_URL = 'http://roble-auth-service:3000';
const AXIOS_TIMEOUT = 30000;

exports.verifyUserToken = async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. Token no provisto.' });
    }

    try {
        const verificationRes = await axios.get(`${AUTH_SERVICE_URL}/verify-token`, {
            headers: { Authorization: token },
            timeout: AXIOS_TIMEOUT
        });

        const data = verificationRes.data;

        const userId =
            data?.user?.id ||
            data?.id ||
            data?.data?.id;

        if (!userId) {
            console.error("verify-token devolvió formato inesperado:", data);
            throw new Error('No se encontró userId en la respuesta del Auth Service.');
        }

        req.userId = userId;
        req.userToken = token;
        next();

    } catch (error) {
        console.error("[AUTH FAIL]", error.response?.status, error.response?.data || error.message);
        res.status(401).json({ message: 'Token de sesión inválido o expirado.' });
    }
};
