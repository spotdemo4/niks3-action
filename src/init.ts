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
	const client = new httpc.HttpClient("niks3-action", undefined, {
		allowRedirects: false,
	});
	const head = await client
		.head(server)
		.then((r) => r.readBody().then(() => r.message));
	if (!head.statusCode || head.statusCode >= 400) {
		throw new Error(
			`Failed to connect to ${server}: ${head.statusCode} ${head.statusMessage}`,
		);
	}

	if (head.statusCode === 301 && head.headers.location) {
		core.info(`Validating store ${head.headers.location}`);
		if (!nix.validate(head.headers.location)) {
			throw new Error(
				`Failed to validate store ${head.headers.location}: does not appear to be a binary cache`,
			);
		}
	}

	core.info("Collecting packages");
	const packages = await nix.packages();
	core.saveState("packages", JSON.stringify(Array.from(packages.keys())));

	const path = await io.which("niks3");
	if (!path) {
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
