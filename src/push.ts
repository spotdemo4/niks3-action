import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as devalue from "devalue";
import * as nix from "./nix.ts";

async function main() {
	core.info("Collecting packages");
	const init: Set<string> = devalue.parse(core.getState("packages"));
	const now = await nix.packages();

	core.info("Getting substituters");
	const substituters = await nix.substituters();

	core.info("Verifying packages");
	const paths = new Set<string>();
	const references = new Set<string>();
	pkgLoop: for (const [name, pkg] of now) {
		// Don't cache packages that were there before the action started
		if (init.has(name)) {
			continue;
		}

		// Assume references are already cached if their parent was cached
		if (references.has(name)) {
			continue;
		}

		// Verify if package is already in any of the substituters
		for (const store of substituters) {
			if (await nix.verify(name, pkg, store)) {
				// Add references so we don't have to verify them later
				pkg.references.forEach((r) => {
					references.add(r);
				});

				continue pkgLoop;
			}
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
