import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as nix from "./nix.ts";

async function main() {
	core.info("Collecting packages");
	const init: Set<string> = new Set(JSON.parse(core.getState("packages")));
	const now = await nix.packages();

	core.info("Filtering packages");
	const paths = new Set<string>();
	for (const [name, pkg] of now) {
		// Don't cache packages that aren't built locally
		if (!pkg.ultimate) {
			continue;
		}

		// Don't cache packages that were there before the action started
		if (init.has(name)) {
			continue;
		}

		paths.add(`${pkg.storeDir}/${name}`);
	}

	let server_url: string;
	let auth_token: string;
	const audience = core.getInput("audience", { required: false });
	if (audience) {
		core.info("Using OIDC authentication");
		server_url = audience;
		auth_token = await core.getIDToken(audience);
	} else {
		core.info("Using token authentication");
		server_url = core.getInput("server-url", { required: true });
		auth_token = core.getInput("auth-token", { required: true });
	}

	core.startGroup(`Pushing ${paths.size} packages to cache`);
	for (const path of paths) {
		await exec.exec("niks3", [
			"push",
			"--server-url",
			server_url,
			"--auth-token",
			auth_token,
			path,
		]);
	}
	core.endGroup();
}

try {
	await main();
} catch (error) {
	if (error instanceof Error) core.setFailed(error.message);
}
