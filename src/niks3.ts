import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";

async function download() {
	if (process.platform === "darwin") {
		if (process.arch === "arm64") {
			return await tc.downloadTool(
				"https://github.com/Mic92/niks3/releases/download/v1.3.0/niks3_Darwin_arm64.tar.gz",
			);
		} else if (process.arch === "x64") {
			return await tc.downloadTool(
				"https://github.com/Mic92/niks3/releases/download/v1.3.0/niks3_Darwin_x86_64.tar.gz",
			);
		} else {
			throw new Error(`Unsupported architecture: ${process.arch}`);
		}
	} else if (process.platform === "linux") {
		if (process.arch === "arm64") {
			return await tc.downloadTool(
				"https://github.com/Mic92/niks3/releases/download/v1.3.0/niks3_Linux_arm64.tar.gz",
			);
		} else if (process.arch === "x64") {
			return await tc.downloadTool(
				"https://github.com/Mic92/niks3/releases/download/v1.3.0/niks3_Linux_x86_64.tar.gz",
			);
		} else {
			throw new Error(`Unsupported architecture: ${process.arch}`);
		}
	} else {
		throw new Error(`Unsupported platform: ${process.platform}`);
	}
}

export async function install() {
	const findPath = tc.find("niks3", "1.3.0", process.arch);
	if (findPath) {
		core.addPath(findPath);
		return;
	}

	const archivePath = await download();
	const extractedPath = await tc.extractTar(archivePath);
	const cachedPath = await tc.cacheDir(
		extractedPath,
		"niks3",
		"1.3.0",
		process.arch,
	);
	core.addPath(cachedPath);
}
