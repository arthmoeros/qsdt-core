import * as fs from "fs";
import * as shelljs from "shelljs";

import { tmpFilesFolder, configurationsFolder } from "./paths";
import { MainWorker } from "./main.worker";
import { ServerConfig } from "./server-config";

/**
 * @class ArtifacterApi
 * 
 * This class provides all four available operations on Artifacter, if it is required
 * to handle artifact generation programmaticly, it can be done using an instance
 * of this class.
 */
export class ArtifacterApi {

    /**
     * Requests an artifact generation, it requires a valid Request Object to work,
     * when the request is done, an UUID number is returned to request the resulting
     * artifacts from the generation.
     * @param request Request Object based on an existing configuration
     */
    public requestArtifactGeneration(request: {}): string {
        let generatorName: string = request["$generator"];
        let task: string = request["$task"];
        if (ServerConfig.readConfig.debugInputMaps) {
            console.log("[DEBUG] Got input map with following values:");
            console.log(request);
        }
        if (generatorName == null || task == null) {
            throw new Error("500 Request Object is not valid");
        }
        let worker: MainWorker = new MainWorker();
        return worker.run(generatorName, task, request);
    }

    /**
     * Retrieves the generated artifacts in a ZIP file, this file is stored temporarily,
     * once is retrieved it is deleted.
     * @param uuid Identifier for the generated artifacts
     */
    public getGeneratedArtifacts(uuid: string): Buffer {
        if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid)) {
            throw new Error("400 UUID Invalid Format");
        }

        if (!fs.existsSync(tmpFilesFolder + "/" + uuid + ".zip")) {
            throw new Error("404 Artifacts not found");
        }

        let zipFile: Buffer = fs.readFileSync(tmpFilesFolder + "/" + uuid + ".zip");
        shelljs.rm("-f", tmpFilesFolder + "/" + uuid + ".zip");
        return zipFile;
    }

    /**
     * Retrieves a list of presumably valid configurations ids on the configuration path
     * of Artifacter
     */
    public getConfigurations(): string[] {
        let configList: string[] = fs.readdirSync(configurationsFolder + "configuration/");
        let response: string[] = [];
        configList.forEach(config => {
            let jsonIndex: number = config.indexOf(".json");
            if (jsonIndex == -1) {
                return;
            }
            response.push(config.substring(0, jsonIndex));
        });
        if (response.length == 0) {
            throw new Error("404 No configurations found");
        }
        return response;
    }

    /**
     * Retrieves the contents of a identified configuration file on Artifacter
     * @param id configuration identifier
     */
    public getConfiguration(id: string): string {
        if (/[/\\]/.test(id)) {
            throw new Error("400 ID is invalid");
        }
        if (id != null) {
            if (!fs.existsSync(configurationsFolder + "configuration/" + id + ".json")) {
                throw new Error("404 Configuration does not exist");
            }
            return fs.readFileSync(configurationsFolder + "configuration/" + id + ".json").toString();
        } else {
            throw new Error("400 ID is invalid");
        }
    }

}