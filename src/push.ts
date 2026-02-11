import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as nix from "./nix.ts";

async function main() {
	if (core.getState("state") !== "ok") {
		core.info("Did not successfully initialize, skipping push");
		return;
	}

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

	if (paths.size === 0) {
		core.info("No new packages to push");
		return;
	}

	let server_url = core.getInput("server-url", { required: false });
	let auth_token = core.getInput("auth-token", { required: false });
	const audience = core.getInput("audience", { required: false });
	const max_concurrent_uploads = core.getInput("max-concurrent-uploads", {
		required: false,
	});

	core.startGroup(`Pushing ${paths.size} packages to cache`);

	for (const path of paths) {
		if (audience) {
			server_url = audience;
			auth_token = await core.getIDToken(audience);
		}

		await exec.exec(
			"niks3",
			[
				"push",
				"--server-url",
				server_url,
				"--auth-token",
				auth_token,
				"--max-concurrent-uploads",
				max_concurrent_uploads || "30",
				path,
			],
			{
				ignoreReturnCode: true,
			},
		);
	}

	core.endGroup();
}

try {
	await main();
} catch (error) {
	if (error instanceof Error) core.setFailed(error.message);
}
