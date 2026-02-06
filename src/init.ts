import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as devalue from "devalue";
import * as nix from "./nix.ts";

async function main() {
	core.info("Collecting packages");
	const packages = await nix.packages();
	core.saveState("packages", devalue.stringify(new Set(packages.keys())));

	const audience = core.getInput("audience", { required: false });
	if (audience) {
		core.info("Using OIDC authentication");
		const id_token = await core.getIDToken(audience);

		core.saveState("server-url", audience);
		core.saveState("auth-token", id_token);
	} else {
		const server_url = core.getInput("server-url", { required: true });
		const auth_token = core.getInput("auth-token", { required: true });

		core.saveState("server-url", server_url);
		core.saveState("auth-token", auth_token);
	}

	try {
		await io.which("niks3", true);
		core.info("Niks3 is already installed, skipping installation");
	} catch {
		core.startGroup("Installing niks3");
		const inputs = core.getInput("inputs-from");
		if (inputs) {
			await exec.exec("nix", [
				"profile",
				"add",
				"--inputs-from",
				inputs,
				"github:Mic92/niks3",
			]);
		} else {
			await exec.exec("nix", ["profile", "add", "github:Mic92/niks3"]);
		}
		core.endGroup();
	}
}

try {
	await main();
} catch (error) {
	if (error instanceof Error) core.setFailed(error.message);
}
