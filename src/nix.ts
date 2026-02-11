import * as exec from "@actions/exec";

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

export function name(path: string) {
	const match = pathRegex.exec(path);
	if (!match || !match.groups) {
		throw new Error(`Failed to parse store path ${path}`);
	}

	return match.groups.name;
}
