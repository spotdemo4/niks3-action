import * as exec from "@actions/exec";
import { Chalk } from "chalk";

const chalk = new Chalk({ level: 2 });

export type ContentAddress = {
	hash: string;
	method: string;
};

export type Package = {
	ca: ContentAddress;
	deriver: string | null;
	narHash: string;
	narSize: number;
	references: string[];
	registrationTime: number;
	signatures: string[];
	storeDir: string;
	ultimate: boolean;
	version: number;
};

export async function packages() {
	const info = await exec.getExecOutput(
		"nix",
		["path-info", "--all", "--json", "--json-format", "2"],
		{
			silent: true,
		},
	);
	const parsed: { info: Record<string, Package> } = JSON.parse(info.stdout);

	const packages = new Map<string, Package>();
	for (const [name, info] of Object.entries(parsed.info)) {
		// Skip derivations
		if (name.endsWith(".drv")) {
			continue;
		}

		packages.set(name, info);
	}

	return packages;
}

export async function validate(store: string) {
	const info = await exec.getExecOutput(
		"nix",
		["store", "info", "--store", store],
		{
			silent: true,
			ignoreReturnCode: true,
		},
	);

	return info.exitCode === 0;
}

const pathRegex = /(?<store>.*)\/(?<hash>.*?)-(?<name>.*)/g;

export function format(path: string) {
	const match = pathRegex.exec(path);
	if (!match?.groups?.store || !match?.groups?.hash || !match?.groups?.name) {
		return path;
	}

	return `${match.groups.store}/${chalk.magenta(match.groups.hash)}-${chalk.cyan(match.groups.name)}`;
}
