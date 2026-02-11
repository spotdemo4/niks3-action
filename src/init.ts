import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as httpc from "@actions/http-client";
import * as io from "@actions/io";
import * as niks3 from "./niks3.ts";
import * as nix from "./nix.ts";

async function main() {
	let server = core.getInput("audience", { required: false });
	if (server) {
		core.info("Using OIDC authentication");
		await core.getIDToken(server);
	} else {
		core.info("Using token authentication");
		core.getInput("auth-token", { required: true });
		server = core.getInput("server-url", { required: true });
	}

	core.info(`Checking connectivity to ${server}`);
	const client = new httpc.HttpClient();
	const resp = await client.head(server);
	// client.dispose();
	resp.message.destroy();
	if (!resp.message.statusCode || resp.message.statusCode >= 400) {
		throw new Error(
			`Failed to connect to ${server}: ${resp.message.statusCode} ${resp.message.statusMessage}`,
		);
	}

	core.info("Collecting packages");
	const packages = await nix.packages();
	core.saveState("packages", JSON.stringify(Array.from(packages.keys())));

	try {
		await io.which("niks3", true);
		core.info("Niks3 is already installed, skipping installation");
	} catch {
		core.startGroup("Installing niks3");

		const inputs = core.getInput("inputs-from");
		if (inputs) {
			// Install using nix profile
			await exec.exec("nix", [
				"profile",
				"add",
				"--inputs-from",
				inputs,
				"github:Mic92/niks3",
			]);
		} else {
			// Install using tool-cache
			await niks3.install();
		}

		core.endGroup();
	}

	core.saveState("state", "ok");
}

try {
	await main();
} catch (error) {
	if (error instanceof Error) core.setFailed(error.message);
}
