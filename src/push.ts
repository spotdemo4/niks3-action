import * as core from "@actions/core";
import * as exec from "@actions/exec";
import type { Package } from "./nix.ts";
import * as nix from "./nix.ts";

async function main() {
	core.info("Collecting packages");
	const init: Package[] = JSON.parse(core.getState("packages"));
	const now = await nix.packages();

	core.info("Getting substituters");
	const stores = await nix.substituters();
	const packages: Package[] = [];

	core.info("Verifying packages");
	pkgLoop: for (const pkg of now) {
		if (init.some((p) => p.narHash === pkg.narHash)) {
			continue;
		}

		for (const store of stores) {
			if (await nix.verify(pkg, store)) {
				continue pkgLoop;
			}
		}

		packages.push(pkg);
	}

	const server_url = core.getState("server-url");
	const auth_token = core.getState("auth-token");

	core.startGroup(`Pushing ${packages.length} packages to cache`);
	for (const pkg of packages) {
		await exec.exec("niks3", [
			"push",
			"--server-url",
			server_url,
			"--auth-token",
			auth_token,
			`${pkg.storeDir}/${pkg.name}`,
		]);
	}
	core.endGroup();
}

try {
	await main();
} catch (error) {
	if (error instanceof Error) core.setFailed(error.message);
}
