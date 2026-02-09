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

	core.startGroup(`Pushing ${paths.size} packages to cache`);
	const server_url = core.getState("server-url");
	const auth_token = core.getState("auth-token");
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
