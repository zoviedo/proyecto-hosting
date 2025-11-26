const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');

const TEMP_BASE_PATH = path.join(__dirname, 'temp_clones');

exports.cloneAndPrepareRepo = async (urlRepo, projectName, templateType) => {
    const safeProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const projectPath = path.join(TEMP_BASE_PATH, safeProjectName);

    try {
        if (await fs.pathExists(projectPath)) {
            console.log(`Carpeta ${projectPath} ya existe, limpiando...`);
            await fs.remove(projectPath);
        }

        await fs.ensureDir(TEMP_BASE_PATH);

        console.log(`Iniciando clonación de ${urlRepo} en ${projectPath}...`);

        const git = simpleGit();

        await git.clone(urlRepo, projectPath, [
            '--depth', '1',
            '--config', 'http.sslVerify=false'
        ]);

        console.log(`Repositorio clonado exitosamente en ${projectPath}`);

        const files = await fs.readdir(projectPath);
        if (files.length === 0) {
            throw new Error("El repositorio se clonó pero la carpeta está vacía.");
        }

        return projectPath;

    } catch (error) {
        console.error(`Error crítico clonando repo ${urlRepo}:`, error);
        await fs.remove(projectPath).catch(() => { });
        throw new Error(`Fallo al clonar el repositorio: ${error.message}`);
    }
};

exports.cleanTemp = async (projectName) => {
    const safeProjectName = projectName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const projectPath = path.join(TEMP_BASE_PATH, safeProjectName);
    try {
        await fs.remove(projectPath);
        console.log(`Carpeta temporal ${projectPath} limpiada.`);
    } catch (error) {
        console.error(`Error limpiando carpeta temporal ${projectPath}:`, error.message);
    }
};