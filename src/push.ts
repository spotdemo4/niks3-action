import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { Chalk } from "chalk";
import * as nix from "./nix.ts";

const chalk = new Chalk({ level: 2 });

async function main() {
	if (core.getState("state") !== "ok") {
		core.info(chalk.red("Did not successfully initialize, skipping push"));
		return;
	}

	core.info("Collecting packages");
	const init: Set<string> = new Set(JSON.parse(core.getState("packages")));
	const now = await nix.packages();
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
		core.info(chalk.green("No new packages to push"));
		return;
	}

	const server_url = core.getInput("server-url", { required: false });
	const auth_token = core.getInput("auth-token", { required: false });
	const audience = core.getInput("audience", { required: false });
	const max = core.getInput("max-concurrent-uploads", { required: false });
	const verify = core.getInput("verify-s3-integrity", { required: false });

	core.info(chalk.cyan(`Pushing ${chalk.bold(paths.size)} packages to cache`));
	for (const path of paths) {
		const args = ["push"];

		if (server_url && auth_token) {
			args.push("--server-url", server_url, "--auth-token", auth_token);
		} else if (audience) {
			args.push(
				"--server-url",
				audience,
				"--auth-token",
				await core.getIDToken(audience),
			);
		} else {
			throw new Error(
				"Either server-url and auth-token or audience must be provided",
			);
		}
		if (max) {
			args.push("--max-concurrent-uploads", max);
		}
		if (verify.toLowerCase() === "true") {
			args.push("--verify-s3-integrity");
		}
		if (core.isDebug()) {
			args.push("--debug");
		}
		args.push(path);

		core.startGroup(nix.format(path));
		const code = await exec.exec("niks3", args, {
			ignoreReturnCode: true,
		});
		if (code !== 0) {
			core.warning(`niks3 push failed for ${path}`);
		}
		core.endGroup();
	}
}

try {
	await main();
} catch (error) {
	if (error instanceof Error) core.setFailed(error.message);
}
